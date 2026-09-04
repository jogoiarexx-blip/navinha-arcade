// Checkpoint leve entre fases. Não serializa inimigos/projéteis: eles pertencem
// à fase e precisam ser recriados para que uma sessão antiga não vaze memória.
const SaveManager = (() => {
    const KEY = 'navinhaRunCheckpointV1';

    function read() {
        const raw = safeGet(KEY, null);
        if (!isPlainObject(raw)) return null;
        const level = clampInt(raw.level, 1, MAX_LEVEL, 1);
        if (level < 2 || level > unlockedLevel) return null;
        return {
            level,
            score: clampInt(raw.score, 0, 99999999, 0),
            health: clampInt(raw.health, 1, 99, 1),
            maxHealth: clampInt(raw.maxHealth, 1, 99, 3),
            weaponLevel: clampInt(raw.weaponLevel, 1, 4, 1),
            shield: clampInt(raw.shield, 0, 9, 0),
            shipType: clampInt(raw.shipType, 0, SHIP_DEFS.length - 1, 0),
            difficultyIndex: clampInt(raw.difficultyIndex, 0, DIFFICULTIES.length - 1, 0),
            runCreditsEarned: clampInt(raw.runCreditsEarned, 0, 99999999, 0)
        };
    }

    function saveNext(level) {
        if (!player || level < 2 || level > MAX_LEVEL) return;
        safeSet(KEY, { level, score, health:player.health, maxHealth:player.maxHealth,
            weaponLevel:player.weaponLevel, shield:player.shield,
            shipType:player.shipType, difficultyIndex, runCreditsEarned });
    }

    function restore(snapshot) {
        if (!snapshot) return false;
        difficultyIndex = snapshot.difficultyIndex;
        selectedShip = shipsUnlocked[snapshot.shipType] ? snapshot.shipType : 0;
        player = buildPlayer();
        player.maxHealth = snapshot.maxHealth;
        player.health = Math.min(snapshot.maxHealth, Math.max(1, snapshot.health));
        player.weaponLevel = snapshot.weaponLevel;
        player.shield = snapshot.shield;
        score = snapshot.score;
        runCreditsEarned = snapshot.runCreditsEarned;
        continuousRun = true;
        return true;
    }

    function clear() { safeSet(KEY, null); }
    return { read, hasCheckpoint: () => !!read(), saveNext, restore, clear };
})();

function continueSavedRun() {
    const snapshot = SaveManager.read();
    if (snapshot) LevelManager.start(snapshot.level, 'resume');
}
