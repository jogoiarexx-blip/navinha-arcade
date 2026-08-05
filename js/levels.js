// ================= FASES (MODO HISTÓRIA) =================
// Paralaxe de 3 camadas, configuração de cada uma das 10 fases,
// início/reinício de partida (aplicando dificuldade e upgrades
// permanentes), avanço entre fases e finalização da corrida
// (vitória ou derrota), incluindo ranking e créditos.

function initStars() {
    stars = [];
    starsFar = [];
    starsNear = [];
    // alphaBase + twinklePhase: o brilho oscila com sin no draw,
    // sem Math.random() a cada quadro (mais barato e sem cintilação caótica).
    for (let i = 0; i < 90; i++) {
        starsFar.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.3 + 0.4,
            speed: Math.random() * 1 + 0.4,
            alphaBase: 0.35 + Math.random() * 0.2,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.015 + Math.random() * 0.025
        });
    }
    for (let i = 0; i < 110; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.8 + 0.6,
            speed: Math.random() * 2 + 1.2,
            alphaBase: 0.5 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.02 + Math.random() * 0.035
        });
    }
    for (let i = 0; i < 50; i++) {
        starsNear.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2.4 + 1.2,
            speed: Math.random() * 3.5 + 2.5,
            alphaBase: 0.7 + Math.random() * 0.25,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.025 + Math.random() * 0.04
        });
    }
}

function setupLevel(level) {
    currentLevel = level;
    enemiesKilledThisLevel = 0;
    bossActive = false;
    const phase = getPhase(level);
    enemiesToKill = phase.enemiesToKill || (12 + level * 3);
    levelDecor = generateLevelDecor(level);
    resetPhaseObjectives();
    phaseScoreStart = score;
    if (typeof setMusicForLevel === 'function') setMusicForLevel(level);
}

// Reinicia contadores de objetivos da fase (estrelas / resgates / perfect)
function resetPhaseObjectives() {
    phaseTookDamage = false;
    phaseMaxCombo = 0;
    phaseObjectivesMet = null;
    lastPhaseStarsEarned = null;
    if (typeof resetPhaseRescues === 'function') {
        resetPhaseRescues();
    } else {
        phaseSurvivorsSpawned = 0;
        phaseSurvivorsRescued = 0;
        phaseSurvivorsMissed = 0;
        phaseTargetSurvivors = typeof survivorsTargetForLevel === 'function'
            ? survivorsTargetForLevel(currentLevel) : 2;
    }
}

// Calcula 0–3 estrelas da fase atual com base nos objetivos:
// ★1 Completar (derrotar o chefe) — sempre concedida ao chamar esta função
// ★2 Resgatar todos os sobreviventes da fase
// ★3 Perfect: zero dano na fase
function computePhaseStars() {
    const details = [];
    let stars = 0;

    // Objetivo 1: completar a fase
    stars += 1;
    details.push({ ok: true, label: 'Completar a fase' });

    // Objetivo 2: resgatar todos os sobreviventes
    // Só conta se o alvo foi gerado (ou quase — todos que apareceram foram salvos)
    const allRescued = phaseSurvivorsSpawned > 0 &&
        phaseSurvivorsRescued >= phaseSurvivorsSpawned &&
        phaseSurvivorsMissed === 0;
    // Exige pelo menos metade do alvo gerado para não premiar fases em que quase ninguém apareceu
    const enoughSpawned = phaseSurvivorsSpawned >= Math.max(1, Math.ceil(phaseTargetSurvivors * 0.5));
    const rescueOk = allRescued && enoughSpawned;
    if (rescueOk) stars += 1;
    details.push({
        ok: rescueOk,
        label: 'Resgatar todos (' + phaseSurvivorsRescued + '/' + phaseSurvivorsSpawned +
            ' de ' + phaseTargetSurvivors + ')'
    });

    // Objetivo 3: perfect (sem dano)
    const perfectOk = !phaseTookDamage;
    if (perfectOk) stars += 1;
    details.push({
        ok: perfectOk,
        label: perfectOk ? 'Perfect — zero dano' : 'Tomou dano na fase'
    });

    phaseObjectivesMet = details;
    return { stars, details };
}

// Atribui estrelas da fase, atualiza melhor marca e (se aplicável) estrelas da dificuldade
function awardPhaseStars(level) {
    const result = computePhaseStars();
    lastPhaseStarsEarned = result;
    const diffKey = DIFFICULTIES[difficultyIndex];
    const improved = setPhaseStarsBest(diffKey, level, result.stars);

    // Atualiza estrelas agregadas da dificuldade a partir do desempenho por fase
    const newDiffStars = recomputeDifficultyStars(diffKey);
    const prevDiff = starsByDifficulty[diffKey] || 0;
    if (newDiffStars > prevDiff) {
        starsByDifficulty[diffKey] = newDiffStars;
        safeSet('navinhaStars', starsByDifficulty);
        if (newDiffStars >= 5 && prevDiff < 5) {
            const nextIdx = difficultyIndex + 1;
            if (nextIdx < DIFFICULTIES.length) {
                lastUnlockedDifficulty = DIFFICULTIES[nextIdx];
            }
        }
    }
    return result;
}

// Desenha os elementos decorativos de fundo da fase atual (gerados em
// generateLevelDecor). Cada tema tem seu próprio visual, dando uma
// identidade diferente a cada par de fases.
function drawLevelDecor() {
    levelDecor.forEach(d => {
        if (d.type === 'blob') {
            const pulse = 0.75 + 0.25 * Math.sin(d.twinklePhase || 0);
            ctx.globalAlpha = d.alphaBase * pulse;
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (d.type === 'asteroid') {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rot || 0);
            ctx.fillStyle = '#544438';
            ctx.beginPath();
            ctx.moveTo(-d.r, -d.r * 0.3);
            ctx.lineTo(-d.r * 0.3, -d.r);
            ctx.lineTo(d.r * 0.5, -d.r * 0.7);
            ctx.lineTo(d.r, 0);
            ctx.lineTo(d.r * 0.4, d.r * 0.8);
            ctx.lineTo(-d.r * 0.5, d.r * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#221a12';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (d.type === 'crystal') {
            const pulse = 0.8 + 0.2 * Math.sin(d.twinklePhase || 0);
            ctx.fillStyle = 'rgba(80,220,255,' + (0.3 * pulse).toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(d.x, d.y - d.r);
            ctx.lineTo(d.x + d.r * 0.55, d.y);
            ctx.lineTo(d.x, d.y + d.r);
            ctx.lineTo(d.x - d.r * 0.55, d.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(180,245,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (d.type === 'coreGlow') {
            const pulse = 0.7 + 0.3 * Math.sin(d.twinklePhase || 0);
            ctx.globalAlpha = pulse;
            ctx.fillStyle = d.grad || 'rgba(255,80,0,0.08)';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (d.type === 'planet') {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = d.grad || d.color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = d.color;
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1;
        } else if (d.type === 'dust') {
            const pulse = 0.6 + 0.4 * Math.sin(d.twinklePhase || 0);
            ctx.globalAlpha = d.alphaBase * pulse;
            ctx.fillStyle = d.color;
            ctx.fillRect(d.x, d.y, d.size, d.size);
            ctx.globalAlpha = 1;
        }
    });
}

function buildPlayer() {
    const diff = currentDifficulty();
    const lives = diff.startLives + permanentUpgrades.life;
    // Usa a nave escolhida (se ainda estiver liberada) ou cai para a padrão.
    const shipIdx = shipsUnlocked[selectedShip] ? selectedShip : 0;
    const ship = SHIP_DEFS[shipIdx];
    const maxHealth = lives + (ship.healthBonus || 0);
    return {
        x: W / 2 - ship.w / 2,
        y: H - 80,
        w: ship.w,
        h: ship.h,
        speed: ship.speed,
        health: maxHealth,
        maxHealth: maxHealth,
        invincible: 0,
        weaponLevel: 1,
        shield: permanentUpgrades.shield,
        shootCooldown: 0,
        fireRateBonus: permanentUpgrades.firerate,
        shipType: shipIdx,
        bulletDmg: ship.bulletDmg || 1
    };
}

function clearCombatState() {
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerups = [];
    if (typeof survivors !== 'undefined') survivors = [];
    bossActive = false;
}

function resetGame() {
    score = 0;
    resetCombo();
    maxComboReached = 0;
    lastRunStars = null;
    lastCreditsEarned = 0;
    runCreditsEarned = 0;
    continuousRun = true;
    clearCombatState();
    player = buildPlayer();
    setupLevel(1);
    resetRescues();
    if (!tutorialSeen) {
        gameState = 'TUTORIAL';
    } else {
        gameState = 'PLAYING';
    }
    initAudio();
}

// Começa numa fase já desbloqueada (run nova daquela fase — score zera,
// mas créditos de fases anteriores já foram pagos ao limpar cada uma).
function startFromLevel(level) {
    score = 0;
    resetCombo();
    maxComboReached = 0;
    lastRunStars = null;
    lastCreditsEarned = 0;
    runCreditsEarned = 0;
    continuousRun = false;
    clearCombatState();
    player = buildPlayer();
    setupLevel(level);
    resetRescues();
    gameState = 'LEVEL_TRANSITION';
    levelTransitionTimer = 110;
    initAudio();
}

// Continua a run após PHASE_RESULT (mantém score, vida e upgrades da partida)
function continueToNextLevel() {
    const next = currentLevel + 1;
    if (next > MAX_LEVEL) {
        finishRun(true);
        return;
    }
    continuousRun = true;
    resetCombo();
    clearCombatState();
    player.health = Math.min(player.maxHealth, player.health + 1);
    setupLevel(next);
    if (typeof resetPhaseRescues === 'function') resetPhaseRescues();
    gameState = 'LEVEL_TRANSITION';
    levelTransitionTimer = 100;
    playSound(400, 0.1, 'sine', 0.08);
}

// Repete a mesma fase (game over ou resultado)
function retryLevel() {
    const lvl = currentLevel;
    startFromLevel(lvl);
}

// Chamado ao derrotar o chefe: avalia estrelas, paga créditos e abre PHASE_RESULT
function nextLevel() {
    const beatenLevel = currentLevel;
    lastUnlockedDifficulty = null;

    const phaseResult = awardPhaseStars(beatenLevel);
    const phasePoints = Math.max(0, score - phaseScoreStart);
    lastCreditsEarned = grantCredits(computePhaseCredits(phasePoints, phaseResult.stars));

    if (score > highScore) {
        highScore = score;
        safeSet('navinhaHighScore', highScore);
    }

    if (beatenLevel >= MAX_LEVEL) {
        if (MAX_LEVEL > unlockedLevel) {
            unlockedLevel = MAX_LEVEL;
            safeSet('navinhaUnlockedLevel', unlockedLevel);
        }
        clearCombatState();
        finishRun(true);
        playStarJingle(phaseResult.stars);
        return;
    }

    if (beatenLevel + 1 > unlockedLevel) {
        unlockedLevel = beatenLevel + 1;
        safeSet('navinhaUnlockedLevel', unlockedLevel);
    }

    clearCombatState();
    if (typeof survivors !== 'undefined') survivors = [];

    const starTxt = starString3(phaseResult.stars);
    let msg = 'Fase ' + beatenLevel + ' ' + starTxt;
    const failed = (phaseResult.details || []).filter(d => !d.ok).map(d => d.label);
    if (failed.length) {
        phaseClearMessage = msg + '\nFaltou: ' + failed.join(' · ');
    } else {
        phaseClearMessage = msg + '\n★ Objetivos completos!';
    }
    phaseClearTimer = 360;

    gameState = 'PHASE_RESULT';
    playStarJingle(phaseResult.stars);
}

function computeStarRating() {
    const diffKey = DIFFICULTIES[difficultyIndex];
    const fromPhases = recomputeDifficultyStars(diffKey);
    const healthFrac = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
    const comboFrac = Math.min(1, maxComboReached / 30);
    const runBonus = Math.round((healthFrac * 0.6 + comboFrac * 0.4) * 2);
    return Math.max(1, Math.min(5, Math.max(fromPhases, fromPhases > 0 ? fromPhases : 1 + Math.min(1, runBonus))));
}

// Fim de corrida (derrota ou história completa). Créditos da fase em andamento
// (parcial no game over) ou já pagos no clear da fase 10.
function finishRun(won) {
    gameState = won ? 'STORY_COMPLETE' : 'GAMEOVER';
    lastRunStars = null;

    // Game over: paga créditos da fase atual (ainda não finalizada)
    if (!won) {
        const phasePoints = Math.max(0, score - phaseScoreStart);
        lastCreditsEarned = grantCredits(computePhaseCredits(phasePoints, 0));
    }

    if (score > highScore) {
        highScore = score;
        safeSet('navinhaHighScore', highScore);
    }

    rankings.push({
        score: score,
        level: currentLevel,
        difficulty: DIFFICULTIES[difficultyIndex]
    });
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 5);
    safeSet('navinhaRankings', rankings);

    if (won) {
        const diffKey = DIFFICULTIES[difficultyIndex];
        if (lastPhaseStarsEarned) {
            setPhaseStarsBest(diffKey, currentLevel, lastPhaseStarsEarned.stars);
        }
        const stars = recomputeDifficultyStars(diffKey);
        lastRunStars = stars;

        const previousBest = starsByDifficulty[diffKey] || 0;
        if (stars > previousBest) {
            starsByDifficulty[diffKey] = stars;
            safeSet('navinhaStars', starsByDifficulty);
        }
        if (stars >= 5 && previousBest < 5) {
            const nextIdx = difficultyIndex + 1;
            if (nextIdx < DIFFICULTIES.length) {
                lastUnlockedDifficulty = DIFFICULTIES[nextIdx];
            }
        }
        // Bônus de conclusão da história
        const clearBonus = Math.floor(50 * creditDifficultyMult());
        lastCreditsEarned = (lastCreditsEarned || 0) + grantCredits(clearBonus);
    }
}
