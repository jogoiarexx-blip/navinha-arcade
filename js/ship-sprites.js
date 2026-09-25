// Mantém em memória somente o sprite da nave selecionada. As outras imagens
// continuam no disco e são carregadas sob demanda ao trocar de nave.
const ShipSpriteManager = (() => {
    const CACHE_KEY = 'selected-player-ship';
    let activeIndex = -1;
    let loadToken = 0;

    function loadFor(def) {
        return AssetManager.loadSharedImage(CACHE_KEY, def.animatedSprite || def.sprite);
    }

    function select(index) {
        const safeIndex = Number.isInteger(index) && SHIP_DEFS[index] ? index : 0;
        if (activeIndex === safeIndex && AssetManager.getSharedImage(CACHE_KEY)) {
            return Promise.resolve(AssetManager.getSharedImage(CACHE_KEY));
        }
        activeIndex = safeIndex;
        const token = ++loadToken;
        const def = SHIP_DEFS[safeIndex];
        AssetManager.unloadShared(CACHE_KEY);
        return loadFor(def).catch(error => {
            if (token === loadToken) console.warn('[ShipSpriteManager]', error);
            return null;
        });
    }

    function get(index) {
        const safeIndex = SHIP_DEFS[index] ? index : 0;
        if (safeIndex !== activeIndex) select(safeIndex);
        return AssetManager.getSharedImage(CACHE_KEY);
    }

    function drawFrame(image, cols, rows, frameIndex, dx, dy, dw, dh) {
        const frameW = image.naturalWidth / cols;
        const frameH = image.naturalHeight / rows;
        const total = cols * rows;
        const safe = Math.max(0, Math.min(total - 1, frameIndex | 0));
        const sx = (safe % cols) * frameW;
        const sy = Math.floor(safe / cols) * frameH;
        ctx.drawImage(image, sx, sy, frameW, frameH, dx, dy, dw, dh);
    }

    function animationFrameFor(def, opts) {
        if (!def.animatedSprite) return -1;
        if (typeof opts.frameIndex === 'number') return opts.frameIndex;
        const now = Date.now();
        const idle = [0, 1, 2, 3];
        const firing = [4, 5, 6, 7];
        const damaged = [8, 9, 10, 11];
        if (opts.destroyed) {
            const explosion = [12, 13, 14, 15];
            return explosion[Math.floor(now / 80) % explosion.length];
        }
        if (opts.damage || opts.invincible) {
            return damaged[Math.floor(now / 95) % damaged.length];
        }
        if (opts.firing) {
            return firing[Math.floor(now / 70) % firing.length];
        }
        return idle[Math.floor(now / 110) % idle.length];
    }

    function draw(index, centerX, centerY, targetHeight, options) {
        const image = get(index);
        if (!image || !image.naturalWidth || !image.naturalHeight) return false;
        const opts = options || {};
        const def = SHIP_DEFS[SHIP_DEFS[index] ? index : 0] || SHIP_DEFS[0];
        const height = targetHeight;
        const sourceRatio = def.animatedSprite
            ? (image.naturalWidth / (def.animatedCols || 1)) / (image.naturalHeight / (def.animatedRows || 1))
            : image.naturalWidth / image.naturalHeight;
        const width = height * sourceRatio;
        ctx.save();
        ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
        ctx.imageSmoothingEnabled = false;
        const profile = typeof GraphicsManager !== 'undefined' ? GraphicsManager.profile() : null;
        if (opts.glow && (!profile || profile.glows)) {
            ctx.shadowColor = opts.glow;
            const requestedBlur = opts.glowBlur || 12;
            ctx.shadowBlur = profile ? Math.min(requestedBlur, profile.glowCap || requestedBlur) : requestedBlur;
        }
        const dx = centerX - width / 2;
        const dy = centerY - height / 2;
        if (def.animatedSprite) {
            drawFrame(image, def.animatedCols || 1, def.animatedRows || 1, animationFrameFor(def, opts), dx, dy, width, height);
        } else {
            ctx.drawImage(image, dx, dy, width, height);
        }
        ctx.restore();
        return true;
    }

    return { select, get, draw, getActiveIndex: () => activeIndex };
})();

ShipSpriteManager.select(selectedShip);
