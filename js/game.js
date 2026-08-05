// ================= LOOP PRINCIPAL DO JOGO =================
// Atualiza o estado (update) e desenha cada quadro (draw). Também
// concentra o tratamento de dano ao jogador e o laço de animação.
// Carregado por último: depende de todos os outros módulos.

function update() {
    if (lockMessageTimer > 0) lockMessageTimer--;
    if (phaseClearTimer > 0) phaseClearTimer--;
    if (shakeTime > 0) shakeTime--; // decrementa sempre, mesmo fora de PLAYING (corrige tremor infinito no game over)

    // Estrelas (3 camadas de paralaxe) e decoração de fundo da fase sempre
    // se movem, exceto pausado
    if (gameState !== 'PAUSED') {
        [starsFar, stars, starsNear].forEach(layer => {
            layer.forEach(s => {
                s.y += s.speed;
                s.twinklePhase += s.twinkleSpeed;
                if (s.y > H) {
                    s.y = 0;
                    s.x = Math.random() * W;
                }
            });
        });
        levelDecor.forEach(d => {
            if (d.speed) {
                d.y += d.speed;
                if (d.y - d.r > H) {
                    d.y = -d.r;
                    d.x = Math.random() * W;
                }
            }
            if (d.vx) {
                d.x += d.vx;
                if (d.x < -d.r) d.x = W + d.r;
                if (d.x > W + d.r) d.x = -d.r;
            }
            if (d.rot !== undefined) d.rot += (d.rotSpeed !== undefined ? d.rotSpeed : 0.01);
            if (d.twinklePhase !== undefined) d.twinklePhase += (d.twinkleSpeed || 0.02);
            if (d.type === 'planet') d.x -= d.driftSpeed || 0; // deriva lenta, quase imperceptível
        });
    }

    if (gameState === 'LEVEL_TRANSITION') {
        levelTransitionTimer--;
        if (levelTransitionTimer <= 0) {
            gameState = 'PLAYING';
        }
        return;
    }

    if (gameState !== 'PLAYING') return;

    // Hit-stop: congela a lógica de combate por alguns frames (impacto)
    if (hitStopFrames > 0) {
        hitStopFrames--;
        if (player.invincible > 0) player.invincible--;
        return;
    }

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) comboCount = 0;
    }

    if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if (keys['arrowright'] || keys['d']) player.x += player.speed;
    if (keys['arrowup'] || keys['w']) player.y -= player.speed;
    if (keys['arrowdown'] || keys['s']) player.y += player.speed;

    if (keys[' '] || isTouching) shoot();

    // Toque / mouse: segue X e Y
    if (touchX !== null) {
        const targetX = touchX - player.w / 2;
        player.x += (targetX - player.x) * 0.28;
    }
    if (typeof touchY === 'number' && touchY !== null) {
        const targetY = touchY - player.h / 2;
        player.y += (targetY - player.y) * 0.28;
    }

    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.invincible > 0) player.invincible--;

    bullets.forEach(b => {
        b.y -= b.speed;
        if (b.vx) b.x += b.vx;
    });
    bullets = bullets.filter(b => b.y > -30 && b.x > -30 && b.x < W + 30);

    enemyBullets.forEach(b => {
        b.y += b.speed;
        if (b.vx) b.x += b.vx;
    });
    enemyBullets = enemyBullets.filter(b => b.y < H + 30 && b.x > -30 && b.x < W + 30);

    const diff = currentDifficulty();
    enemySpawnTimer++;
    let spawnRate = Math.max(20, (85 - currentLevel * 6)) / diff.spawnRateMult;
    // Durante o chefe não spawna lixo de tela
    if (!bossActive && enemySpawnTimer > spawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    if (enemiesKilledThisLevel >= enemiesToKill && !bossActive && enemies.length === 0) {
        spawnBoss();
    }

    enemies.forEach(e => {
        if (e.hitFlash > 0) e.hitFlash--;
        updateEnemy(e);

        if (collide(player, e) && player.invincible <= 0) {
            if (player.shield > 0) {
                absorbHitWithShield(40);
                playExplosion();
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#0ff', 25);
                e.health = 0;
            } else {
                playerHit();
                e.health = 0;
            }
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
            if (bullets[i] && collide(bullets[i], e)) {
                const bx = bullets[i].x;
                const by = bullets[i].y;
                const bDmg = bullets[i].dmg || 1;
                bullets.splice(i, 1);
                e.health -= bDmg;
                e.hitFlash = 4;
                spawnParticles(bx, by, '#fff', 4);
                hitStopFrames = e.type === 'boss' ? 3 : 1;

                if (e.health <= 0) {
                    playExplosion();
                    shakeTime = e.type === 'boss' ? 18 : (e.type === 'tank' ? 10 : 6);
                    hitStopFrames = e.type === 'boss' ? 8 : 2;

                    const scoreTable = {
                        boss: 500, shooter: 25, tank: 30, spinner: 20,
                        splitter: 15, splitter_mini: 8, zigzag: 12, normal: 10
                    };
                    // Chefe também entra no combo / multiplicador
                    registerKill(scoreTable[e.type] || 10);
                    if (e.type !== 'boss') {
                        enemiesKilledThisLevel++;
                    }

                    spawnParticles(e.x + e.w / 2, e.y + e.h / 2,
                        e.type === 'boss' ? '#f00' : (e.type === 'tank' ? '#fa0' : '#ff0'),
                        e.type === 'boss' ? 60 : (e.type === 'tank' ? 22 : 15));

                    if (e.type === 'splitter') {
                        spawnEnemyOfType('splitter_mini', e.x + e.w / 2 - 24, e.y + e.h / 2);
                        spawnEnemyOfType('splitter_mini', e.x + e.w / 2 + 6, e.y + e.h / 2);
                    }

                    if (e.type !== 'boss') {
                        maybeSpawnPowerup(e.x + e.w / 2 - 11, e.y + e.h / 2);
                    }

                    if (e.type === 'boss') {
                        bossActive = false;
                        nextLevel();
                    }
                }
            }
        }
    });

    enemies = enemies.filter(e => e.health > 0 && e.y < H + 80);

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (collide(player, enemyBullets[i]) && player.invincible <= 0) {
            if (player.shield > 0) {
                absorbHitWithShield(30);
                playSound(300, 0.1, 'sine', 0.1);
            } else {
                playerHit();
            }
            enemyBullets.splice(i, 1);
        }
    }

    powerups.forEach(p => {
        // Ímã leve se o upgrade permanente existir no futuro / ou sempre fraco perto
        const dx = (player.x + player.w / 2) - (p.x + 11);
        const dy = (player.y + player.h / 2) - (p.y + 11);
        const dist = Math.hypot(dx, dy);
        if (dist < 90) {
            p.x += dx * 0.04;
            p.y += dy * 0.04;
        }
        p.y += p.speed;
        p.life--;
    });
    powerups = powerups.filter(p => p.y < H + 30 && p.life > 0);

    for (let i = powerups.length - 1; i >= 0; i--) {
        if (collide(player, powerups[i])) {
            const p = powerups[i];
            applyPowerup(p.type);
            spawnParticles(p.x + 11, p.y + 11, '#0f0', 12);
            powerups.splice(i, 1);
        }
    }

    updateRescues();

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);
}

// Escudo absorve o hit: ainda invalida Perfect (foi atingido)
function absorbHitWithShield(invFrames) {
    player.shield--;
    player.invincible = invFrames;
    phaseTookDamage = true;
    hitStopFrames = 3;
    shakeTime = 8;
}

// Quatro padrões de ataque de chefe — cada fase escolhe o seu em
// js/phases/faseN.js, então bosses de fases diferentes atacam diferente.
// Duração da telegrafia visual antes de cada disparo do chefe (~0.4s a 60fps).
const BOSS_TELEGRAPH_FRAMES = 24;

// Trava o que o próximo disparo vai fazer (mira, tiro central, ângulo da espiral)
// no início da telegrafia, para o aviso na tela bater com o ataque real.
function beginBossTelegraph(e) {
    e.telegraphing = true;
    e.telegraphDuration = Math.max(1, e.shootTimer);
    const pattern = e.bossPattern || 0;

    if (pattern === 0) {
        // Decide já se haverá o tiro central amarelo
        e.telegraphCenter = Math.random() > 0.6;
    } else if (pattern === 2) {
        // Mira travada na posição do jogador no instante do aviso
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h;
        const dx = (player.x + player.w / 2) - cx;
        const dy = (player.y + player.h / 2) - cy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        e.telegraphDx = dx / dist;
        e.telegraphDy = dy / dist;
    } else if (pattern === 3) {
        // Avança o ângulo da espiral agora, para as linhas de aviso coincidirem com o tiro
        e.spiralAngle = (e.spiralAngle || 0) + 0.7;
    }

    playSound(180, 0.12, 'triangle', 0.06);
}

function fireBossPattern(e) {
    const pattern = e.bossPattern || 0;

    if (pattern === 0) {
        // Tiro duplo + ocasional tiro central (decisão já feita na telegrafia)
        enemyBullets.push({ x: e.x + 25, y: e.y + e.h - 10, w: 8, h: 16, speed: 4.5, color: '#f00' });
        enemyBullets.push({ x: e.x + e.w - 33, y: e.y + e.h - 10, w: 8, h: 16, speed: 4.5, color: '#f00' });
        if (e.telegraphCenter) {
            enemyBullets.push({ x: e.x + e.w / 2 - 4, y: e.y + e.h, w: 8, h: 16, speed: 5, color: '#ff0' });
        }
    } else if (pattern === 1) {
        // Leque de 5 tiros
        const count = 5;
        for (let i = 0; i < count; i++) {
            const t = (i / (count - 1)) - 0.5; // -0.5 .. 0.5
            enemyBullets.push({
                x: e.x + e.w / 2 - 4, y: e.y + e.h, w: 8, h: 16,
                speed: 4.8, vx: t * 4.5, color: '#ff8800'
            });
        }
    } else if (pattern === 2) {
        // Tiro mirado — usa a direção travada na telegrafia (fallback se faltar)
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h;
        let dx = e.telegraphDx, dy = e.telegraphDy;
        if (dx === undefined || dy === undefined) {
            const pdx = (player.x + player.w / 2) - cx;
            const pdy = (player.y + player.h / 2) - cy;
            const dist = Math.max(1, Math.hypot(pdx, pdy));
            dx = pdx / dist;
            dy = pdy / dist;
        }
        const spd = 5.2;
        enemyBullets.push({
            x: cx - 4, y: cy, w: 8, h: 16, speed: spd * dy,
            vx: spd * dx, color: '#ff00ff'
        });
    } else {
        // Rajada em espiral: ângulo já avançado em beginBossTelegraph
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h * 0.75;
        const speedMag = 4.2;
        const baseAng = e.spiralAngle || 0;
        for (let i = 0; i < 3; i++) {
            const ang = baseAng + i * (Math.PI * 2 / 3);
            enemyBullets.push({
                x: cx - 4, y: cy, w: 8, h: 16,
                speed: Math.max(1.5, speedMag * Math.sin(ang) + 2.2),
                vx: speedMag * Math.cos(ang),
                color: '#a0ff00'
            });
        }
    }
    playSound(140, 0.18, 'sawtooth', 0.1);
}

function playerHit() {
    player.health--;
    player.invincible = 70;
    shakeTime = 18;
    phaseTookDamage = true;
    hitStopFrames = 6;
    resetCombo();
    vibrate(120);
    playSound(90, 0.35, 'sawtooth', 0.22);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#f00', 25);

    if (player.health <= 0) {
        vibrate([80, 60, 120]);
        finishRun(false);
    } else {
        // Perde no máx. 1 nível de arma (menos punitivo)
        player.weaponLevel = Math.max(1, player.weaponLevel - 1);
    }
}

function draw() {
    ctx.save();
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    const inGameplay = (gameState === 'PLAYING' || gameState === 'LEVEL_TRANSITION' ||
                         gameState === 'GAMEOVER' || gameState === 'PAUSED' ||
                         gameState === 'PHASE_RESULT' || gameState === 'TUTORIAL');

    if (inGameplay) {
        const theme = getLevelTheme(currentLevel);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, theme.bgTop);
        grad.addColorStop(1, theme.bgBottom);
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = '#000';
    }
    ctx.fillRect(0, 0, W, H);

    if (inGameplay) drawLevelDecor();

    ctx.fillStyle = '#557';
    starsFar.forEach(s => {
        ctx.globalAlpha = s.alphaBase * (0.75 + 0.25 * Math.sin(s.twinklePhase));
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.globalAlpha = s.alphaBase * (0.7 + 0.3 * Math.sin(s.twinklePhase));
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.fillStyle = '#aef';
    starsNear.forEach(s => {
        ctx.globalAlpha = s.alphaBase * (0.65 + 0.35 * Math.sin(s.twinklePhase));
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;

    if (gameState === 'START') {
        drawStartScreen();
    } else if (gameState === 'SHOP') {
        drawShopScreen();
    } else if (gameState === 'LEVEL_SELECT') {
        drawLevelSelectScreen();
    } else if (gameState === 'STORY_COMPLETE') {
        drawStoryCompleteScreen();
    } else {
        if (player && player.w && (player.invincible <= 0 || Math.floor(player.invincible / 4) % 2 === 0)) {
            drawPlayerShip();
            if (player.shield > 0) {
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.45 + Math.sin(Date.now() / 90) * 0.25})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 38, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 12;
        bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.shadowBlur = 0;

        enemyBullets.forEach(b => {
            ctx.fillStyle = b.color || '#f0f';
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        enemies.forEach(e => {
            drawEnemy(e);
            if (e.hitFlash > 0) {
                // Flash de dano: overlay branco aditivo em vez de ctx.filter
                // (ctx.filter='brightness()' processa pixel a pixel e derruba
                // o FPS quando o boss, que é grande, toma tiro quase todo frame).
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.35 * (e.hitFlash / 4);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(e.x + e.w / 2, e.y + e.h / 2, e.w * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });

        drawPowerups();
        drawRescues();

        particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / 40);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        drawHUD();

        if (gameState === 'LEVEL_TRANSITION') drawLevelTransitionOverlay();
        if (gameState === 'GAMEOVER') drawGameOverOverlay();
        if (gameState === 'PAUSED') drawPauseOverlay();
        if (gameState === 'PHASE_RESULT') drawPhaseResultOverlay();
        if (gameState === 'TUTORIAL') drawTutorialOverlay();
    }

    // Botão de mute sempre visível
    drawMuteButton();

    ctx.restore();
}

// ================= LOOP =================
function gameLoop() {
    try {
        update();
        draw();
    } catch (err) {
        // Mostra o erro na tela em vez de deixar tudo preto e silencioso
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f00';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Erro no jogo:', W / 2, H / 2 - 20);
        ctx.font = '12px Courier New';
        ctx.fillText(String(err.message || err), W / 2, H / 2 + 10);
        console.error(err);
    }
    requestAnimationFrame(gameLoop);
}

// Inicialização
initStars();
gameLoop();
