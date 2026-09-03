// ================= SPRITES DOS POWER-UPS =================
// Recursos globais pequenos: ficam disponíveis em todas as fases sem
// interferir no descarregamento dos assets exclusivos de cada missão.
const POWERUP_SPRITES = {
    health:    { file: 'assets/powerups/vida.webp',      glow: '#39ff68' },
    weapon:    { file: 'assets/powerups/arma.webp',      glow: '#ffd52a' },
    shield:    { file: 'assets/powerups/escudo.webp',    glow: '#21dcff' },
    overdrive: { file: 'assets/powerups/overdrive.webp', glow: '#ff7a16' },
    drone:     { file: 'assets/powerups/drone.webp',     glow: '#d44cff' },
    bomb:      { file: 'assets/powerups/bomba.webp',     glow: '#ff3c32' }
};

const PowerupSpriteManager = (() => {
    const keyFor = type => 'powerup-' + type;

    function loadAll() {
        return Promise.allSettled(Object.keys(POWERUP_SPRITES).map(type => {
            const def = POWERUP_SPRITES[type];
            return AssetManager.loadSharedImage(keyFor(type), def.file);
        }));
    }

    function get(type) {
        return AssetManager.getSharedImage(keyFor(type));
    }

    function draw(type, centerX, centerY, size, rotation, alpha) {
        const def = POWERUP_SPRITES[type];
        const image = def && get(type);
        if (!def || !image || !image.naturalWidth || !image.naturalHeight) return false;

        const aspect = image.naturalWidth / image.naturalHeight;
        const drawW = aspect >= 1 ? size : size * aspect;
        const drawH = aspect >= 1 ? size / aspect : size;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation || 0);
        ctx.globalAlpha = alpha === undefined ? 1 : alpha;
        ctx.imageSmoothingEnabled = false;
        const profile = typeof GraphicsManager !== 'undefined' ? GraphicsManager.profile() : null;
        if (!profile || profile.glows) {
            ctx.shadowColor = def.glow;
            ctx.shadowBlur = profile ? Math.min(12, profile.glowCap || 12) : 12;
        }
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
        return true;
    }

    return { loadAll, get, draw };
})();

PowerupSpriteManager.loadAll().catch(error => console.warn('[PowerupSpriteManager]', error));
