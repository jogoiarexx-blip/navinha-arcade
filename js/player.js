// ================= JOGADOR =================
// Controles de entrada (teclado, toque e mouse), navegação de menus
// (dificuldade, loja, seleção de fase, pausa) e desenho da navinha.
//
// Observação: a navegação dos menus (loja, seleção de fase, dificuldade)
// usa teclado, já que o jogo não tem botões desenhados na tela. O toque
// continua funcionando normalmente para jogar (mover/atirar) e para
// iniciar/reiniciar a partir das telas de menu, game over e vitória.

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        playSound(200, 0.15, 'sine', 0.08);
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        playSound(400, 0.15, 'sine', 0.08);
    }
}

// Move o seletor de dificuldade no menu, respeitando o bloqueio: uma
// dificuldade só pode ser selecionada se a anterior já tiver 5 estrelas.
function changeDifficulty(delta) {
    const target = (difficultyIndex + delta + DIFFICULTIES.length) % DIFFICULTIES.length;
    if (isDifficultyUnlocked(target)) {
        difficultyIndex = target;
        lockMessageTimer = 0;
        playSound(300, 0.05, 'square', 0.06);
    } else {
        const requiredKey = DIFFICULTIES[target - 1];
        const requiredLabel = DIFFICULTY_CONFIG[requiredKey].label;
        lockMessage = 'Bloqueada — vença a história com 5★ em ' + requiredLabel;
        lockMessageTimer = 150;
        playSound(150, 0.12, 'sawtooth', 0.08);
    }
}

window.addEventListener('keydown', (e) => {
    initAudio();
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (e.key === ' ') e.preventDefault();

    if (k === 'n') { // mute global
        toggleMute();
        return;
    }

    if (gameState === 'START') {
        if (k === 'arrowleft' || k === 'a') {
            changeDifficulty(-1);
        } else if (k === 'arrowright' || k === 'd') {
            changeDifficulty(1);
        } else if (k === ' ' || k === 'enter') {
            resetGame();
        } else if (k === 'm') {
            gameState = 'SHOP';
        } else if (k === 'f' && unlockedLevel > 1) {
            gameState = 'LEVEL_SELECT';
        } else if (k === 'v') {
            cycleSelectedShip(1);
        }
    } else if (gameState === 'SHOP') {
        if (k === '1') purchaseUpgrade('life');
        else if (k === '2') purchaseUpgrade('firerate');
        else if (k === '3') purchaseUpgrade('shield');
        else if (k === '4') purchaseUpgrade('damage');
        else if (k === '5') purchaseUpgrade('rescuerange');
        else if (k === '6') purchaseUpgrade('rescuespeed');
        else if (k >= '7' && k <= '9') {
            const pos = k.charCodeAt(0) - '7'.charCodeAt(0);
            if (LOCKABLE_SHIP_INDICES[pos] !== undefined) purchaseShipUnlock(LOCKABLE_SHIP_INDICES[pos]);
        }
        else if (k === 'escape' || k === 'backspace' || k === ' ') gameState = 'START';
    } else if (gameState === 'LEVEL_SELECT') {
        const digit = parseInt(k, 10);
        if (!isNaN(digit)) {
            const lvl = digit === 0 ? 10 : digit;
            if (lvl <= unlockedLevel) startFromLevel(lvl);
        } else if (k === 'escape' || k === 'backspace') {
            gameState = 'START';
        }
    } else if (gameState === 'TUTORIAL') {
        if (k === ' ' || k === 'enter' || k === 'escape') dismissTutorial();
    } else if (gameState === 'PHASE_RESULT') {
        if (k === ' ' || k === 'enter') continueToNextLevel();
        else if (k === 'f') { phaseClearTimer = 240; LevelManager.leaveTo('LEVEL_SELECT'); }
        else if (k === 'escape') LevelManager.leaveTo('START');
    } else if (gameState === 'GAMEOVER') {
        if (k === 'r') retryLevel();
        else if (k === ' ' || k === 'enter') LevelManager.leaveTo('START');
    } else if (gameState === 'STORY_COMPLETE') {
        if (k === ' ' || k === 'enter') LevelManager.leaveTo('START');
    } else if (gameState === 'LOADING') {
        if ((k === ' ' || k === 'enter') && LoadingScreen.error) LoadingScreen.retry();
        else if (k === 'escape') LevelManager.leaveTo('START');
    } else if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        if (k === 'p' || k === 'escape') togglePause();
    }
});

function dismissTutorial() {
    tutorialSeen = true;
    safeSet('navinhaTutorialSeen', true);
    gameState = 'PLAYING';
    playSound(520, 0.1, 'sine', 0.08);
}
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Pausa automática ao perder o foco da aba/janela
window.addEventListener('blur', () => {
    if (gameState === 'PLAYING') togglePause();
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState === 'PLAYING') togglePause();
});

// Trata um toque/clique num ponto (px,py) em coordenadas do canvas,
// para qualquer tela de menu que tenha botões tocáveis definidos em
// uiButtons (populados a cada draw() em ui.js). Compartilhado entre
// touchstart e mousedown para não duplicar a lógica.
function handleMenuTap(px, py) {
    // Mute sempre clicável no canto
    if (uiButtons.muteBtn && pointInRect(px, py, uiButtons.muteBtn)) {
        toggleMute();
        return;
    }
    if (gameState === 'START') {
        if (pointInRect(px, py, uiButtons.diffLeft)) { changeDifficulty(-1); return; }
        if (pointInRect(px, py, uiButtons.diffRight)) { changeDifficulty(1); return; }
        if (pointInRect(px, py, uiButtons.shop)) { gameState = 'SHOP'; playSound(400, 0.08, 'sine', 0.08); return; }
        if (uiButtons.levelSelect && pointInRect(px, py, uiButtons.levelSelect)) {
            gameState = 'LEVEL_SELECT';
            playSound(400, 0.08, 'sine', 0.08);
            return;
        }
        if (uiButtons.shipLeft && pointInRect(px, py, uiButtons.shipLeft)) { cycleSelectedShip(-1); return; }
        if (uiButtons.shipRight && pointInRect(px, py, uiButtons.shipRight)) { cycleSelectedShip(1); return; }
        if (pointInRect(px, py, uiButtons.playButton)) { resetGame(); return; }
        resetGame();
    } else if (gameState === 'SHOP') {
        if (pointInRect(px, py, uiButtons.shopBack)) { gameState = 'START'; return; }
        (uiButtons.shopRows || []).forEach((r, i) => {
            if (pointInRect(px, py, r)) purchaseUpgrade(PERMANENT_UPGRADE_DEFS[i].key);
        });
        (uiButtons.shipUnlockRows || []).forEach((r, i) => {
            if (r && pointInRect(px, py, r)) purchaseShipUnlock(LOCKABLE_SHIP_INDICES[i]);
        });
    } else if (gameState === 'LEVEL_SELECT') {
        if (pointInRect(px, py, uiButtons.levelBack)) { gameState = 'START'; return; }
        (uiButtons.levelCells || []).forEach((r, i) => {
            if (r && pointInRect(px, py, r)) startFromLevel(i + 1);
        });
    } else if (gameState === 'TUTORIAL') {
        dismissTutorial();
    } else if (gameState === 'PHASE_RESULT') {
        if (pointInRect(px, py, uiButtons.phaseContinue)) { continueToNextLevel(); return; }
        if (pointInRect(px, py, uiButtons.phaseSelect)) { phaseClearTimer = 240; LevelManager.leaveTo('LEVEL_SELECT'); return; }
        if (pointInRect(px, py, uiButtons.phaseMenu)) { LevelManager.leaveTo('START'); return; }
        continueToNextLevel();
    } else if (gameState === 'GAMEOVER') {
        if (pointInRect(px, py, uiButtons.retryBtn)) { retryLevel(); return; }
        if (pointInRect(px, py, uiButtons.menuBtn)) { LevelManager.leaveTo('START'); return; }
        LevelManager.leaveTo('START');
    } else if (gameState === 'STORY_COMPLETE') {
        LevelManager.leaveTo('START');
    } else if (gameState === 'LOADING') {
        if (LoadingScreen.error && pointInRect(px, py, uiButtons.loadingRetry)) LoadingScreen.retry();
    } else if (gameState === 'PAUSED') {
        togglePause();
    }
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    let rect = canvas.getBoundingClientRect();
    const px = (e.touches[0].clientX - rect.left) * (W / rect.width);
    const py = (e.touches[0].clientY - rect.top) * (H / rect.height);

    if (gameState === 'PLAYING') {
        isTouching = true;
        touchX = px;
        touchY = py;
    } else {
        handleMenuTap(px, py);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState !== 'PLAYING') return;
    let rect = canvas.getBoundingClientRect();
    touchX = (e.touches[0].clientX - rect.left) * (W / rect.width);
    touchY = (e.touches[0].clientY - rect.top) * (H / rect.height);
}, { passive: false });

canvas.addEventListener('touchend', () => {
    isTouching = false;
    touchX = null;
    touchY = null;
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    initAudio();
    let rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);

    if (gameState === 'PLAYING') {
        isTouching = true;
        touchX = px;
        touchY = py;
    } else {
        handleMenuTap(px, py);
    }
});
window.addEventListener('mousemove', (e) => {
    if (isTouching && gameState === 'PLAYING') {
        let rect = canvas.getBoundingClientRect();
        touchX = (e.clientX - rect.left) * (W / rect.width);
        touchY = (e.clientY - rect.top) * (H / rect.height);
    }
});
window.addEventListener('mouseup', () => {
    isTouching = false;
    touchX = null;
    touchY = null;
});

// Despacha para o desenho da nave certa, de acordo com a nave escolhida
// para a partida atual (guardada em player.shipType ao criar o player).
function drawPlayerShip() {
    const shipType = (player && typeof player.shipType === 'number') ? player.shipType : selectedShip;
    const def = SHIP_DEFS[shipType] || SHIP_DEFS[0];
    if (ShipSpriteManager.draw(shipType, player.x + player.w / 2, player.y + player.h / 2,
        def.renderH || player.h, { glow: def.color, glowBlur: 5 })) return;
    if (shipType === 1) {
        drawPlayerShipPhantom();
    } else if (shipType === 2) {
        drawPlayerShipJuggernaut();
    } else {
        drawPlayerShipDefault();
    }
}

function drawPlayerShipDefault() {
    const x = player.x, y = player.y, w = player.w, h = player.h;
    const cx = x + w / 2;

    // Chama dos motores (atrás da nave, animada)
    const flameFlicker = 6 + Math.sin(Date.now() / 45) * 3;
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(cx - 10, y + h - 6);
    ctx.lineTo(cx - 5, y + h + flameFlicker);
    ctx.lineTo(cx, y + h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 10, y + h - 6);
    ctx.lineTo(cx + 5, y + h + flameFlicker);
    ctx.lineTo(cx, y + h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2aa';
    ctx.beginPath();
    ctx.moveTo(cx - 5, y + h - 6);
    ctx.lineTo(cx - 2, y + h + flameFlicker * 0.55);
    ctx.lineTo(cx + 1, y + h - 6);
    ctx.closePath();
    ctx.fill();

    // Asas laterais (camada inferior, mais escuras)
    ctx.fillStyle = '#0077bb';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.72);
    ctx.lineTo(x - 6, y + h * 0.92);
    ctx.lineTo(x + w * 0.34, y + h * 0.78);
    ctx.lineTo(x + w * 0.3, y + h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w, y + h * 0.72);
    ctx.lineTo(x + w + 6, y + h * 0.92);
    ctx.lineTo(x + w * 0.66, y + h * 0.78);
    ctx.lineTo(x + w * 0.7, y + h * 0.5);
    ctx.closePath();
    ctx.fill();

    // Fuselagem principal
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.62, y + h * 0.32);
    ctx.lineTo(x + w * 0.78, y + h * 0.58);
    ctx.lineTo(x + w * 0.62, y + h);
    ctx.lineTo(x + w * 0.38, y + h);
    ctx.lineTo(x + w * 0.22, y + h * 0.58);
    ctx.lineTo(x + w * 0.38, y + h * 0.32);
    ctx.closePath();
    ctx.fill();

    // Painel lateral (sombreamento para dar volume)
    ctx.fillStyle = '#0088cc';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.62, y + h * 0.32);
    ctx.lineTo(x + w * 0.62, y + h);
    ctx.lineTo(x + w * 0.5, y + h * 0.9);
    ctx.lineTo(x + w * 0.5, y + h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Nariz (destaque claro)
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.44, y + h * 0.22);
    ctx.lineTo(x + w * 0.56, y + h * 0.22);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#e8fbff';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.36, w * 0.1, h * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.36, w * 0.055, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bicos das asas (detalhe claro nas pontas)
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h * 0.92);
    ctx.lineTo(x + 2, y + h * 0.9);
    ctx.lineTo(x + w * 0.22, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w + 6, y + h * 0.92);
    ctx.lineTo(x + w - 2, y + h * 0.9);
    ctx.lineTo(x + w * 0.78, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
}

// Nave "Fantasma Vermelha" — desbloqueável na loja. Silhueta bem
// diferente da padrão: asas em delta voltadas para frente, dupla
// chama central e uma única canópia comprida, em tons de vermelho/preto.
function drawPlayerShipPhantom() {
    const x = player.x, y = player.y, w = player.w, h = player.h;
    const cx = x + w / 2;

    // Chamas dos motores (dupla, lado a lado, centralizadas)
    const flameFlicker = 5 + Math.sin(Date.now() / 40) * 3;
    ctx.fillStyle = '#ff5522';
    ctx.beginPath();
    ctx.moveTo(cx - 7, y + h - 4);
    ctx.lineTo(cx - 3, y + h + flameFlicker);
    ctx.lineTo(cx + 1, y + h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 1, y + h - 4);
    ctx.lineTo(cx + 5, y + h + flameFlicker);
    ctx.lineTo(cx + 9, y + h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffcc88';
    ctx.beginPath();
    ctx.moveTo(cx - 3, y + h - 4);
    ctx.lineTo(cx, y + h + flameFlicker * 0.5);
    ctx.lineTo(cx + 3, y + h - 4);
    ctx.closePath();
    ctx.fill();

    // Asas em delta, varridas para frente (silhueta bem distinta da padrão)
    ctx.fillStyle = '#3a3d42';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h * 0.28);
    ctx.lineTo(x + w * 0.4, y + h * 0.4);
    ctx.lineTo(x + w * 0.3, y + h * 0.95);
    ctx.lineTo(x - 2, y + h * 0.98);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w + 8, y + h * 0.28);
    ctx.lineTo(x + w * 0.6, y + h * 0.4);
    ctx.lineTo(x + w * 0.7, y + h * 0.95);
    ctx.lineTo(x + w + 2, y + h * 0.98);
    ctx.closePath();
    ctx.fill();

    // Barbatanas de cauda (detalhe pontudo nas pontas das asas)
    ctx.fillStyle = '#1c1d20';
    ctx.beginPath();
    ctx.moveTo(x - 2, y + h * 0.98);
    ctx.lineTo(x + 6, y + h * 0.7);
    ctx.lineTo(x + w * 0.3, y + h * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w + 2, y + h * 0.98);
    ctx.lineTo(x + w - 6, y + h * 0.7);
    ctx.lineTo(x + w * 0.7, y + h * 0.95);
    ctx.closePath();
    ctx.fill();

    // Fuselagem central, longa e estreita
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.66, y + h * 0.5);
    ctx.lineTo(x + w * 0.58, y + h * 0.96);
    ctx.lineTo(x + w * 0.42, y + h * 0.96);
    ctx.lineTo(x + w * 0.34, y + h * 0.5);
    ctx.closePath();
    ctx.fill();

    // Sombreamento lateral
    ctx.fillStyle = '#c7cdd2';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.66, y + h * 0.5);
    ctx.lineTo(x + w * 0.58, y + h * 0.96);
    ctx.lineTo(x + w * 0.5, y + h * 0.9);
    ctx.lineTo(x + w * 0.5, y + h * 0.1);
    ctx.closePath();
    ctx.fill();

    // Canópia longa, escura com reflexo azulado (dá o ar "fantasma")
    ctx.fillStyle = '#1a1c1f';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.32, w * 0.09, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.02, y + h * 0.24, w * 0.04, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faixa de destaque no nariz
    ctx.fillStyle = '#dfefff';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.46, y + h * 0.18);
    ctx.lineTo(x + w * 0.54, y + h * 0.18);
    ctx.closePath();
    ctx.fill();
}

// Nave "Blindada Cinza" — desbloqueável na loja. Mais lenta e robusta,
// silhueta grande e quadrada com placas de blindagem visíveis e um
// canhão duplo destacado na frente (reforça o tiro mais forte).
function drawPlayerShipJuggernaut() {
    const x = player.x, y = player.y, w = player.w, h = player.h;
    const cx = x + w / 2;

    // Chamas dos motores (triplas, largas — nave pesada)
    const flameFlicker = 5 + Math.sin(Date.now() / 55) * 2.5;
    ctx.fillStyle = '#ff8800';
    [x + w * 0.22, cx, x + w * 0.78].forEach(fx => {
        ctx.beginPath();
        ctx.moveTo(fx - 6, y + h - 4);
        ctx.lineTo(fx, y + h + flameFlicker);
        ctx.lineTo(fx + 6, y + h - 4);
        ctx.closePath();
        ctx.fill();
    });

    // Casco largo e quadrado (base escura)
    ctx.fillStyle = '#4a5158';
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.5);
    ctx.lineTo(x + w * 0.08, y + h);
    ctx.lineTo(x + w * 0.92, y + h);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w * 0.8, y + h * 0.18);
    ctx.lineTo(x + w * 0.2, y + h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Placas de blindagem (camada clara por cima, com "juntas" visíveis)
    ctx.fillStyle = '#9aa5b1';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.06, y + h * 0.52);
    ctx.lineTo(x + w * 0.13, y + h * 0.94);
    ctx.lineTo(x + w * 0.42, y + h * 0.94);
    ctx.lineTo(x + w * 0.4, y + h * 0.22);
    ctx.lineTo(x + w * 0.22, y + h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.94, y + h * 0.52);
    ctx.lineTo(x + w * 0.87, y + h * 0.94);
    ctx.lineTo(x + w * 0.58, y + h * 0.94);
    ctx.lineTo(x + w * 0.6, y + h * 0.22);
    ctx.lineTo(x + w * 0.78, y + h * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5b636b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.13, y + h * 0.5);
    ctx.lineTo(x + w * 0.87, y + h * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.13, y + h * 0.72);
    ctx.lineTo(x + w * 0.87, y + h * 0.72);
    ctx.stroke();

    // Nariz reforçado, mais achatado que as outras naves
    ctx.fillStyle = '#c3cbd2';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.18);
    ctx.lineTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.65, y);
    ctx.lineTo(x + w * 0.8, y + h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Canhão duplo em destaque (reforça visualmente o tiro mais forte)
    ctx.fillStyle = '#2c3136';
    ctx.fillRect(cx - w * 0.16, y - 6, w * 0.08, 16);
    ctx.fillRect(cx + w * 0.08, y - 6, w * 0.08, 16);
    ctx.fillStyle = '#ffaa33';
    ctx.fillRect(cx - w * 0.16, y - 7, w * 0.08, 4);
    ctx.fillRect(cx + w * 0.08, y - 7, w * 0.08, 4);

    // Cockpit central, pequeno e protegido
    ctx.fillStyle = '#e8fbff';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.34, w * 0.09, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.34, w * 0.05, h * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
}
