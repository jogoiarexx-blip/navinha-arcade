// ================= RESGATE DE SOBREVIVENTES =================
// Em cada fase há um número alvo de sobreviventes (phaseTargetSurvivors).
// Eles caem pela tela pedindo socorro. Para resgatar, o jogador precisa
// posicionar a nave em cima e ficar PARADO — um anel de progresso gira
// até completar. Resgatar TODOS é um dos objetivos de estrelas da fase.
//
// Módulo independente: usa globais (W, H, ctx, player, collide,
// spawnParticles, playSound, vibrate, score, bossActive, currentLevel).
// Carregar depois de core.js e audio.js, antes de game.js.

let survivors = [];
let survivorsRescued = 0;       // total resgatado na corrida atual
let rescueSpawnTimer = 0;

const RESCUE_HOLD_TIME = 50;    // frames parado em cima (~0.8s a 60fps), antes do upgrade de velocidade
const RESCUE_SPAWN_MIN = 320;   // intervalo mínimo entre spawns (frames)
const RESCUE_SPAWN_RANGE = 220; // variação aleatória
const RESCUE_RANGE_PAD_PER_LEVEL = 14; // px extras em cada lado da nave por nível de "Alcance de Resgate"
const RESCUE_SPEED_CUT_PER_LEVEL = 8;  // frames a menos por nível de "Velocidade de Resgate"

// Tempo de permanência necessário para resgatar, já considerando o upgrade permanente de velocidade
function effectiveRescueHoldTime() {
    const level = (typeof permanentUpgrades !== 'undefined' && permanentUpgrades.rescuespeed) || 0;
    return Math.max(18, RESCUE_HOLD_TIME - level * RESCUE_SPEED_CUT_PER_LEVEL);
}

// Retângulo de detecção do resgate: a nave "alcança" sobreviventes um pouco além do próprio corpo,
// crescendo com o upgrade permanente de "Alcance de Resgate"
function rescueReachRect() {
    const level = (typeof permanentUpgrades !== 'undefined' && permanentUpgrades.rescuerange) || 0;
    const pad = level * RESCUE_RANGE_PAD_PER_LEVEL;
    if (pad <= 0) return player;
    return { x: player.x - pad, y: player.y - pad, w: player.w + pad * 2, h: player.h + pad * 2 };
}

let _rescueLastPlayerX = null;
let _rescueLastPlayerY = null;

// Quantos sobreviventes a fase deve tentar gerar (objetivo de resgate)
function survivorsTargetForLevel(level) {
    // Fases iniciais: 2; sobe gradualmente até 4 no final
    if (level <= 2) return 2;
    if (level <= 5) return 3;
    if (level <= 8) return 4;
    return 4;
}

function resetRescues() {
    survivors = [];
    survivorsRescued = 0;
    rescueSpawnTimer = Math.floor(RESCUE_SPAWN_MIN * 0.4);
    _rescueLastPlayerX = null;
    _rescueLastPlayerY = null;
    phaseSurvivorsSpawned = 0;
    phaseSurvivorsRescued = 0;
    phaseSurvivorsMissed = 0;
    phaseTargetSurvivors = survivorsTargetForLevel(currentLevel || 1);
}

// Chamado em setupLevel para reiniciar só o contador da fase (mantém total da corrida)
function resetPhaseRescues() {
    survivors = [];
    rescueSpawnTimer = Math.floor(RESCUE_SPAWN_MIN * 0.35);
    _rescueLastPlayerX = null;
    _rescueLastPlayerY = null;
    phaseSurvivorsSpawned = 0;
    phaseSurvivorsRescued = 0;
    phaseSurvivorsMissed = 0;
    phaseTargetSurvivors = survivorsTargetForLevel(currentLevel || 1);
}

function spawnSurvivor() {
    if (phaseSurvivorsSpawned >= phaseTargetSurvivors) return;
    survivors.push({
        x: 20 + Math.random() * (W - 40 - 26),
        y: -30,
        w: 26,
        h: 30,
        speed: 0.9 + Math.random() * 0.5,
        driftPhase: Math.random() * Math.PI * 2,
        armWave: Math.random() * Math.PI * 2,
        rescueProgress: 0
    });
    phaseSurvivorsSpawned++;
}

function updateRescues() {
    if (_rescueLastPlayerX === null) {
        _rescueLastPlayerX = player.x;
        _rescueLastPlayerY = player.y;
    }
    const movedDist = Math.abs(player.x - _rescueLastPlayerX) + Math.abs(player.y - _rescueLastPlayerY);
    const isStopped = movedDist < 0.8;
    _rescueLastPlayerX = player.x;
    _rescueLastPlayerY = player.y;

    // Spawn até atingir o alvo da fase; para durante o chefe
    rescueSpawnTimer++;
    if (!bossActive &&
        phaseSurvivorsSpawned < phaseTargetSurvivors &&
        rescueSpawnTimer > RESCUE_SPAWN_MIN + Math.random() * RESCUE_SPAWN_RANGE) {
        spawnSurvivor();
        rescueSpawnTimer = 0;
    }

    const reachRect = rescueReachRect();
    const holdTime = effectiveRescueHoldTime();

    for (let i = survivors.length - 1; i >= 0; i--) {
        const s = survivors[i];
        s.y += s.speed;
        s.driftPhase += 0.03;
        s.x += Math.sin(s.driftPhase) * 0.6;
        s.armWave += 0.15;

        const shipOnTop = collide(reachRect, s);

        if (shipOnTop && isStopped) {
            s.rescueProgress++;
            if (s.rescueProgress === 1) playSound(260, 0.08, 'sine', 0.05);
            else if (s.rescueProgress % 8 === 0) playSound(260 + s.rescueProgress * 4, 0.05, 'sine', 0.04);
        } else {
            s.rescueProgress = Math.max(0, s.rescueProgress - 2);
        }

        if (s.rescueProgress >= holdTime) {
            survivorsRescued++;
            phaseSurvivorsRescued++;
            score += 60;
            spawnParticles(s.x + s.w / 2, s.y + s.h / 2, '#0ff', 20);
            spawnParticles(s.x + s.w / 2, s.y + s.h / 2, '#fff', 10);
            playSound(660, 0.12, 'sine', 0.12);
            setTimeout(() => playSound(880, 0.15, 'sine', 0.1), 90);
            vibrate(50);
            if (survivorsRescued % 3 === 0 && player.health < player.maxHealth) {
                player.health++;
            }
            survivors.splice(i, 1);
            continue;
        }

        if (s.y > H + 40) {
            phaseSurvivorsMissed++;
            survivors.splice(i, 1);
        }
    }
}

function drawSurvivor(s) {
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;

    const spriteDrawn = typeof EffectSpriteManager !== 'undefined' &&
        EffectSpriteManager.draw('survivor', cx, cy + Math.sin(s.armWave) * 1.5, 46, 46, {
            rotation: Math.sin(s.armWave * 0.5) * 0.04,
            glowBlur: 7
        });

    if (!spriteDrawn) {
      ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#e6e6e6';
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-6, -2, 12, 14, 4);
        ctx.fill();
    } else {
        ctx.fillRect(-6, -2, 12, 14);
    }

    const wave = Math.sin(s.armWave) * 10;
    ctx.strokeStyle = '#e6e6e6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-13, -6 + wave * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(13, -6 - wave * 0.4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-3, 12);
    ctx.lineTo(-4, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, 12);
    ctx.lineTo(4, 18);
    ctx.stroke();

    const blink = 0.6 + Math.sin(Date.now() / 150) * 0.4;
    ctx.fillStyle = `rgba(120, 220, 255, ${blink})`;
    ctx.beginPath();
    ctx.arc(0, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cceeff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

      ctx.restore();
    }

    if (s.rescueProgress > 0) {
        const frac = s.rescueProgress / effectiveRescueHoldTime();
        const ringR = 22;

        ctx.strokeStyle = 'rgba(0,255,255,0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();

        const spinAngle = (Date.now() / (140 - frac * 90)) % (Math.PI * 2);
        const bx = cx + Math.cos(spinAngle) * ringR;
        const by = cy + Math.sin(spinAngle) * ringR;
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawRescues() {
    survivors.forEach(drawSurvivor);
}
