// Mantém em memória somente o sprite da nave selecionada. As outras imagens
// continuam no disco e são carregadas sob demanda ao trocar de nave.
const ShipSpriteManager = (() => {
    const CACHE_KEY = 'selected-player-ship';
    let activeIndex = -1;
    let loadToken = 0;

    function select(index) {
        const safeIndex = Number.isInteger(index) && SHIP_DEFS[index] ? index : 0;
        if (activeIndex === safeIndex && AssetManager.getSharedImage(CACHE_KEY)) {
            return Promise.resolve(AssetManager.getSharedImage(CACHE_KEY));
        }
        activeIndex = safeIndex;
        const token = ++loadToken;
        const def = SHIP_DEFS[safeIndex];
        AssetManager.unloadShared(CACHE_KEY);
        return AssetManager.loadSharedImage(CACHE_KEY, def.sprite).catch(error => {
            if (token === loadToken) console.warn('[ShipSpriteManager]', error);
            return null;
        });
    }

    function get(index) {
        const safeIndex = SHIP_DEFS[index] ? index : 0;
        if (safeIndex !== activeIndex) select(safeIndex);
        return AssetManager.getSharedImage(CACHE_KEY);
    }

    function draw(index, centerX, centerY, targetHeight, options) {
        const image = get(index);
        if (!image || !image.naturalWidth || !image.naturalHeight) return false;
        const opts = options || {};
        const height = targetHeight;
        const width = height * image.naturalWidth / image.naturalHeight;
        ctx.save();
        ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
        ctx.imageSmoothingEnabled = opts.smoothing !== false;
        if (opts.glow) {
            ctx.shadowColor = opts.glow;
            ctx.shadowBlur = opts.glowBlur || 12;
        }
        ctx.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
        ctx.restore();
        return true;
    }

    return { select, get, draw, getActiveIndex: () => activeIndex };
})();

ShipSpriteManager.select(selectedShip);
