// ================= RENDERIZADOR GPU PIXIJS =================
// Camada híbrida e não destrutiva. Fundos e estrelas são enviados ao WebGL;
// gameplay/HUD continuam no Canvas 2D. Se Pixi/WebGL falharem, game.js usa o
// caminho Canvas original automaticamente.
const PixiRenderer = (() => {
    const PIXI_URL = 'vendor/pixi.min.js';
    const gpuCanvas = document.getElementById('pixiCanvas');
    let app = null;
    let active = false;
    let initializing = false;
    let gradientSprite = null;
    let gradientTexture = null;
    let gradientKey = '';
    let phaseSprite = null;
    let phaseTexture = null;
    let phaseImage = null;
    let starContainer = null;
    let starSprites = [];
    let entityContainer=null;const pools={};const imageTextures=new WeakMap();
    function textureFor(image){if(!image||!image.complete||!image.naturalWidth)return PIXI.Texture.WHITE;let t=imageTextures.get(image);if(!t){t=new PIXI.Texture(PIXI.BaseTexture.from(image,{scaleMode:PIXI.SCALE_MODES.NEAREST}));imageTextures.set(image,t);}return t;}
    function syncPool(name,items,configure){const pool=pools[name]||(pools[name]=[]);while(pool.length<items.length){const s=new PIXI.Sprite(PIXI.Texture.WHITE);s.anchor.set(.5);entityContainer.addChild(s);pool.push(s);}pool.forEach((s,i)=>{s.visible=i<items.length;if(s.visible)configure(s,items[i]);});}
    function syncGameplay(){const visible=['PLAYING','PAUSED','LEVEL_TRANSITION','PHASE_RESULT','GAMEOVER','TUTORIAL'].includes(gameState);entityContainer.visible=visible;if(!visible)return;const shipIndex=player&&Number.isInteger(player.shipType)?player.shipType:selectedShip,shipImage=ShipSpriteManager.get(shipIndex);syncPool('player',player&&player.w?[player]:[],(s,p)=>{const d=SHIP_DEFS[shipIndex]||SHIP_DEFS[0];s.texture=textureFor(shipImage);s.tint=shipImage?0xffffff:0x25bfff;s.alpha=p.invincible>0&&Math.floor(p.invincible/4)%2?0:1;s.x=p.x+p.w/2;s.y=p.y+p.h/2;s.width=Math.max(p.w,(d.renderH||p.h)*.72);s.height=d.renderH||p.h;s.rotation=0;});syncPool('bullets',bullets,(s,b)=>{s.texture=textureFor(EffectSpriteManager.get('playerBullet'));s.tint=0x65f7ff;s.alpha=1;s.x=b.x+b.w/2;s.y=b.y+b.h/2;s.width=Math.max(7,b.w*1.7);s.height=Math.max(20,b.h*1.7);s.rotation=Math.atan2(b.vx||0,b.speed||10);});syncPool('enemyBullets',enemyBullets,(s,b)=>{s.texture=textureFor(EffectSpriteManager.get('enemyBullet'));s.tint=PIXI.utils.string2hex(b.color||'#ff287e');s.alpha=1;s.x=b.x+b.w/2;s.y=b.y+b.h/2;s.width=Math.max(8,b.w*1.7);s.height=Math.max(20,b.h*1.7);s.rotation=0;});syncPool('enemies',enemies,(s,e)=>{let image=null,scale=2;if(e.type==='boss'){image=AssetManager.getLevelImage('phase'+currentLevel+'-boss');scale=1.32;}else if(SHARED_ENEMY_SPRITES[e.type]){const d=SHARED_ENEMY_SPRITES[e.type];image=AssetManager.getSharedImage(d.key);scale=d.width||2;}s.texture=textureFor(image);s.tint=image?0xffffff:0xff3355;s.alpha=1;s.x=e.x+e.w/2;s.y=e.y+e.h/2;s.width=e.w*scale;s.height=e.h*scale;s.rotation=e.type==='spinner'?(e.spinAngle||0):0;});syncPool('powerups',powerups,(s,p)=>{const image=PowerupSpriteManager.get(p.type);s.texture=textureFor(image);s.tint=image?0xffffff:0x55ff88;s.alpha=1;s.x=p.x+p.w/2;s.y=p.y+p.h/2;s.width=s.height=36;s.rotation=p.angle||0;});const pr=GraphicsManager.profile(),list=pr.spriteParticles?particles.slice(-pr.particleCap):[];syncPool('particles',list,(s,p)=>{const image=EffectSpriteManager.get(p.effect==='explosion'?'explosion':'particle');s.texture=textureFor(image);s.tint=PIXI.utils.string2hex(p.color||'#fff');s.alpha=Math.max(0,p.life/(p.maxLife||40));s.x=p.x;s.y=p.y;s.width=s.height=Math.max(3,p.size*(p.effect==='explosion'?2.2:1.5));s.rotation=p.rotation||0;});}

    function makeGradient(theme) {
        const key = currentLevel + ':' + theme.bgTop + ':' + theme.bgBottom;
        if (gradientTexture && gradientKey === key) return;
        if (gradientTexture) gradientTexture.destroy(true);
        const source = document.createElement('canvas');
        source.width = 2;
        source.height = 256;
        const sourceCtx = source.getContext('2d');
        const gradient = sourceCtx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, theme.bgTop || '#020510');
        gradient.addColorStop(1, theme.bgBottom || '#000000');
        sourceCtx.fillStyle = gradient;
        sourceCtx.fillRect(0, 0, 2, 256);
        gradientTexture = PIXI.Texture.from(source);
        gradientTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        gradientSprite.texture = gradientTexture;
        gradientKey = key;
    }

    function syncPhaseBackground() {
        const image = typeof AssetManager !== 'undefined' ? AssetManager.getLevelImage('phase'+currentLevel+'-background') : null;
        if (!image || !image.complete || !image.naturalWidth || location.protocol === 'file:') {
            phaseSprite.visible = false;
            if (phaseTexture) phaseTexture.destroy(true);
            phaseTexture = null;
            phaseImage = null;
            phaseSprite.texture = PIXI.Texture.EMPTY;
            return;
        }
        if (phaseImage !== image) {
            if (phaseTexture) phaseTexture.destroy(true);
            phaseTexture = new PIXI.Texture(PIXI.BaseTexture.from(image, { scaleMode: PIXI.SCALE_MODES.NEAREST }));
            phaseSprite.texture = phaseTexture;
            phaseImage = image;
        }
        const profile = GraphicsManager.profile();
        const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight);
        const drawHeight = image.naturalHeight * scale;
        const maxPan = Math.max(0, drawHeight - H);
        const panY = profile.animatedBackground
            ? maxPan * (0.5 - 0.5 * Math.cos(phaseBackgroundScroll)) : maxPan / 2;
        phaseSprite.visible = true;
        phaseSprite.alpha = profile.animatedBackground ? 0.9 : 0.78;
        phaseSprite.anchor.set(0.5, 0);
        phaseSprite.x = W / 2;
        phaseSprite.y = -panY;
        phaseSprite.width = image.naturalWidth * scale;
        phaseSprite.height = drawHeight;
    }

    function syncStars() {
        const layers = [
            { items: starsFar, tint: 0x555577, pulse: [0.75, 0.25] },
            { items: stars, tint: 0xffffff, pulse: [0.70, 0.30] },
            { items: starsNear, tint: 0xaaeeff, pulse: [0.65, 0.35] }
        ];
        const wanted = layers.reduce((sum, layer) => sum + layer.items.length, 0);
        while (starSprites.length < wanted) {
            const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
            starContainer.addChild(sprite);
            starSprites.push(sprite);
        }
        while (starSprites.length > wanted) starSprites.pop().destroy();
        let index = 0;
        layers.forEach(layer => layer.items.forEach(star => {
            const sprite = starSprites[index++];
            sprite.tint = layer.tint;
            sprite.x = star.x;
            sprite.y = star.y;
            sprite.width = Math.max(1, star.size);
            sprite.height = Math.max(1, star.size);
            sprite.alpha = star.alphaBase * (layer.pulse[0] + layer.pulse[1] * Math.sin(star.twinklePhase));
            sprite.visible = true;
        }));
    }

    function resize() {
        if (!app || !gpuCanvas) return;
        const width = canvas.width;
        const height = canvas.height;
        if (app.renderer.width !== width || app.renderer.height !== height) app.renderer.resize(width, height);
        app.stage.scale.set(width / W, height / H);
    }

    function init() {
        if (initializing || active || !gpuCanvas || !window.PIXI) return;
        initializing = true;
        try {
            app = new PIXI.Application({
                view: gpuCanvas,
                width: canvas.width,
                height: canvas.height,
                backgroundAlpha: 1,
                backgroundColor: 0x000000,
                antialias: false,
                autoDensity: false,
                autoStart: false,
                sharedTicker: false,
                powerPreference: 'high-performance'
            });
            if (PIXI.RENDERER_TYPE && app.renderer.type !== PIXI.RENDERER_TYPE.WEBGL) {
                app.destroy(false, { children: true });
                throw new Error('WebGL não foi disponibilizado pelo navegador');
            }
            gradientSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
            phaseSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
            starContainer = new PIXI.Container();
            entityContainer = new PIXI.Container();
            app.stage.addChild(gradientSprite, phaseSprite, starContainer, entityContainer);
            active = true;
            resize();
            console.info('[Navinha] PixiJS/WebGL ativado');
        } catch (error) {
            active = false;
            app = null;
            console.warn('[Navinha] WebGL indisponível; usando Canvas 2D.', error);
        } finally {
            initializing = false;
        }
    }

    function renderFrame() {
        if (!active || !app) return;
        try {
            resize();
            const theme = getLevelTheme(currentLevel);
            makeGradient(theme);
            gradientSprite.x = 0;
            gradientSprite.y = 0;
            gradientSprite.width = W;
            gradientSprite.height = H;
            syncPhaseBackground();
            syncStars();
            // O canvas 2D fica acima da camada Pixi e desenha gameplay/HUD.
            // Não enviamos entidades para a camada inferior: em file:// ou
            // durante o carregamento do background elas poderiam ficar atrás
            // de uma imagem opaca e desaparecer, embora a lógica continuasse.
            if (entityContainer) entityContainer.visible = false;
            app.renderer.render(app.stage);
        } catch (error) {
            active = false;
            console.warn('[Navinha] PixiJS desativado; retomando Canvas 2D.', error);
        }
    }

    function load() {
        if (window.PIXI) { init(); return; }
        // Em file:// a camada vetorial (gradiente + estrelas) ainda usa GPU.
        // Apenas imagens locais ficam no Canvas para evitar bloqueio de origem.
        if (!window.location) return;
        const script = document.createElement('script');
        script.src = PIXI_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = init;
        script.onerror = () => console.warn('[Navinha] PixiJS não carregou; usando Canvas 2D.');
        document.head.appendChild(script);
    }

    load();
    return {
        isActive: () => active,
        statusLabel: () => active ? 'GPU/PIXIJS' : 'CANVAS',
        drawsPhaseBackground: () => !!(active && phaseSprite && phaseSprite.visible),
        // Gameplay permanece no Canvas superior. Pixi acelera apenas o fundo
        // e as estrelas, que são os elementos com maior área de preenchimento.
        drawsGameplay: () => false,
        renderFrame,
        resize
    };
})();
