// ================= RENDERIZADOR GPU PIXIJS =================
// Camada híbrida e não destrutiva. Fundos e estrelas são enviados ao WebGL;
// gameplay/HUD continuam no Canvas 2D. Se Pixi/WebGL falharem, game.js usa o
// caminho Canvas original automaticamente.
const PixiRenderer = (() => {
    const PIXI_URL = 'https://pixijs.download/v7.4.3/pixi.min.js';
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
        const image = currentLevel === 1 && typeof AssetManager !== 'undefined'
            ? AssetManager.getLevelImage('phase1-background') : null;
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
            app.stage.addChild(gradientSprite, phaseSprite, starContainer);
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
        renderFrame,
        resize
    };
})();
