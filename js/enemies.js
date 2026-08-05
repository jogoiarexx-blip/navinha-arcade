// ================= INIMIGOS =================
// Configuração de cada tipo de inimigo, tabela de variedade por fase
// (1 a 10), geração (spawn) e desenho. O comportamento de movimento e
// tiro de cada inimigo é atualizado em game.js, dentro de update(),
// pois depende do restante do estado do jogo (balas, jogador etc).

const ENEMY_TYPES = {
    normal:   { size: 35, health: 1, speedMult: 1.0 },
    zigzag:   { size: 32, health: 1, speedMult: 1.0 },
    shooter:  { size: 36, health: 2, speedMult: 0.65 },
    tank:     { size: 46, health: 4, speedMult: 0.55 },
    splitter: { size: 34, health: 1, speedMult: 0.85 },
    spinner:  { size: 30, health: 2, speedMult: 0.9 },
    splitter_mini: { size: 18, health: 1, speedMult: 1.3 }
};

function spawnEnemyOfType(type, xOverride, yOverride) {
    const cfg = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
    const diff = currentDifficulty();
    const size = cfg.size;
    enemies.push({
        x: xOverride !== undefined ? xOverride : Math.random() * (W - size),
        y: yOverride !== undefined ? yOverride : -size,
        w: size,
        h: size,
        type: type,
        health: Math.max(1, Math.ceil(cfg.health * diff.enemyHealthMult)),
        speed: (2 + Math.random() * 1.5 + (currentLevel - 1) * 0.22) * cfg.speedMult * diff.enemySpeedMult,
        angle: Math.random() * Math.PI * 2,
        spinAngle: 0,
        shootTimer: 60 + Math.floor(Math.random() * 40),
        driftDir: Math.random() > 0.5 ? 1 : -1
    });
}

// Distribuição de tipos por fase: a variedade cresce ao longo das 10 fases.
function spawnEnemy() {
    if (gameState !== 'PLAYING' || bossActive) return;

    let type = 'normal';
    const rand = Math.random();
    const lvl = currentLevel;

    if (lvl <= 2) {
        if (rand > 0.85) type = 'tank';
        else if (rand > 0.6) type = 'zigzag';
        else type = 'normal';
    } else if (lvl <= 4) {
        if (rand > 0.88) type = 'splitter';
        else if (rand > 0.72) type = 'tank';
        else if (rand > 0.55) type = 'zigzag';
        else if (rand > 0.38) type = 'shooter';
        else type = 'normal';
    } else if (lvl <= 6) {
        if (rand > 0.86) type = 'spinner';
        else if (rand > 0.72) type = 'splitter';
        else if (rand > 0.58) type = 'tank';
        else if (rand > 0.4) type = 'shooter';
        else if (rand > 0.2) type = 'zigzag';
        else type = 'normal';
    } else {
        // Fases 7-10: mistura completa, mais pesada nos tipos difíceis
        if (rand > 0.8) type = 'spinner';
        else if (rand > 0.64) type = 'splitter';
        else if (rand > 0.48) type = 'tank';
        else if (rand > 0.32) type = 'shooter';
        else if (rand > 0.14) type = 'zigzag';
        else type = 'normal';
    }

    spawnEnemyOfType(type);
}

// ================= COMPORTAMENTO POR TIPO =================
// Movimento e tiro de cada inimigo. Colisões e morte ficam em game.js.
// Para adicionar um tipo novo: registre aqui + desenho em drawEnemy +
// entrada em ENEMY_TYPES / spawnEnemy.
const ENEMY_BEHAVIOR = {
    normal(e) {
        e.y += e.speed;
    },
    zigzag(e) {
        e.y += e.speed;
        e.angle += 0.12;
        e.x += Math.sin(e.angle) * 3.5;
    },
    shooter(e) {
        e.y += e.speed * 0.55;
        e.shootTimer--;
        if (e.shootTimer <= 0 && e.y > 0 && e.y < H * 0.55) {
            enemyBullets.push({
                x: e.x + e.w / 2 - 3, y: e.y + e.h, w: 6, h: 14,
                speed: 5.5, color: '#f0f'
            });
            playSound(220, 0.1, 'sawtooth', 0.05);
            e.shootTimer = 80;
        }
    },
    tank(e) {
        e.y += e.speed;
        e.x += Math.sin(e.y / 60) * 0.6;
    },
    splitter(e) {
        e.y += e.speed;
        e.angle += 0.05;
        e.x += Math.sin(e.angle) * 1.8;
    },
    splitter_mini(e) {
        e.y += e.speed;
        e.x += e.driftDir * 1.6;
        if (e.x <= 0 || e.x + e.w >= W) e.driftDir *= -1;
    },
    spinner(e) {
        e.y += e.speed;
        e.spinAngle += 0.15;
        e.angle += 0.045;
        e.x += Math.sin(e.angle) * 4.2;
    },
    boss(e) {
        if (e.y < 60) {
            e.y += e.speed;
        } else {
            e.x += e.dir * 2.2;
            if (e.x <= 0 || e.x + e.w >= W) e.dir *= -1;
        }
        // Telegrafia: avisa o ataque antes de disparar (só com o chefe já em posição)
        if (e.y >= 60) {
            if (!e.telegraphing && e.shootTimer > 0 && e.shootTimer <= BOSS_TELEGRAPH_FRAMES) {
                beginBossTelegraph(e);
            }
            e.shootTimer--;
            if (e.shootTimer <= 0) {
                fireBossPattern(e);
                e.telegraphing = false;
                // Garante intervalo mínimo para a próxima telegrafia caber no ciclo
                e.shootTimer = Math.max(BOSS_TELEGRAPH_FRAMES + 12, 46 - currentLevel * 3);
            }
        }
    }
};

function updateEnemy(e) {
    const fn = ENEMY_BEHAVIOR[e.type] || ENEMY_BEHAVIOR.normal;
    fn(e);
}

function spawnBoss() {
    if (bossActive) return;
    bossActive = true;
    const diff = currentDifficulty();
    const phase = getPhase(currentLevel);
    const bossDef = phase.boss;
    const scale = bossDef.sizeScale || 1;
    let bossHp = Math.ceil((22 + currentLevel * 18) * diff.enemyHealthMult * scale);
    enemies.push({
        x: W / 2 - (75 * scale),
        y: -120 * scale,
        w: 150 * scale,
        h: 100 * scale,
        type: 'boss',
        health: bossHp,
        maxHealth: bossHp,
        speed: 1.5 * diff.enemySpeedMult,
        dir: 1,
        shootTimer: 50,
        telegraphing: false,
        telegraphDuration: 0,
        // Identidade visual e padrão de ataque vêm da definição da fase
        bossName: bossDef.name,
        bossColors: bossDef,
        bossPattern: bossDef.pattern,
        isFinalBoss: !!bossDef.isFinalBoss
    });
    playSound(80, 0.6, 'sawtooth', 0.25);
}

// Nome do chefe + barra de vida — compartilhado por todas as silhuetas,
// pra não repetir esse trecho em cada função de forma abaixo.
function drawBossNameAndHealthBar(e) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(e.bossName || 'CHEFE', e.x + e.w / 2, e.y - 32);

    const barW = Math.max(120, e.w * 0.93);
    const barH = 10;
    const barX = e.x + (e.w - barW) / 2;
    const barY = e.y - 18;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPercent = e.health / e.maxHealth;
    ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : (hpPercent > 0.25 ? '#ff0' : '#f00');
    ctx.fillRect(barX, barY, barW * hpPercent, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
}

// ---- Família "Capital" (fases 1-2): nave hexagonal clássica com
// placas laterais angulares ----
function drawBossCapital(e, c) {
    const primary = c.primaryColor || '#5a0000';
    const secondary = c.secondaryColor || '#880000';
    const plate = c.plateColor || '#ff2222';
    const core = c.coreColor || '#ff5555';
    const eye = c.eyeColor || '#ff0';

    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.15, e.y);
    ctx.lineTo(e.x + e.w * 0.85, e.y);
    ctx.lineTo(e.x + e.w, e.y + e.h * 0.35);
    ctx.lineTo(e.x + e.w * 0.9, e.y + e.h);
    ctx.lineTo(e.x + e.w * 0.1, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = secondary;
    ctx.fillRect(e.x + e.w * 0.08, e.y + e.h * 0.18, e.w * 0.84, e.h * 0.5);

    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.1, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w * 0.3, e.y + e.h * 0.15);
    ctx.lineTo(e.x + e.w * 0.3, e.y + e.h * 0.4);
    ctx.lineTo(e.x + e.w * 0.1, e.y + e.h * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.9, e.y + e.h * 0.2);
    ctx.lineTo(e.x + e.w * 0.7, e.y + e.h * 0.15);
    ctx.lineTo(e.x + e.w * 0.7, e.y + e.h * 0.4);
    ctx.lineTo(e.x + e.w * 0.9, e.y + e.h * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2 - e.w * 0.13, e.y + e.h * 0.4);
    ctx.lineTo(e.x + e.w / 2 + e.w * 0.13, e.y + e.h * 0.4);
    ctx.lineTo(e.x + e.w / 2 + e.w * 0.13, e.y + e.h * 0.55);
    ctx.lineTo(e.x + e.w / 2, e.y + e.h * 0.68);
    ctx.lineTo(e.x + e.w / 2 - e.w * 0.13, e.y + e.h * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.fillRect(e.x + e.w * 0.13, e.y + e.h - e.h * 0.12, e.w * 0.07, e.h * 0.18);
    ctx.fillRect(e.x + e.w * 0.8, e.y + e.h - e.h * 0.12, e.w * 0.07, e.h * 0.18);
    ctx.fillRect(e.x + e.w / 2 - e.w * 0.033, e.y + e.h - e.h * 0.06, e.w * 0.07, e.h * 0.14);

    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(e.x + e.w * 0.27, e.y + e.h * 0.35, e.w * 0.053, 0, Math.PI * 2);
    ctx.arc(e.x + e.w * 0.73, e.y + e.h * 0.35, e.w * 0.053, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.x + e.w * 0.27, e.y + e.h * 0.35, e.w * 0.02, 0, Math.PI * 2);
    ctx.arc(e.x + e.w * 0.73, e.y + e.h * 0.35, e.w * 0.02, 0, Math.PI * 2);
    ctx.fill();
}

// ---- Família "Devoradora" (fases 3-4): corpo insetoide afilado com
// mandíbulas frontais e cauda pontiaguda ----
function drawBossDevourer(e, c) {
    const primary = c.primaryColor || '#380018';
    const secondary = c.secondaryColor || '#8a0038';
    const plate = c.plateColor || '#ff2a7a';
    const core = c.coreColor || '#ff6ab0';
    const eye = c.eyeColor || '#ff0';

    // Corpo principal em losango alongado
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y);
    ctx.lineTo(e.x + e.w * 0.85, e.y + e.h * 0.3);
    ctx.lineTo(e.x + e.w * 0.7, e.y + e.h * 0.85);
    ctx.lineTo(e.x + e.w / 2, e.y + e.h);
    ctx.lineTo(e.x + e.w * 0.3, e.y + e.h * 0.85);
    ctx.lineTo(e.x + e.w * 0.15, e.y + e.h * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y + e.h * 0.1);
    ctx.lineTo(e.x + e.w * 0.68, e.y + e.h * 0.32);
    ctx.lineTo(e.x + e.w * 0.58, e.y + e.h * 0.75);
    ctx.lineTo(e.x + e.w / 2, e.y + e.h * 0.88);
    ctx.lineTo(e.x + e.w * 0.42, e.y + e.h * 0.75);
    ctx.lineTo(e.x + e.w * 0.32, e.y + e.h * 0.32);
    ctx.closePath();
    ctx.fill();

    // Mandíbulas curvas apontando pra baixo (onde o jogador está)
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.35, e.y + e.h * 0.7);
    ctx.lineTo(e.x + e.w * 0.15, e.y + e.h * 1.08);
    ctx.lineTo(e.x + e.w * 0.42, e.y + e.h * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.65, e.y + e.h * 0.7);
    ctx.lineTo(e.x + e.w * 0.85, e.y + e.h * 1.08);
    ctx.lineTo(e.x + e.w * 0.58, e.y + e.h * 0.92);
    ctx.closePath();
    ctx.fill();

    // Asas laterais finas
    ctx.fillStyle = plate;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.15, e.y + e.h * 0.35);
    ctx.lineTo(e.x - e.w * 0.08, e.y + e.h * 0.55);
    ctx.lineTo(e.x + e.w * 0.22, e.y + e.h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(e.x + e.w * 0.85, e.y + e.h * 0.35);
    ctx.lineTo(e.x + e.w * 1.08, e.y + e.h * 0.55);
    ctx.lineTo(e.x + e.w * 0.78, e.y + e.h * 0.6);
    ctx.closePath();
    ctx.fill();

    // Núcleo pulsante central
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h * 0.45, e.w * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(e.x + e.w * 0.4, e.y + e.h * 0.25, e.w * 0.04, 0, Math.PI * 2);
    ctx.arc(e.x + e.w * 0.6, e.y + e.h * 0.25, e.w * 0.04, 0, Math.PI * 2);
    ctx.fill();
}

// ---- Família "Fortaleza" (fases 5-6): blocão blindado retangular com
// torretas nos quatro cantos ----
function drawBossFortress(e, c) {
    const primary = c.primaryColor || '#3a2a10';
    const secondary = c.secondaryColor || '#8a5a1a';
    const plate = c.plateColor || '#c98a1a';
    const core = c.coreColor || '#ffcc55';
    const eye = c.eyeColor || '#f80';

    // Casco retangular principal
    ctx.fillStyle = primary;
    ctx.fillRect(e.x + e.w * 0.05, e.y + e.h * 0.1, e.w * 0.9, e.h * 0.85);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x + e.w * 0.05, e.y + e.h * 0.1, e.w * 0.9, e.h * 0.85);

    ctx.fillStyle = secondary;
    ctx.fillRect(e.x + e.w * 0.15, e.y + e.h * 0.22, e.w * 0.7, e.h * 0.6);

    // Torretas nos quatro cantos
    const turretR = e.w * 0.1;
    [[0.14, 0.2], [0.86, 0.2], [0.14, 0.85], [0.86, 0.85]].forEach(([fx, fy]) => {
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.arc(e.x + e.w * fx, e.y + e.h * fy, turretR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // Placa frontal reforçada
    ctx.fillStyle = plate;
    ctx.fillRect(e.x + e.w * 0.32, e.y + e.h * 0.68, e.w * 0.36, e.h * 0.24);

    // Núcleo central
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h * 0.45, e.w * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eye;
    ctx.fillRect(e.x + e.w * 0.36, e.y + e.h * 0.28, e.w * 0.08, e.h * 0.08);
    ctx.fillRect(e.x + e.w * 0.56, e.y + e.h * 0.28, e.w * 0.08, e.h * 0.08);

    // Canhões nas torretas de baixo
    ctx.fillStyle = '#222';
    ctx.fillRect(e.x + e.w * 0.1, e.y + e.h * 0.95, e.w * 0.06, e.h * 0.16);
    ctx.fillRect(e.x + e.w * 0.84, e.y + e.h * 0.95, e.w * 0.06, e.h * 0.16);
}

// ---- Família "Cristalina" (fases 7-8): gema facetada com pontas
// radiantes ----
function drawBossCrystalline(e, c) {
    const primary = c.primaryColor || '#00202a';
    const secondary = c.secondaryColor || '#0a5a70';
    const plate = c.plateColor || '#30c0e0';
    const core = c.coreColor || '#a0f0ff';
    const eye = c.eyeColor || '#fff';
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;

    // Pontas radiantes (6 facetas ao redor)
    ctx.fillStyle = plate;
    for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i;
        const tipX = cx + Math.cos(ang) * e.w * 0.58;
        const tipY = cy + Math.sin(ang) * e.h * 0.58;
        const baseAng1 = ang - 0.35, baseAng2 = ang + 0.35;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(baseAng1) * e.w * 0.22, cy + Math.sin(baseAng1) * e.h * 0.22);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(cx + Math.cos(baseAng2) * e.w * 0.22, cy + Math.sin(baseAng2) * e.h * 0.22);
        ctx.closePath();
        ctx.fill();
    }

    // Corpo central em diamante facetado
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(cx, e.y + e.h * 0.15);
    ctx.lineTo(e.x + e.w * 0.8, cy);
    ctx.lineTo(cx, e.y + e.h * 0.85);
    ctx.lineTo(e.x + e.w * 0.2, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(cx, e.y + e.h * 0.28);
    ctx.lineTo(e.x + e.w * 0.68, cy);
    ctx.lineTo(cx, e.y + e.h * 0.72);
    ctx.lineTo(e.x + e.w * 0.32, cy);
    ctx.closePath();
    ctx.fill();

    // Núcleo brilhante
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.05, 0, Math.PI * 2);
    ctx.fill();
}

// ---- Família "Guardiã do Núcleo" (fases 9-10): orbe central com anéis
// orbitando; a fase 10 (final) ganha uma coroa de pontas extra ----
function drawBossCoreGuardian(e, c) {
    const primary = c.primaryColor || '#3a0800';
    const secondary = c.secondaryColor || '#a02800';
    const plate = c.plateColor || '#ff5a1a';
    const core = c.coreColor || '#ffaa40';
    const eye = c.eyeColor || '#ff0';
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;

    // Anel externo
    ctx.strokeStyle = plate;
    ctx.lineWidth = e.w * 0.045;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Segmentos do anel (dão a sensação de placas articuladas)
    ctx.fillStyle = secondary;
    for (let i = 0; i < 8; i++) {
        const ang = (Math.PI / 4) * i;
        const px = cx + Math.cos(ang) * e.w * 0.46;
        const py = cy + Math.sin(ang) * e.h * 0.46;
        ctx.beginPath();
        ctx.arc(px, py, e.w * 0.055, 0, Math.PI * 2);
        ctx.fill();
    }

    // Orbe central
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Coroa de pontas e brilho extra — só o chefe final (fase 10)
    if (e.isFinalBoss) {
        ctx.fillStyle = core;
        for (let i = -2; i <= 2; i++) {
            const spikeX = cx + i * (e.w * 0.11);
            ctx.beginPath();
            ctx.moveTo(spikeX - e.w * 0.03, e.y + e.h * 0.05);
            ctx.lineTo(spikeX + e.w * 0.03, e.y + e.h * 0.05);
            ctx.lineTo(spikeX, e.y - e.h * 0.12);
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, e.w * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    // Olho central
    ctx.fillStyle = eye;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * 0.025, 0, Math.PI * 2);
    ctx.fill();
}

// Desenha linhas / arco de aviso do próximo ataque do chefe.
// Usa os dados travados em beginBossTelegraph (game.js).
function drawBossTelegraph(e) {
    if (!e.telegraphing || e.shootTimer <= 0) return;

    const pattern = e.bossPattern || 0;
    const dur = e.telegraphDuration || 24;
    // 0 no início do aviso → 1 no momento do disparo
    const frac = 1 - Math.max(0, e.shootTimer) / dur;
    const pulse = 0.35 + 0.45 * frac + 0.2 * Math.sin(Date.now() / 70);
    const lineLen = H - (e.y + e.h) + 40;

    ctx.save();
    ctx.globalAlpha = Math.min(1, pulse);
    ctx.lineCap = 'round';

    // Brilho no casco do chefe (carga do canhão)
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h * 0.55;
    ctx.shadowBlur = 12 + frac * 18;
    ctx.shadowColor = pattern === 2 ? '#ff00ff' : (pattern === 3 ? '#a0ff00' : (pattern === 1 ? '#ff8800' : '#ff4444'));
    ctx.fillStyle = ctx.shadowColor;
    ctx.globalAlpha = 0.15 + frac * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, e.w * (0.12 + frac * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = Math.min(1, pulse);

    // Linha tracejada auxiliar
    function dashLine(x0, y0, x1, y1, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width || 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);
        // Ponta brilhante perto do chefe
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7 + frac * 0.3;
        ctx.beginPath();
        ctx.arc(x0, y0, 3 + frac * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.min(1, pulse);
    }

    if (pattern === 0) {
        // Dois canhões laterais + opcional central
        const leftX = e.x + 29;
        const rightX = e.x + e.w - 29;
        const y0 = e.y + e.h - 6;
        dashLine(leftX, y0, leftX, y0 + lineLen, '#ff3333', 2.5);
        dashLine(rightX, y0, rightX, y0 + lineLen, '#ff3333', 2.5);
        if (e.telegraphCenter) {
            dashLine(cx, e.y + e.h, cx, e.y + e.h + lineLen, '#ffcc00', 2.5);
        }
    } else if (pattern === 1) {
        // Leque de 5 trajetórias (aproxima speed 4.8 + vx t*4.5)
        const y0 = e.y + e.h;
        const count = 5;
        for (let i = 0; i < count; i++) {
            const t = (i / (count - 1)) - 0.5;
            const vx = t * 4.5;
            const speed = 4.8;
            // Projeta ~40 frames à frente para desenhar a linha
            const steps = 50;
            const x1 = cx + vx * steps;
            const y1 = y0 + speed * steps;
            dashLine(cx, y0, x1, y1, '#ff8800', 2);
        }
    } else if (pattern === 2) {
        // Mira travada: linha grossa até longe na direção fixa
        let dx = e.telegraphDx, dy = e.telegraphDy;
        if (dx === undefined || dy === undefined) {
            dx = 0;
            dy = 1;
        }
        const y0 = e.y + e.h;
        const dist = Math.max(lineLen, 320);
        const x1 = cx + dx * dist;
        const y1 = y0 + dy * dist;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3 + frac * 2;
        ctx.globalAlpha = 0.25 + frac * 0.55;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);
        // Cruz de mira no "ponto de impacto" estimado a ~meio caminho
        const mx = cx + dx * dist * 0.55;
        const my = y0 + dy * dist * 0.55;
        const arm = 10 + frac * 6;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6 + frac * 0.4;
        ctx.beginPath();
        ctx.moveTo(mx - arm, my);
        ctx.lineTo(mx + arm, my);
        ctx.moveTo(mx, my - arm);
        ctx.lineTo(mx, my + arm);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(mx, my, 6 + frac * 4, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Espiral: 3 raios nos ângulos do próximo disparo
        const y0 = e.y + e.h * 0.75;
        const speedMag = 4.2;
        const baseAng = e.spiralAngle || 0;
        const steps = 45;
        for (let i = 0; i < 3; i++) {
            const ang = baseAng + i * (Math.PI * 2 / 3);
            const vx = speedMag * Math.cos(ang);
            const vy = Math.max(1.5, speedMag * Math.sin(ang) + 2.2);
            dashLine(cx, y0, cx + vx * steps, y0 + vy * steps, '#a0ff00', 2.5);
        }
    }

    // Anel de carga sob o chefe (progresso até o tiro)
    ctx.globalAlpha = 0.5 + frac * 0.5;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, e.y + e.h + 14, 10, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawEnemy(e) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;

    if (e.type === 'boss') {
        // ---- Chefe: a silhueta depende da "família" definida na fase
        // (js/phases/faseN.js -> boss.shape), então bosses de temas
        // diferentes têm formas realmente diferentes, não só cores. ----
        const c = e.bossColors || {};
        const shape = c.shape || 'capital';
        if (shape === 'devourer') drawBossDevourer(e, c);
        else if (shape === 'fortress') drawBossFortress(e, c);
        else if (shape === 'crystalline') drawBossCrystalline(e, c);
        else if (shape === 'coreguardian') drawBossCoreGuardian(e, c);
        else drawBossCapital(e, c);

        drawBossNameAndHealthBar(e);
        drawBossTelegraph(e);

    } else if (e.type === 'zigzag') {
        // ---- Interceptador: asas em flecha + barbatana traseira ----
        ctx.fillStyle = '#ff00aa';
        ctx.beginPath();
        ctx.moveTo(cx, e.y);
        ctx.lineTo(e.x + e.w * 0.78, e.y + e.h * 0.55);
        ctx.lineTo(e.x + e.w, e.y + e.h * 0.5);
        ctx.lineTo(e.x + e.w * 0.6, e.y + e.h);
        ctx.lineTo(cx, e.y + e.h * 0.78);
        ctx.lineTo(e.x + e.w * 0.4, e.y + e.h);
        ctx.lineTo(e.x, e.y + e.h * 0.5);
        ctx.lineTo(e.x + e.w * 0.22, e.y + e.h * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffaadd';
        ctx.beginPath();
        ctx.moveTo(cx, e.y + e.h * 0.15);
        ctx.lineTo(cx + 6, e.y + e.h * 0.45);
        ctx.lineTo(cx - 6, e.y + e.h * 0.45);
        ctx.closePath();
        ctx.fill();

    } else if (e.type === 'shooter') {
        // ---- Artilheiro: torreta octogonal com canhão central ----
        const r = e.w / 2;
        ctx.fillStyle = '#aa00ff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const ang = (Math.PI / 4) * i - Math.PI / 8;
            const px = cx + Math.cos(ang) * r;
            const py = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff66ff';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#330044';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#552266';
        ctx.fillRect(cx - 4, e.y + e.h - 4, 8, 12);

    } else if (e.type === 'tank') {
        // ---- Blindado: casco hexagonal reforçado com rebites ----
        ctx.fillStyle = '#8a5a00';
        ctx.beginPath();
        ctx.moveTo(e.x + e.w * 0.28, e.y);
        ctx.lineTo(e.x + e.w * 0.72, e.y);
        ctx.lineTo(e.x + e.w, e.y + e.h * 0.32);
        ctx.lineTo(e.x + e.w, e.y + e.h * 0.68);
        ctx.lineTo(e.x + e.w * 0.72, e.y + e.h);
        ctx.lineTo(e.x + e.w * 0.28, e.y + e.h);
        ctx.lineTo(e.x, e.y + e.h * 0.68);
        ctx.lineTo(e.x, e.y + e.h * 0.32);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#4a3000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#c98a1a';
        ctx.fillRect(e.x + e.w * 0.22, e.y + e.h * 0.28, e.w * 0.56, e.h * 0.44);

        ctx.fillStyle = '#4a3000';
        [[0.28, 0.32], [0.72, 0.32], [0.28, 0.68], [0.72, 0.68]].forEach(([fx, fy]) => {
            ctx.beginPath();
            ctx.arc(e.x + e.w * fx, e.y + e.h * fy, 2.4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#ffcc55';
        ctx.beginPath();
        ctx.arc(cx, cy, e.w * 0.14, 0, Math.PI * 2);
        ctx.fill();

    } else if (e.type === 'splitter') {
        // ---- Divisor: losango com fissura central que "quebra" ----
        ctx.fillStyle = '#00cc88';
        ctx.beginPath();
        ctx.moveTo(cx, e.y);
        ctx.lineTo(e.x + e.w, cy);
        ctx.lineTo(cx, e.y + e.h);
        ctx.lineTo(e.x, cy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.moveTo(cx, e.y + e.h * 0.18);
        ctx.lineTo(e.x + e.w * 0.82, cy);
        ctx.lineTo(cx, e.y + e.h * 0.82);
        ctx.lineTo(e.x + e.w * 0.18, cy);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#003322';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 3, e.y + e.h * 0.3);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx - 3, e.y + e.h * 0.7);
        ctx.stroke();

    } else if (e.type === 'splitter_mini') {
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.moveTo(cx, e.y);
        ctx.lineTo(e.x + e.w, e.y + e.h);
        ctx.lineTo(e.x, e.y + e.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#003322';
        ctx.lineWidth = 1.5;
        ctx.stroke();

    } else if (e.type === 'spinner') {
        // ---- Giratório: estrela de 6 pontas rotacionando ----
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(e.spinAngle || 0);
        const spikes = 6;
        const outerR = e.w / 2;
        const innerR = e.w / 4.2;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const ang = (Math.PI / spikes) * i;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffe08a';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#663300';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

    } else {
        // ---- Normal: caça com asas laterais e cockpit ----
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.moveTo(cx, e.y + e.h);
        ctx.lineTo(e.x + e.w * 0.15, e.y + e.h * 0.55);
        ctx.lineTo(e.x, e.y + e.h * 0.65);
        ctx.lineTo(e.x + e.w * 0.32, e.y);
        ctx.lineTo(e.x + e.w * 0.68, e.y);
        ctx.lineTo(e.x + e.w, e.y + e.h * 0.65);
        ctx.lineTo(e.x + e.w * 0.85, e.y + e.h * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa77';
        ctx.beginPath();
        ctx.moveTo(cx, e.y + e.h * 0.75);
        ctx.lineTo(cx - 6, e.y + e.h * 0.45);
        ctx.lineTo(cx + 6, e.y + e.h * 0.45);
        ctx.closePath();
        ctx.fill();
    }
}
