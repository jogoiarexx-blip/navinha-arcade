// ================= SPRITES DE EFEITOS GLOBAIS =================
// Tiros, resgate, explosão, partículas e escudo são compartilhados por todas
// as fases e permanecem leves graças aos arquivos WebP já reduzidos.
const EFFECT_SPRITES = {
    playerBullet: { file: 'assets/effects/tiro-jogador.webp', glow: '#27eaff' },
    enemyBullet:  { file: 'assets/effects/tiro-inimigo.webp', glow: '#ff287e' },
    survivor:     { file: 'assets/animations/survivor-sheet.webp', glow: '#41dcff', sheet: { cols: 4, rows: 2, frames: 8 } },
    explosion:    { file: 'assets/animations/explosion-sheet.webp', glow: '#ff7a16', sheet: { cols: 4, rows: 4, frames: 16 } },
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

    function drawSheetFrame(image, sheet, frameIndex, width, height) {
        const cols = sheet.cols || 1;
        const rows = sheet.rows || 1;
        const total = sheet.frames || (cols * rows);
        const safeFrame = Math.max(0, Math.min(total - 1, frameIndex | 0));
        const frameW = image.naturalWidth / cols;
        const frameH = image.naturalHeight / rows;
        const sx = (safeFrame % cols) * frameW;
        const sy = Math.floor(safeFrame / cols) * frameH;
        ctx.drawImage(image, sx, sy, frameW, frameH, -width / 2, -height / 2, width, height);
    }

    function resolveFrame(name, def, opts) {
        if (!def.sheet) return -1;
        if (typeof opts.frameIndex === 'number') return opts.frameIndex;
        const total = def.sheet.frames || ((def.sheet.cols || 1) * (def.sheet.rows || 1));
        if (name === 'explosion' && typeof opts.progress === 'number') {
            return Math.max(0, Math.min(total - 1, Math.round(opts.progress * (total - 1))));
        }
        if (name === 'survivor') {
            return Math.floor(Date.now() / 120) % total;
        }
        return Math.floor(Date.now() / 100) % total;
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
        if (def.sheet) drawSheetFrame(image, def.sheet, resolveFrame(name, def, opts), width, height);
        else ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
        return true;
    }

    return { loadAll, get, draw };
})();

EffectSpriteManager.loadAll().catch(error => console.warn('[EffectSpriteManager]', error));
