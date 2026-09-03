// ================= SPRITES DE EFEITOS GLOBAIS =================
// Tiros, resgate, explosão, partículas e escudo são compartilhados por todas
// as fases e permanecem leves graças aos arquivos WebP já reduzidos.
const EFFECT_SPRITES = {
    playerBullet: { file: 'assets/effects/tiro-jogador.webp', glow: '#27eaff' },
    enemyBullet:  { file: 'assets/effects/tiro-inimigo.webp', glow: '#ff287e' },
    survivor:     { file: 'assets/effects/sobrevivente.webp', glow: '#41dcff' },
    explosion:    { file: 'assets/effects/explosao.webp', glow: '#ff7a16' },
    particle:     { file: 'assets/effects/particula.webp', glow: '#ffffff' },
    shield:       { file: 'assets/effects/escudo.webp', glow: '#20ddff' }
};

const EffectSpriteManager = (() => {
    const keyFor = name => 'effect-' + name;

    function loadAll() {
        return Promise.allSettled(Object.keys(EFFECT_SPRITES).map(name => {
            const def = EFFECT_SPRITES[name];
            return AssetManager.loadSharedImage(keyFor(name), def.file);
        }));
    }

    function get(name) {
        return AssetManager.getSharedImage(keyFor(name));
    }

    function draw(name, centerX, centerY, width, height, options) {
        const def = EFFECT_SPRITES[name];
        const image = def && get(name);
        if (!def || !image || !image.naturalWidth || !image.naturalHeight) return false;

        const opts = options || {};
        const profile = typeof GraphicsManager !== 'undefined' ? GraphicsManager.profile() : null;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(opts.rotation || 0);
        ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
        ctx.globalCompositeOperation = opts.additive && (!profile || profile.additive) ? 'lighter' : 'source-over';
        ctx.imageSmoothingEnabled = false;
        if (!profile || profile.glows) {
            ctx.shadowColor = opts.glow || def.glow;
            const requestedBlur = opts.glowBlur === undefined ? 8 : opts.glowBlur;
            ctx.shadowBlur = profile ? Math.min(requestedBlur, profile.glowCap || requestedBlur) : requestedBlur;
        }
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
    }

    return { loadAll, get, draw };
})();

EffectSpriteManager.loadAll().catch(error => console.warn('[EffectSpriteManager]', error));
