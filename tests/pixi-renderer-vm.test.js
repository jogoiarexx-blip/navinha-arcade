const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Texture {
    constructor(base) { this.baseTexture = base || { scaleMode: 0 }; this.destroyed = false; }
    destroy() { this.destroyed = true; }
    static from() { return new Texture({ scaleMode: 0 }); }
}
Texture.WHITE = new Texture();
Texture.EMPTY = new Texture();
class Sprite {
    constructor(texture) {
        this.texture = texture;
        this.anchor = { set: () => {} };
        this.scale = { set: () => {} };
        this.visible = true;
    }
    destroy() { this.destroyed = true; }
}
class Container {
    constructor() { this.children = []; this.scale = { set: (x, y) => { this.scaleValue = [x, y]; } }; }
    addChild(...children) { this.children.push(...children); }
}
class Application {
    constructor(options) {
        this.stage = new Container();
        this.renderer = {
            type: 1,
            width: options.width,
            height: options.height,
            renders: 0,
            resize: (w, h) => { this.renderer.width = w; this.renderer.height = h; },
            render: () => { this.renderer.renders++; }
        };
    }
}

const gradientContext = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {}
};
const gpuCanvas = { width: 480, height: 720 };
const gameCanvas = { width: 360, height: 540 };
const context = vm.createContext({
    console,
    window: null,
    location: { protocol: 'https:' },
    document: {
        getElementById: id => id === 'pixiCanvas' ? gpuCanvas : null,
        createElement: type => {
            assert.strictEqual(type, 'canvas');
            return { width: 0, height: 0, getContext: () => gradientContext };
        },
        head: { appendChild: () => {} }
    },
    PIXI: {
        Application, Texture, Sprite, Container,
        BaseTexture: class { static from(source) { return { source }; } },
        RENDERER_TYPE: { WEBGL: 1 },
        SCALE_MODES: { LINEAR: 1, NEAREST: 0 }, utils:{string2hex:()=>0xffffff}
    },
    canvas: gameCanvas,
    W: 480,
    H: 720,
    currentLevel: 1,
    phaseBackgroundScroll: 0,
    starsFar: [{ x: 1, y: 2, size: 1, alphaBase: .5, twinklePhase: 0 }],
    stars: [{ x: 3, y: 4, size: 2, alphaBase: .7, twinklePhase: 1 }],
    starsNear: [],
    getLevelTheme: () => ({ bgTop: '#001122', bgBottom: '#000000' }),
    AssetManager: { getLevelImage: () => null },
    GraphicsManager:{profile:()=>({animatedBackground:false,spriteParticles:false,particleCap:24})},gameState:'START',player:{},selectedShip:0,SHIP_DEFS:[{renderH:72}],bullets:[],enemyBullets:[],enemies:[],powerups:[],particles:[],ShipSpriteManager:{get:()=>null},EffectSpriteManager:{get:()=>null},PowerupSpriteManager:{get:()=>null},SHARED_ENEMY_SPRITES:{},
    Math
});
context.window = context;

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'pixi-renderer.js'), 'utf8');
vm.runInContext(source, context);
assert.strictEqual(vm.runInContext('PixiRenderer.isActive()', context), true);
vm.runInContext('PixiRenderer.renderFrame()', context);
assert.strictEqual(vm.runInContext('PixiRenderer.isActive()', context), true);
assert.strictEqual(vm.runInContext('PixiRenderer.drawsPhaseBackground()', context), false);
assert.strictEqual(vm.runInContext('PixiRenderer.drawsGameplay()', context), false);
assert.strictEqual(vm.runInContext('PixiRenderer.resize(); W', context), 480);
console.log('PIXIJS / WEBGL HÍBRIDO: PASS');
