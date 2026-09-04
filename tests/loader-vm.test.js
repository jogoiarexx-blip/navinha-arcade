const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const scriptTags = [];
const canvasListeners = {};
const windowListeners = {};
const noop = () => {};
const gradient = { addColorStop: noop };
const ctx2d = new Proxy({}, {
    get(target, key) {
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
        if (!(key in target)) target[key] = noop;
        return target[key];
    },
    set(target, key, value) { target[key] = value; return true; }
});
const testWidth = Number(process.env.TEST_WIDTH || 480);
const canvas = {
    width: testWidth,
    height: 720,
    style: {},
    getContext: () => ctx2d,
    addEventListener: (type, callback) => { canvasListeners[type] = callback; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: testWidth, height: 720 })
};

let context;
const documentMock = {
    hidden: false,
    fullscreenElement: null,
    getElementById: id => id === 'gameCanvas' ? canvas : null,
    addEventListener: noop,
    createElement(type) {
        assert.strictEqual(type, 'script');
        return {
            tagName: 'SCRIPT',
            dataset: {},
            async: false,
            src: '',
            remove() {
                const index = scriptTags.indexOf(this);
                if (index >= 0) scriptTags.splice(index, 1);
            }
        };
    },
    querySelectorAll(selector) {
        return selector === 'script[data-level-asset]' ? scriptTags.slice() : [];
    },
    body: {
        appendChild(script) {
            scriptTags.push(script);
            setImmediate(() => {
                const cleanUrl = script.src.split('?')[0];
                const filename = path.join(root, cleanUrl);
                if (!fs.existsSync(filename)) {
                    if (script.onerror) script.onerror(new Error('404'));
                    return;
                }
                try {
                    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
                    if (script.onload) script.onload();
                } catch (error) {
                    if (script.onerror) script.onerror(error);
                }
            });
            return script;
        }
    },
    documentElement: {}
};

const storage = new Map([['navinhaTutorialSeen', 'true']]);
context = vm.createContext({
    console,
    document: documentMock,
    localStorage: {
        getItem: key => storage.has(key) ? storage.get(key) : null,
        setItem: (key, value) => storage.set(key, value)
    },
    navigator: {},
    Image: class MockImage {
        constructor() {
            this.naturalWidth = 350;
            this.naturalHeight = 512;
            this.complete = false;
            this._src = '';
        }
        set src(value) {
            this._src = value;
            if (!value) {
                this.complete = false;
                return;
            }
            setImmediate(() => {
                const cleanUrl = value.split('?')[0];
                if (!fs.existsSync(path.join(root, cleanUrl))) {
                    if (this.onerror) this.onerror(new Error('404'));
                    return;
                }
                this.complete = true;
                if (this.onload) this.onload();
            });
        }
        get src() { return this._src; }
    },
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: noop,
    setImmediate,
    Math,
    Date,
    URL,
    Promise,
    requestAnimationFrame: () => 1
});
context.window = context;
context.window.matchMedia = query => ({
    matches: query.includes('max-width') ? testWidth <= 480 : testWidth >= 980
});
context.window.addEventListener = (type, callback) => { windowListeners[type] = callback; };

function run(code) { return vm.runInContext(code, context); }
function waitFor(expression, timeout = 3000) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const poll = () => {
            try {
                if (run(expression)) return resolve();
            } catch (error) { return reject(error); }
            if (Date.now() - started > timeout) return reject(new Error('Timeout: ' + expression));
            setTimeout(poll, 10);
        };
        poll();
    });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sources = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match => match[1]);
for (const source of sources) {
    run(fs.readFileSync(path.join(root, source), 'utf8'));
}

(async () => {
    const expectedSharedAssets = run('1 + Object.keys(POWERUP_SPRITES).length + Object.keys(SHARED_ENEMY_SPRITES).length + Object.keys(EFFECT_SPRITES).length + Object.keys(ENVIRONMENT_SPRITES).length');
    await waitFor(`AssetManager.getStats().sharedAssets === ${expectedSharedAssets} && Object.values(SHARED_ENEMY_SPRITES).every(def => !!AssetManager.getSharedImage(def.key)) && Object.keys(ENVIRONMENT_SPRITES).every(name => !!EnvironmentSpriteManager.get(name))`);
    assert.deepStrictEqual(Array.from(run('GRAPHICS_MODES')), ['AUTOMATICO', 'BAIXO', 'MEDIO', 'ALTO']);
    run("GraphicsManager.setMode('AUTOMATICO')");
    assert.strictEqual(run('GraphicsManager.effective()'), 'BAIXO');
    assert.strictEqual(run('GraphicsManager.displayLabel()'), 'AUTO (BAIXO)');
    assert.strictEqual(run('GraphicsManager.profile().renderFps'), 24);
    const expectedWidths = testWidth <= 480 ? [360, 432, 480] : [512, 768, 1024];
    const expectedHeights = testWidth <= 480 ? [540, 648, 720] : [360, 540, 720];
    ['BAIXO', 'MEDIO', 'ALTO'].forEach((mode, index) => {
        run(`GraphicsManager.setMode('${mode}')`);
        assert.strictEqual(run('GraphicsManager.effective()'), mode);
        assert.strictEqual(run('canvas.width'), expectedWidths[index]);
        assert.strictEqual(run('canvas.height'), expectedHeights[index]);
        assert.strictEqual(run('W'), testWidth <= 480 ? 480 : 1024);
        assert.strictEqual(run('H'), 720);
        assert.strictEqual(run('GraphicsManager.profile().renderFps'), [24, 40, 60][index]);
        run('draw()');
    });
    assert.strictEqual(JSON.parse(storage.get('navinhaGraphicsMode')), 'ALTO');
    assert.strictEqual(run('ShipSpriteManager.getActiveIndex()'), 0);
    const spritePaths = Array.from(run('SHIP_DEFS.map(ship => ship.sprite)'));
    assert.strictEqual(spritePaths.length, 5);
    spritePaths.forEach(sprite => assert.ok(fs.existsSync(path.join(root, sprite)), sprite));
    const powerupPaths = Array.from(run('Object.values(POWERUP_SPRITES).map(def => def.file)'));
    assert.strictEqual(powerupPaths.length, 6);
    powerupPaths.forEach(sprite => assert.ok(fs.existsSync(path.join(root, sprite)), sprite));
    assert.deepStrictEqual(Array.from(run("Object.keys(POWERUP_SPRITES).map(type => !!PowerupSpriteManager.get(type))")), [true, true, true, true, true, true]);
    const sharedEnemyPaths = Array.from(run('Object.values(SHARED_ENEMY_SPRITES).map(def => def.file)'));
    assert.strictEqual(sharedEnemyPaths.length, 7);
    sharedEnemyPaths.forEach(sprite => assert.ok(fs.existsSync(path.join(root, sprite)), sprite));
    const effectPaths = Array.from(run('Object.values(EFFECT_SPRITES).map(def => def.file)'));
    assert.strictEqual(effectPaths.length, 6);
    effectPaths.forEach(sprite => assert.ok(fs.existsSync(path.join(root, sprite)), sprite));
    assert.strictEqual(run("EffectSpriteManager.draw('shield', 50, 50, 80, 80)"), true);
    const environmentPaths = Array.from(run('Object.values(ENVIRONMENT_SPRITES).map(def => def.file)'));
    assert.strictEqual(environmentPaths.length, 8);
    environmentPaths.forEach(sprite => assert.ok(fs.existsSync(path.join(root, sprite)), sprite));
    assert.deepStrictEqual(Array.from(run("Object.keys(ENVIRONMENT_SPRITES).map(type => EnvironmentSpriteManager.draw(type, 50, 50, 40, 40))")), Array(8).fill(true));
    run("GraphicsManager.setMode('ALTO'); particles = []; spawnParticles(10, 10, '#fff', 12)");
    assert.strictEqual(run("particles.some(p => p.effect === 'explosion')"), true);
    run("GraphicsManager.setMode('BAIXO'); particles = []; spawnParticles(10, 10, '#fff', 400)");
    assert.ok(run('particles.length') <= 55);
    assert.strictEqual(run("particles.some(p => p.effect === 'explosion')"), false);
    run("GraphicsManager.setMode('MEDIO')");
    run('particles = []');

    run('shipsUnlocked = [true, true, true, true, true]');
    for (let expected = 1; expected < 5; expected++) {
        run('cycleSelectedShip(1)');
        await waitFor('ShipSpriteManager.getActiveIndex() === ' + expected + ' && AssetManager.getStats().sharedAssets === ' + expectedSharedAssets);
    }

    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), []);
    assert.strictEqual(scriptTags.length, 0);

    run('resetGame()');
    assert.strictEqual(run('gameState'), 'LOADING');
    run('draw()');
    await waitFor("gameState === 'PLAYING'");
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), ['1']);
    assert.deepStrictEqual(scriptTags.map(tag => tag.dataset.levelAsset), ['1']);
    assert.strictEqual(run('AssetManager.getStats().levelAssets'), 3);
    assert.deepStrictEqual(Array.from(run("['phase1-boss','phase1-background'].map(key => !!AssetManager.getLevelImage(key))")), [true, true]);
    assert.deepStrictEqual(Array.from(run("['normal','zigzag','tank'].map(type => !!AssetManager.getSharedImage(SHARED_ENEMY_SPRITES[type].key))")), [true, true, true]);
    assert.strictEqual(run("drawAvailableEnemySprite({type:'normal',x:0,y:0,w:35,h:35})"), true);
    assert.strictEqual(run("drawAvailableEnemySprite({type:'boss',x:0,y:0,w:150,h:100})"), true);

    run('continueToNextLevel()');
    await waitFor("gameState === 'LEVEL_TRANSITION' && currentLevel === 2");
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), ['2']);
    assert.deepStrictEqual(scriptTags.map(tag => tag.dataset.levelAsset), ['2']);
    assert.strictEqual(run('AssetManager.getStats().levelAssets'), 3);
    assert.strictEqual(run("!!AssetManager.getSharedImage(SHARED_ENEMY_SPRITES.normal.key)"), true);
    assert.strictEqual(run("!!AssetManager.getLevelImage('phase2-boss')"), true);
    assert.strictEqual(run("AssetManager.getLevelImage('phase1-boss')"), null);
    assert.strictEqual(run("AssetManager.getLevelImage('phase1-background')"), null);
    assert.strictEqual(run("drawAvailableEnemySprite({type:'normal',x:0,y:0,w:35,h:35})"), true);
    assert.strictEqual(run("drawAvailableEnemySprite({type:'boss',x:0,y:0,w:150,h:100})"), true);

    run("enemies=[]; enemyBullets=[]; bossActive=false; gameState='PLAYING'; spawnBoss(); enemies[0].y=60; enemies[0].health=enemies[0].maxHealth*.2; updateEnemy(enemies[0]); fireBossPattern(enemies[0])");
    assert.strictEqual(run('enemies[0].bossStage'), 3);
    assert.strictEqual(run('enemies[0].bossPattern'), 1);
    assert.strictEqual(run('enemyBullets.length'), 5);
    assert.strictEqual(run('new Set(enemyBullets.map(b => b.x)).size'), 5);
    assert.deepStrictEqual(Array.from(run('enemyBullets.map(b => b.color)')), Array(5).fill('#33ddff'));

    run("gameState = 'PLAYING'; continueToNextLevel()");
    await waitFor("gameState === 'LEVEL_TRANSITION' && currentLevel === 3");
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), ['3']);
    assert.deepStrictEqual(scriptTags.map(tag => tag.dataset.levelAsset), ['3']);
    assert.strictEqual(run('AssetManager.getStats().levelAssets'), 3);
    assert.strictEqual(run("AssetManager.getLevelImage('phase2-boss')"), null);
    assert.strictEqual(run("!!AssetManager.getLevelImage('phase3-boss')"), true);
    assert.strictEqual(run("drawAvailableEnemySprite({type:'boss',x:0,y:0,w:150,h:100})"), true);

    run("enemies=[]; enemyBullets=[]; bossActive=false; gameState='PLAYING'; spawnBoss(); enemies[0].y=60; enemies[0].health=enemies[0].maxHealth*.5; updateEnemy(enemies[0]); fireBossPattern(enemies[0])");
    assert.strictEqual(run('enemies[0].bossStage'), 2);
    assert.strictEqual(run('enemies[0].bossPattern'), 3);
    assert.strictEqual(run('enemyBullets.length'), 3);
    assert.deepStrictEqual(Array.from(run('enemyBullets.map(b => b.color)')), Array(3).fill('#ff8ac8'));
    run("enemyBullets=[]; enemies[0].health=enemies[0].maxHealth*.2; updateEnemy(enemies[0]); enemies[0].telegraphCenter=true; fireBossPattern(enemies[0])");
    assert.strictEqual(run('enemies[0].bossStage'), 3);
    assert.strictEqual(run('enemies[0].bossPattern'), 0);
    assert.deepStrictEqual(Array.from(run('enemyBullets.map(b => b.color)')), ['#ff2a7a','#ff2a7a','#ff8ac8']);

    for(let level=4;level<=10;level++){run("gameState='PLAYING';continueToNextLevel()");await waitFor("gameState==='LEVEL_TRANSITION'&&currentLevel==="+level);assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')),[String(level)]);assert.strictEqual(run('AssetManager.getStats().levelAssets'),3);assert.strictEqual(run("!!AssetManager.getLevelImage('phase"+level+"-boss')"),true);assert.strictEqual(run("!!AssetManager.getLevelImage('phase"+level+"-background')"),true);}

    run('retryLevel()');
    await waitFor("gameState === 'LEVEL_TRANSITION' && currentLevel === 10");
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), ['10']);
    assert.strictEqual(scriptTags.length, 1);

    run("gameState = 'PLAYING'; togglePause()");
    assert.strictEqual(run('gameState'), 'PAUSED');
    run('togglePause()');
    assert.strictEqual(run('gameState'), 'PLAYING');

    run("LevelManager.leaveTo('START')");
    assert.strictEqual(run('gameState'), 'START');
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), []);
    assert.strictEqual(scriptTags.length, 0);
    assert.strictEqual(run("AssetManager.getLevelImage('phase3-boss')"), null);
    assert.strictEqual(run('enemies.length + bullets.length + enemyBullets.length + particles.length + powerups.length'), 0);

    // Exercita os handlers reais de PC e celular no botão JOGAR.
    run('draw()');
    const playButton = run('uiButtons.playButton');
    const pointerEvent = {
        clientX: playButton.x + playButton.w / 2,
        clientY: playButton.y + playButton.h / 2
    };
    if (testWidth <= 480) {
        canvasListeners.touchstart({ preventDefault: noop, touches: [pointerEvent] });
    } else {
        canvasListeners.mousedown(pointerEvent);
    }
    await waitFor("gameState === 'PLAYING'");
    assert.strictEqual(run('currentLevel'), 1);
    run("LevelManager.leaveTo('START')");

    run("PHASE_MANIFEST[2].script = 'js/phases/inexistente.js'; startFromLevel(2)");
    await waitFor("gameState === 'LOADING' && !!LoadingScreen.error");
    assert.strictEqual(run("typeof LoadingScreen.retryAction"), 'function');
    run("PHASE_MANIFEST[2].script = 'js/phases/phase2.js'; LoadingScreen.retry()");
    await waitFor("gameState === 'LEVEL_TRANSITION' && currentLevel === 2");
    assert.deepStrictEqual(Array.from(run('Object.keys(PHASE_DEFS)')), ['2']);
    assert.strictEqual(scriptTags.length, 1);

    console.log('LAYOUT ' + testWidth + 'px: PASS');
    console.log('MENU -> FASE 1: PASS');
    console.log('FASE 1 -> 2 -> 3: PASS');
    console.log('RETRY / PAUSE / MENU: PASS');
    console.log('ERRO + TENTAR NOVAMENTE: PASS');
    console.log('SOMENTE UMA FASE NA MEMÓRIA: PASS');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
