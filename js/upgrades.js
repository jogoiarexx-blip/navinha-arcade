// ================= UPGRADES (armas, escudo, vida, combo, loja) =================
// Padrões de tiro por nível de arma, efeitos dos power-ups coletáveis
// durante a partida, o sistema de combo/multiplicador de pontuação, e
// a loja de upgrades permanentes (comprados com créditos entre partidas).

// ---- Tiro (upgrade temporário, dura a partida toda) ----
const WEAPON_PATTERNS = {
    1: (baseX, baseY) => [
        { x: baseX, y: baseY, w: 6, h: 15, speed: 10 }
    ],
    2: (baseX, baseY) => [
        { x: baseX - 12, y: baseY, w: 6, h: 15, speed: 10 },
        { x: baseX + 12, y: baseY, w: 6, h: 15, speed: 10 }
    ],
    3: (baseX, baseY) => [
        { x: baseX, y: baseY, w: 6, h: 15, speed: 10 },
        { x: baseX - 14, y: baseY + 6, w: 6, h: 15, speed: 10, vx: -1.2 },
        { x: baseX + 14, y: baseY + 6, w: 6, h: 15, speed: 10, vx: 1.2 }
    ]
};

function shoot() {
    if (player.shootCooldown > 0) return;
    let baseY = player.y + 10;
    let baseX = player.x + player.w / 2 - 3;
    playSound(800, 0.05, 'square', 0.05);

    const pattern = WEAPON_PATTERNS[player.weaponLevel] || WEAPON_PATTERNS[1];
    const dmg = player.bulletDmg || 1;
    pattern(baseX, baseY).forEach(b => { b.dmg = dmg; bullets.push(b); });

    // Cadência de tiro base, reduzida pelo upgrade permanente de cadência
    const baseCooldown = player.weaponLevel >= 3 ? 7 : 11;
    const bonus = (player.fireRateBonus || 0) * 1.2;
    player.shootCooldown = Math.max(3, Math.round(baseCooldown - bonus));
}

// ---- Power-ups coletáveis (temporários, só durante a partida) ----
const POWERUP_EFFECTS = {
    health: () => {
        player.health = Math.min(player.maxHealth, player.health + 1);
        playSound(600, 0.2, 'sine', 0.12);
    },
    weapon: () => {
        player.weaponLevel = Math.min(3, player.weaponLevel + 1);
        playSound(700, 0.2, 'square', 0.1);
    },
    shield: () => {
        player.shield = Math.min(2, player.shield + 1);
        playSound(500, 0.25, 'triangle', 0.12);
    }
};

function applyPowerup(type) {
    const effect = POWERUP_EFFECTS[type];
    if (effect) effect();
}

// Chance e tipo inteligentes: prioriza vida se estiver ferido
function maybeSpawnPowerup(x, y) {
    let chance = 0.38;
    if (player.health <= 1) chance = 0.55;
    else if (player.health < player.maxHealth) chance = 0.45;
    if (Math.random() > chance) return;
    spawnPowerup(x, y);
}

function spawnPowerup(x, y) {
    const needHealth = player.health < player.maxHealth;
    const needWeapon = player.weaponLevel < 3;
    const needShield = player.shield < 1;
    const bag = [];
    if (needHealth) bag.push('health', 'health', 'health');
    else bag.push('health');
    if (needWeapon) bag.push('weapon', 'weapon');
    else bag.push('weapon');
    if (needShield) bag.push('shield', 'shield');
    else bag.push('shield');
    const type = bag[Math.floor(Math.random() * bag.length)];
    powerups.push({
        x: x, y: y, w: 22, h: 22,
        type: type, speed: 2.0, life: 420
    });
}

function drawPowerups() {
    powerups.forEach(p => {
        ctx.save();
        ctx.translate(p.x + 11, p.y + 11);
        ctx.rotate(Date.now() / 300);

        if (p.type === 'health') {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillRect(-3, -8, 6, 16);
        } else if (p.type === 'weapon') {
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, 8);
            ctx.lineTo(-8, 8);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'shield') {
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    });
}

// ---- Combo: matar inimigos em sequência multiplica a pontuação ----
function registerKill(basePoints) {
    comboCount++;
    comboTimer = COMBO_WINDOW;
    if (comboCount > maxComboReached) maxComboReached = comboCount;
    if (typeof phaseMaxCombo !== 'undefined' && comboCount > phaseMaxCombo) {
        phaseMaxCombo = comboCount;
    }
    score += Math.round(basePoints * comboMultiplier());
}

// ---- Loja de upgrades permanentes (persistem entre partidas) ----
const PERMANENT_UPGRADE_DEFS = [
    { key: 'life',     label: 'Vida Máxima +1',     costBase: 100, max: 3, hotkey: '1' },
    { key: 'firerate', label: 'Cadência de Tiro',   costBase: 140, max: 3, hotkey: '2' },
    { key: 'shield',   label: 'Escudo Inicial +1',  costBase: 180, max: 2, hotkey: '3' }
];

function upgradeCost(def) {
    return def.costBase * (1 + (permanentUpgrades[def.key] || 0));
}

// ---- Nave alternativa (desbloqueável na loja com créditos) ----
function purchaseShipUnlock(index) {
    const def = SHIP_DEFS[index];
    if (!def || !def.unlockCost) return; // índice inválido ou nave já liberada por padrão
    if (shipsUnlocked[index]) {
        playSound(150, 0.15, 'sawtooth', 0.1);
        return;
    }
    if (credits < def.unlockCost) {
        playSound(150, 0.15, 'sawtooth', 0.1);
        return;
    }
    credits -= def.unlockCost;
    shipsUnlocked[index] = true;
    selectedShip = index;
    safeSet('navinhaCredits', credits);
    safeSet('navinhaShipsUnlocked', shipsUnlocked);
    safeSet('navinhaSelectedShip', selectedShip);
    playSound(750, 0.2, 'sine', 0.12);
    setTimeout(() => playSound(950, 0.2, 'sine', 0.1), 100);
    setTimeout(() => playSound(1150, 0.2, 'sine', 0.1), 200);
}

// Alterna entre as naves já liberadas (cicla, pulando as bloqueadas)
function cycleSelectedShip(delta) {
    const n = SHIP_DEFS.length;
    let idx = selectedShip;
    for (let i = 0; i < n; i++) {
        idx = (idx + delta + n) % n;
        if (shipsUnlocked[idx]) {
            selectedShip = idx;
            safeSet('navinhaSelectedShip', selectedShip);
            playSound(300, 0.05, 'square', 0.06);
            return;
        }
    }
}

function purchaseUpgrade(key) {
    const def = PERMANENT_UPGRADE_DEFS.find(d => d.key === key);
    if (!def) return;
    const level = permanentUpgrades[key] || 0;
    if (level >= def.max) {
        playSound(150, 0.15, 'sawtooth', 0.1);
        return;
    }
    const cost = upgradeCost(def);
    if (credits < cost) {
        playSound(150, 0.15, 'sawtooth', 0.1);
        return;
    }
    credits -= cost;
    permanentUpgrades[key] = level + 1;
    safeSet('navinhaCredits', credits);
    safeSet('navinhaUpgrades', permanentUpgrades);
    playSound(750, 0.2, 'sine', 0.12);
    setTimeout(() => playSound(950, 0.2, 'sine', 0.1), 100);
}
