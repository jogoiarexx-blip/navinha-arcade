// ================= MENUS E HUD =================
// Tela de início (com seletor de dificuldade e ranking), loja de
// upgrades permanentes, seleção de fase, tela de conclusão da
// história, overlays de transição de fase / pausa / game over, e o
// HUD (placar, combo, vidas, arma, escudo) durante a partida.

function drawMenuPanel(x, y, w, h, borderColor) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = borderColor || '#164';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
}

function drawMenuShipIcon(cx, cy, scale) {
    // Navinha decorativa e animada no topo do menu (não é o player de
    // verdade — é só um ícone, então funciona mesmo antes da 1ª partida).
    const bob = Math.sin(Date.now() / 500) * 4;
    const y = cy + bob;
    const w = 34 * scale, h = 42 * scale;
    const x = cx - w / 2;

    ctx.fillStyle = '#ffaa00';
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 120) * 0.25;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * scale, y + h - 4);
    ctx.lineTo(cx, y + h + 10 * scale);
    ctx.lineTo(cx + 5 * scale, y + h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w * 0.85, y + h * 0.6);
    ctx.lineTo(x + w * 0.62, y + h);
    ctx.lineTo(x + w * 0.38, y + h);
    ctx.lineTo(x + w * 0.15, y + h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.4, w * 0.12, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawStartScreen() {
    const diff = currentDifficulty();

    // ---- Ícone + título ----
    drawMenuShipIcon(W / 2, 20, 1);

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('NAVINHA ARCADE', W / 2, 108);

    ctx.font = '14px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('Modo História — 10 Fases', W / 2, 130);

    // ---- Painel: seletor de dificuldade ----
    const diffPanel = { x: 30, y: 148, w: W - 60, h: 96 };
    drawMenuPanel(diffPanel.x, diffPanel.y, diffPanel.w, diffPanel.h, diff.color);

    const diffY = diffPanel.y + 10, diffH = 38;
    const diffLeftRect = { x: W / 2 - 148, y: diffY, w: 44, h: diffH };
    const diffRightRect = { x: W / 2 + 104, y: diffY, w: 44, h: diffH };
    uiButtons.diffLeft = diffLeftRect;
    uiButtons.diffRight = diffRightRect;

    [diffLeftRect, diffRightRect].forEach(r => {
        ctx.fillStyle = 'rgba(0,255,0,0.12)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = '#0a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
    ctx.font = 'bold 22px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.fillText('◄', diffLeftRect.x + diffLeftRect.w / 2, diffY + 26);
    ctx.fillText('►', diffRightRect.x + diffRightRect.w / 2, diffY + 26);

    ctx.font = 'bold 20px Courier New';
    ctx.fillStyle = diff.color;
    ctx.fillText(diff.label, W / 2, diffY + 26);

    // Melhores estrelas conquistadas nessa dificuldade
    const bestStars = starsByDifficulty[DIFFICULTIES[difficultyIndex]] || 0;
    ctx.font = '17px Courier New';
    ctx.fillStyle = '#ff0';
    ctx.fillText(starString(bestStars), W / 2, diffY + diffH + 22);

    if (lockMessageTimer > 0) {
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#f55';
        ctx.fillText(lockMessage, W / 2, diffY + diffH + 40);
    } else {
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#0a0';
        ctx.fillText('← → / A D ou toque nas setas', W / 2, diffY + diffH + 40);
    }

    // ---- Botões LOJA e SELECIONAR FASE ----
    const btnY = diffPanel.y + diffPanel.h + 14;
    const btnH = 50;
    const shopRect = { x: 30, y: btnY, w: (W - 76) / 2, h: btnH };
    uiButtons.shop = shopRect;
    ctx.fillStyle = 'rgba(0,255,255,0.12)';
    ctx.fillRect(shopRect.x, shopRect.y, shopRect.w, shopRect.h);
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(shopRect.x, shopRect.y, shopRect.w, shopRect.h);
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('🛒 LOJA', shopRect.x + shopRect.w / 2, shopRect.y + 24);
    ctx.font = '11px Courier New';
    ctx.fillText('(M)', shopRect.x + shopRect.w / 2, shopRect.y + 40);

    const levelSelectUnlocked = unlockedLevel > 1;
    const levelRect = { x: shopRect.x + shopRect.w + 16, y: btnY, w: shopRect.w, h: btnH };
    if (levelSelectUnlocked) {
        uiButtons.levelSelect = levelRect;
        ctx.fillStyle = 'rgba(0,255,0,0.12)';
        ctx.fillRect(levelRect.x, levelRect.y, levelRect.w, levelRect.h);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(levelRect.x, levelRect.y, levelRect.w, levelRect.h);
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('🚩 FASES', levelRect.x + levelRect.w / 2, levelRect.y + 24);
        ctx.font = '11px Courier New';
        ctx.fillText('(F)', levelRect.x + levelRect.w / 2, levelRect.y + 40);
    } else {
        uiButtons.levelSelect = null;
        ctx.fillStyle = 'rgba(150,150,150,0.14)';
        ctx.fillRect(levelRect.x, levelRect.y, levelRect.w, levelRect.h);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.strokeRect(levelRect.x, levelRect.y, levelRect.w, levelRect.h);
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 15px Courier New';
        ctx.fillText('🔒 FASES', levelRect.x + levelRect.w / 2, levelRect.y + 24);
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#999';
        ctx.fillText('vença a Fase 1', levelRect.x + levelRect.w / 2, levelRect.y + 40);
    }

    // ---- Botão JOGAR (destaque principal) ----
    const playY = btnY + btnH + 14;
    const playRect = { x: 30, y: playY, w: W - 60, h: 54 };
    uiButtons.playButton = playRect;
    const pulse = 0.15 + Math.sin(Date.now() / 260) * 0.06;
    ctx.fillStyle = `rgba(0,255,0,${pulse})`;
    ctx.fillRect(playRect.x, playRect.y, playRect.w, playRect.h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 3;
    ctx.strokeRect(playRect.x, playRect.y, playRect.w, playRect.h);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('▶ JOGAR', W / 2, playRect.y + 34);

    // ---- Painel: progresso e recorde ----
    const statsY = playY + 54 + 16;
    const statsH = 78;
    drawMenuPanel(30, statsY, W - 60, statsH, '#0a0');

    ctx.fillStyle = '#ff0';
    ctx.font = '14px Courier New';
    ctx.fillText('Créditos: ' + credits, W / 2, statsY + 22);

    // Barra de progresso das fases desbloqueadas
    const progW = W - 100;
    const progX = 50;
    const progY = statsY + 32;
    const progress = unlockedLevel / MAX_LEVEL;
    ctx.fillStyle = '#222';
    ctx.fillRect(progX, progY, progW, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(progX, progY, progW * progress, 10);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(progX, progY, progW, 10);
    ctx.fillStyle = '#0f0';
    ctx.font = '11px Courier New';
    ctx.fillText('Fase desbloqueada: ' + unlockedLevel + '/' + MAX_LEVEL, W / 2, progY + 24);

    ctx.fillStyle = '#0ff';
    ctx.font = '14px Courier New';
    ctx.fillText('Recorde: ' + highScore, W / 2, statsY + statsH - 8);

    // ---- Painel: nave selecionada (alterna entre as naves liberadas) ----
    const shipPanelY = statsY + statsH + 14;
    const shipPanelH = 58;
    const ship = SHIP_DEFS[selectedShip];
    drawMenuPanel(30, shipPanelY, W - 60, shipPanelH, ship.color);

    const shipHasMore = shipsUnlocked.filter(u => u).length > 1;
    const shipLeftRect = { x: 40, y: shipPanelY + 10, w: 36, h: shipPanelH - 20 };
    const shipRightRect = { x: W - 76, y: shipPanelY + 10, w: 36, h: shipPanelH - 20 };
    if (shipHasMore) {
        uiButtons.shipLeft = shipLeftRect;
        uiButtons.shipRight = shipRightRect;
        [shipLeftRect, shipRightRect].forEach(r => {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(r.x, r.y, r.w, r.h);
        });
        ctx.font = 'bold 18px Courier New';
        ctx.fillStyle = ship.color;
        ctx.fillText('◄', shipLeftRect.x + shipLeftRect.w / 2, shipPanelY + shipPanelH / 2 + 6);
        ctx.fillText('►', shipRightRect.x + shipRightRect.w / 2, shipPanelY + shipPanelH / 2 + 6);
    } else {
        uiButtons.shipLeft = null;
        uiButtons.shipRight = null;
    }

    ctx.font = 'bold 15px Courier New';
    ctx.fillStyle = ship.color;
    ctx.fillText('NAVE: ' + ship.name, W / 2, shipPanelY + 24);
    ctx.font = '11px Courier New';
    ctx.fillStyle = '#0a0';
    if (shipHasMore) {
        ctx.fillText(ship.desc + ' (V ou toque nas setas)', W / 2, shipPanelY + 42);
    } else {
        ctx.fillText('Libere mais naves na LOJA', W / 2, shipPanelY + 42);
    }

    // ---- Painel: ranking local (top 5) ----
    const rankY = shipPanelY + shipPanelH + 14;
    const rankH = 20 + Math.max(1, rankings.length) * 19 + 12;
    drawMenuPanel(30, rankY, W - 60, rankH, '#164');

    ctx.font = '13px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('— Melhores pontuações —', W / 2, rankY + 20);
    if (rankings.length === 0) {
        ctx.fillText('(nenhuma partida registrada ainda)', W / 2, rankY + 40);
    } else {
        rankings.forEach((r, i) => {
            const diffLabel = (DIFFICULTY_CONFIG[r.difficulty] || DIFFICULTY_CONFIG.NORMAL).label;
            ctx.fillStyle = '#0a0';
            ctx.font = '12px Courier New';
            ctx.fillText(
                (i + 1) + '. ' + r.score + ' pts — Fase ' + r.level + ' (' + diffLabel + ')',
                W / 2, rankY + 40 + i * 19
            );
        });
    }

    // ---- Dicas de teclado (rodapé) ----
    ctx.fillStyle = '#0a0';
    ctx.font = '11px Courier New';
    ctx.fillText('← → ↑ ↓ / WASD: mover      P: pausar', W / 2, H - 18);

    // Área "começar": qualquer toque fora dos botões acima também começa o jogo
    uiButtons.startPlay = { x: 0, y: 0, w: W, h: H };
}

function drawShopScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('LOJA DE UPGRADES', W / 2, 80);

    ctx.fillStyle = '#ff0';
    ctx.font = '18px Courier New';
    ctx.fillText('Créditos disponíveis: ' + credits, W / 2, 118);

    ctx.font = '13px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('Upgrades permanentes — toque numa linha para comprar', W / 2, 142);

    let y = 190;
    uiButtons.shopRows = [];
    PERMANENT_UPGRADE_DEFS.forEach(def => {
        const level = permanentUpgrades[def.key] || 0;
        const maxed = level >= def.max;
        const cost = upgradeCost(def);
        const affordable = credits >= cost;

        const rowRect = { x: 30, y: y - 34, w: W - 60, h: 62 };
        uiButtons.shopRows.push(rowRect);

        ctx.fillStyle = maxed ? 'rgba(0,255,255,0.08)' : (affordable ? 'rgba(255,255,0,0.08)' : 'rgba(255,255,255,0.04)');
        ctx.fillRect(rowRect.x, rowRect.y, rowRect.w, rowRect.h);
        ctx.strokeStyle = maxed ? '#0ff' : (affordable ? '#ff0' : '#444');
        ctx.lineWidth = 1;
        ctx.strokeRect(rowRect.x, rowRect.y, rowRect.w, rowRect.h);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 17px Courier New';
        ctx.fillText('[' + def.hotkey + '] ' + def.label, 40, y);

        ctx.font = '14px Courier New';
        ctx.fillStyle = maxed ? '#0ff' : (affordable ? '#ff0' : '#888');
        ctx.fillText(maxed ? 'NÍVEL MÁXIMO' : ('Custo: ' + cost + ' créditos (toque para comprar)'), 40, y + 22);

        // Barra de nível
        const barW = 120;
        const barX = W - 40 - barW;
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, y - 16, barW, 12);
        ctx.fillStyle = '#0ff';
        ctx.fillRect(barX, y - 16, barW * (level / def.max), 12);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, y - 16, barW, 12);
        ctx.fillStyle = '#0ff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(level + '/' + def.max, barX + barW / 2, y - 22);

        y += 78;
    });

    // ---- Naves alternativas (desbloqueio único, não é "nível") ----
    uiButtons.shipUnlockRows = [];
    LOCKABLE_SHIP_INDICES.forEach((shipIdx, pos) => {
        const shipDef = SHIP_DEFS[shipIdx];
        const shipOwned = shipsUnlocked[shipIdx];
        const shipAffordable = credits >= shipDef.unlockCost;
        const hotkey = String(4 + pos);

        const shipRowRect = { x: 30, y: y - 34, w: W - 60, h: 62 };
        uiButtons.shipUnlockRows.push(shipOwned ? null : shipRowRect);

        ctx.fillStyle = shipOwned ? 'rgba(255,255,255,0.06)' : (shipAffordable ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)');
        ctx.fillRect(shipRowRect.x, shipRowRect.y, shipRowRect.w, shipRowRect.h);
        ctx.strokeStyle = shipOwned ? shipDef.color : (shipAffordable ? shipDef.color : '#444');
        ctx.lineWidth = 1;
        ctx.strokeRect(shipRowRect.x, shipRowRect.y, shipRowRect.w, shipRowRect.h);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 17px Courier New';
        ctx.fillText('[' + hotkey + '] Nave: ' + shipDef.name, 40, y);

        ctx.font = '14px Courier New';
        ctx.fillStyle = shipOwned ? shipDef.color : (shipAffordable ? '#ff0' : '#888');
        ctx.fillText(
            shipOwned ? 'LIBERADA — escolha na tela inicial' : ('Custo: ' + shipDef.unlockCost + ' créditos (toque para liberar)'),
            40, y + 22
        );

        ctx.textAlign = 'right';
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#0a0';
        ctx.fillText(shipDef.desc, W - 40, y - 16);
        ctx.textAlign = 'center';

        y += 78;
    });

    // ---- Botão voltar (tocável) ----
    const backRect = { x: W / 2 - 90, y: H - 66, w: 180, h: 44 };
    uiButtons.shopBack = backRect;
    ctx.fillStyle = 'rgba(0,255,0,0.12)';
    ctx.fillRect(backRect.x, backRect.y, backRect.w, backRect.h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(backRect.x, backRect.y, backRect.w, backRect.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('◄ VOLTAR', W / 2, backRect.y + 28);
    ctx.font = '11px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('(ESC / ESPAÇO)', W / 2, H - 8);
}

// Desenha uma estrela de 5 pontas (preenchida ou só contorno)
function drawStarShape(cx, cy, r, filled, fillColor, strokeColor) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        const a2 = a + Math.PI / 5;
        const r2 = r * 0.42;
        ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
    }
    ctx.closePath();
    if (filled) {
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    } else {
        ctx.strokeStyle = strokeColor || fillColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
}

// Fila de 3 estrelas centradas em (cx, cy)
function drawStarRow(cx, cy, earned, r) {
    r = r || 6;
    const gap = r * 2.35;
    const startX = cx - gap;
    for (let i = 0; i < 3; i++) {
        const sx = startX + i * gap;
        if (i < earned) {
            // Brilho suave nas conquistadas
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 6;
            drawStarShape(sx, cy, r, true, '#ffd700', '#fff3a0');
            ctx.shadowBlur = 0;
        } else {
            drawStarShape(sx, cy, r, false, null, 'rgba(255,255,255,0.28)');
        }
    }
}

function drawLevelSelectScreen() {
    // Fundo escuro com vinheta leve
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);

    const diff = currentDifficulty();
    const diffKey = DIFFICULTIES[difficultyIndex];

    // ---- Cabeçalho ----
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 26px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('SELECIONAR FASE', W / 2, 36);

    ctx.font = '12px Courier New';
    ctx.fillStyle = diff.color;
    ctx.fillText(diff.label, W / 2, 54);

    // Banner de resultado da última fase / legenda de objetivos
    const bannerY = 64;
    const bannerH = 52;
    drawMenuPanel(24, bannerY, W - 48, bannerH, phaseClearTimer > 0 ? '#0f0' : '#164');

    if (phaseClearTimer > 0 && phaseClearMessage) {
        const lines = String(phaseClearMessage).split('\n');
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 13px Courier New';
        ctx.fillText(lines[0], W / 2, bannerY + 22);
        if (lines[1]) {
            ctx.font = '11px Courier New';
            ctx.fillStyle = '#ff0';
            ctx.fillText(lines[1], W / 2, bannerY + 40);
        }
        // Estrelas grandes da última fase, se houver
        if (lastPhaseStarsEarned) {
            drawStarRow(W / 2, bannerY + bannerH + 14, lastPhaseStarsEarned.stars, 8);
        }
    } else {
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#0a0';
        ctx.fillText('Objetivos de cada fase', W / 2, bannerY + 16);
        ctx.fillStyle = '#ff0';
        ctx.font = '11px Courier New';
        ctx.fillText('★ Completar   ★ Resgatar todos   ★ Perfect', W / 2, bannerY + 34);
        ctx.fillStyle = '#088';
        ctx.font = '10px Courier New';
        ctx.fillText('Toque numa fase · teclas 1-9 e 0', W / 2, bannerY + 48);
    }

    // ---- Grade de fases (2 linhas × 5) ----
    const cols = 5;
    const cellW = 84;
    const cellH = 100;
    const gapX = 6;
    const gapY = 10;
    const gridW = cols * cellW + (cols - 1) * gapX;
    const startX = (W - gridW) / 2;
    const startY = phaseClearTimer > 0 && lastPhaseStarsEarned ? 148 : 128;

    uiButtons.levelCells = [];
    for (let i = 1; i <= MAX_LEVEL; i++) {
        const col = (i - 1) % cols;
        const row = Math.floor((i - 1) / cols);
        const x = startX + col * (cellW + gapX);
        const y = startY + row * (cellH + gapY);
        const unlocked = i <= unlockedLevel;
        const best = unlocked ? getPhaseStars(diffKey, i) : 0;
        const phase = getPhase(i);
        const accent = (phase.boss && phase.boss.coreColor) || (unlocked ? '#0f0' : '#555');

        const cellRect = { x: x, y: y, w: cellW, h: cellH };
        uiButtons.levelCells.push(unlocked ? cellRect : null);

        // Cartão
        if (unlocked) {
            // Fundo com leve gradiente vertical simulado
            ctx.fillStyle = best >= 3 ? 'rgba(40, 55, 10, 0.95)' : 'rgba(8, 28, 18, 0.95)';
            ctx.fillRect(cellRect.x, cellRect.y, cellRect.w, cellRect.h);

            // Borda colorida pela marca
            if (best >= 3) {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;
            } else if (best >= 1) {
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = '#0a6';
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 0;
            }
            ctx.strokeRect(cellRect.x + 0.5, cellRect.y + 0.5, cellRect.w - 1, cellRect.h - 1);
            ctx.shadowBlur = 0;

            // Faixa superior com cor do chefe/tema
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.35;
            ctx.fillRect(cellRect.x + 2, cellRect.y + 2, cellRect.w - 4, 6);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = 'rgba(18, 18, 18, 0.9)';
            ctx.fillRect(cellRect.x, cellRect.y, cellRect.w, cellRect.h);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cellRect.x + 0.5, cellRect.y + 0.5, cellRect.w - 1, cellRect.h - 1);
        }

        // Número da fase
        ctx.font = 'bold 26px Courier New';
        ctx.fillStyle = unlocked ? (best >= 3 ? '#ffd700' : '#0f0') : '#444';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), x + cellW / 2, y + 36);

        // Nome curto da fase (truncado)
        if (unlocked) {
            const name = (phase.name || ('Fase ' + i));
            const short = name.length > 11 ? name.slice(0, 10) + '…' : name;
            ctx.font = '9px Courier New';
            ctx.fillStyle = '#8c8';
            ctx.fillText(short, x + cellW / 2, y + 52);
        } else {
            ctx.font = '16px Courier New';
            ctx.fillStyle = '#555';
            ctx.fillText('🔒', x + cellW / 2, y + 52);
        }

        // Estrelas gráficas — destaque principal do cartão
        const starY = y + cellH - 22;
        if (unlocked) {
            drawStarRow(x + cellW / 2, starY, best, 7);
            // Contagem numérica discreta
            ctx.font = '10px Courier New';
            ctx.fillStyle = best >= 3 ? '#ffd700' : (best > 0 ? '#0f0' : '#456');
            ctx.fillText(best + '/3', x + cellW / 2, y + cellH - 6);
        } else {
            drawStarRow(x + cellW / 2, starY, 0, 6);
            ctx.font = '10px Courier New';
            ctx.fillStyle = '#333';
            ctx.fillText('—/3', x + cellW / 2, y + cellH - 6);
        }
    }

    // ---- Rodapé: progresso total ----
    const footerY = startY + 2 * (cellH + gapY) + 8;
    let totalPhaseStars = 0;
    let cleared = 0;
    for (let i = 1; i <= 10; i++) {
        const s = getPhaseStars(diffKey, i);
        totalPhaseStars += s;
        if (s > 0) cleared++;
    }

    // Barra de progresso das estrelas
    const barW = W - 80;
    const barX = 40;
    const barY = footerY;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barW, 12);
    const frac = totalPhaseStars / 30;
    if (frac > 0) {
        const g = ctx.createLinearGradient(barX, 0, barX + barW * frac, 0);
        g.addColorStop(0, '#0a6');
        g.addColorStop(1, totalPhaseStars >= 30 ? '#ffd700' : '#0f0');
        ctx.fillStyle = g;
        ctx.fillRect(barX, barY, barW * frac, 12);
    }
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, 12);

    ctx.font = 'bold 13px Courier New';
    ctx.fillStyle = '#ff0';
    ctx.fillText(totalPhaseStars + ' / 30 ★  ·  ' + cleared + '/10 fases', W / 2, barY + 28);

    ctx.font = '10px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('Todas as fases com 3★ → 5★ na dificuldade → libera a próxima', W / 2, barY + 44);

    // ---- Botão voltar ----
    const backRect = { x: W / 2 - 90, y: H - 58, w: 180, h: 40 };
    uiButtons.levelBack = backRect;
    ctx.fillStyle = 'rgba(0,255,0,0.12)';
    ctx.fillRect(backRect.x, backRect.y, backRect.w, backRect.h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(backRect.x, backRect.y, backRect.w, backRect.h);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 15px Courier New';
    ctx.fillText('◄ VOLTAR', W / 2, backRect.y + 26);
    ctx.font = '10px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('(ESC)', W / 2, H - 8);
}

function drawStoryCompleteScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 34px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('HISTÓRIA CONCLUÍDA!', W / 2, H / 2 - 130);

    const diff = currentDifficulty();
    ctx.fillStyle = diff.color;
    ctx.font = '18px Courier New';
    ctx.fillText('Dificuldade: ' + diff.label, W / 2, H / 2 - 98);

    if (lastRunStars !== null) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 26px Courier New';
        ctx.fillText(starString(lastRunStars), W / 2, H / 2 - 68);
    }

    // Resumo das estrelas por fase nesta dificuldade
    const diffKey = DIFFICULTIES[difficultyIndex];
    let totalPS = 0;
    let line = '';
    for (let i = 1; i <= 10; i++) {
        const s = getPhaseStars(diffKey, i);
        totalPS += s;
        line += (i > 1 ? ' ' : '') + s;
    }
    ctx.font = '12px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('Fases ★: ' + line + '  (' + totalPS + '/30)', W / 2, H / 2 - 40);

    if (lastPhaseStarsEarned) {
        ctx.fillStyle = '#ff0';
        ctx.font = '14px Courier New';
        ctx.fillText('Última fase: ' + starString3(lastPhaseStarsEarned.stars), W / 2, H / 2 - 18);
    }

    ctx.fillStyle = '#0ff';
    ctx.font = '18px Courier New';
    ctx.fillText('Pontuação Final: ' + score, W / 2, H / 2 + 10);
    ctx.fillText('Recorde: ' + highScore, W / 2, H / 2 + 36);

    ctx.fillStyle = '#ff0';
    ctx.font = '16px Courier New';
    ctx.fillText('Créditos ganhos: +' + (lastCreditsEarned || 0), W / 2, H / 2 + 62);

    if (lastUnlockedDifficulty) {
        const unlockedLabel = DIFFICULTY_CONFIG[lastUnlockedDifficulty].label;
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('★ NOVA DIFICULDADE DESBLOQUEADA: ' + unlockedLabel + ' ★', W / 2, H / 2 + 88);
    }

    ctx.fillStyle = '#0f0';
    ctx.font = '18px Courier New';
    ctx.fillText('Pressione ESPAÇO ou TOQUE para voltar ao menu', W / 2, H / 2 + 130);
}


function drawMuteButton() {
    const r = { x: W - 44, y: 8, w: 36, h: 28 };
    // Evita sobrepor o HUD de vidas durante o jogo — sobe no menu
    if (gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_TRANSITION') {
        r.y = H - 36;
        r.x = W - 44;
    }
    uiButtons.muteBtn = r;
    ctx.fillStyle = soundMuted ? 'rgba(255,80,80,0.25)' : 'rgba(0,255,0,0.12)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = soundMuted ? '#f66' : '#0a0';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillStyle = soundMuted ? '#f88' : '#0f0';
    ctx.fillText(soundMuted ? '🔇' : '🔊', r.x + r.w / 2, r.y + 20);
}

function drawTutorialOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('COMO JOGAR', W / 2, 70);

    const lines = [
        ['MOVER', 'Setas / WASD  ·  Arraste o dedo'],
        ['ATIRAR', 'Espaço  ·  Segure o toque'],
        ['RESGATAR', 'Fique PARADO em cima do sobrevivente'],
        ['ESTRELAS', '★ Completar  ★ Resgatar todos  ★ Perfect'],
        ['PERFECT', 'Não leve nenhum hit (nem no escudo)'],
        ['PAUSAR', 'P ou ESC  ·  Toque fora (quando pausado)'],
        ['MUTE', 'Tecla N  ·  Botão 🔊'],
    ];

    let y = 120;
    lines.forEach(([title, desc]) => {
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 14px Courier New';
        ctx.fillText(title, W / 2, y);
        ctx.fillStyle = '#8c8';
        ctx.font = '12px Courier New';
        ctx.fillText(desc, W / 2, y + 18);
        y += 48;
    });

    const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.3;
    ctx.fillStyle = `rgba(0,255,0,${pulse})`;
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('Toque ou ESPAÇO para começar', W / 2, H - 50);
}

function drawPhaseResultOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    const beaten = currentLevel;
    const result = lastPhaseStarsEarned || { stars: 1, details: [] };

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FASE ' + beaten + ' CONCLUÍDA', W / 2, 90);

    const phase = getPhase(beaten);
    ctx.fillStyle = '#0ff';
    ctx.font = '16px Courier New';
    ctx.fillText(phase.name || '', W / 2, 118);

    // Estrelas grandes
    drawStarRow(W / 2, 160, result.stars, 14);
    ctx.font = 'bold 18px Courier New';
    ctx.fillStyle = result.stars >= 3 ? '#ffd700' : '#ff0';
    ctx.fillText(result.stars + ' / 3 ESTRELAS', W / 2, 195);

    // Objetivos
    let y = 230;
    (result.details || []).forEach(d => {
        ctx.font = '14px Courier New';
        ctx.fillStyle = d.ok ? '#0f0' : '#f66';
        ctx.fillText((d.ok ? '✓  ' : '✗  ') + d.label, W / 2, y);
        y += 24;
    });

    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('+' + lastCreditsEarned + ' créditos', W / 2, y + 16);
    ctx.fillStyle = '#0a0';
    ctx.font = '13px Courier New';
    ctx.fillText('Total: ' + credits + '  ·  Score: ' + score, W / 2, y + 38);

    // Botões
    const btnY = H - 200;
    const btnH = 44;
    const cont = { x: 40, y: btnY, w: W - 80, h: btnH };
    const sel = { x: 40, y: btnY + 56, w: (W - 96) / 2, h: btnH };
    const menu = { x: sel.x + sel.w + 16, y: btnY + 56, w: sel.w, h: btnH };
    uiButtons.phaseContinue = cont;
    uiButtons.phaseSelect = sel;
    uiButtons.phaseMenu = menu;

    ctx.fillStyle = 'rgba(0,255,0,0.18)';
    ctx.fillRect(cont.x, cont.y, cont.w, cont.h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(cont.x, cont.y, cont.w, cont.h);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('▶ CONTINUAR  (Fase ' + (beaten + 1) + ')', W / 2, cont.y + 28);

    ctx.fillStyle = 'rgba(0,255,255,0.12)';
    ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
    ctx.strokeStyle = '#0ff';
    ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText('🚩 FASES', sel.x + sel.w / 2, sel.y + 28);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(menu.x, menu.y, menu.w, menu.h);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(menu.x, menu.y, menu.w, menu.h);
    ctx.fillStyle = '#ccc';
    ctx.fillText('MENU', menu.x + menu.w / 2, menu.y + 28);
}

function drawLevelTransitionOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 38px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('FASE ' + currentLevel + ' / ' + MAX_LEVEL, W / 2, H / 2 - 30);
    ctx.font = 'bold 20px Courier New';
    ctx.fillStyle = '#0ff';
    ctx.fillText(getPhase(currentLevel).name, W / 2, H / 2 + 6);
    ctx.font = '18px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.fillText('Prepare-se!', W / 2, H / 2 + 40);
}

function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 90);
    ctx.fillStyle = '#0f0';
    ctx.font = '20px Courier New';
    ctx.fillText('Pontuação: ' + score, W / 2, H / 2 - 40);
    ctx.fillText('Recorde: ' + highScore, W / 2, H / 2 - 14);
    ctx.fillStyle = '#ff0';
    ctx.font = '16px Courier New';
    ctx.fillText('Créditos ganhos: +' + (lastCreditsEarned || 0), W / 2, H / 2 + 16);
    ctx.fillStyle = '#0a0';
    ctx.font = '13px Courier New';
    ctx.fillText('Total de créditos: ' + credits, W / 2, H / 2 + 38);

    const retry = { x: 40, y: H / 2 + 70, w: W - 80, h: 46 };
    const menu = { x: 40, y: H / 2 + 128, w: W - 80, h: 42 };
    uiButtons.retryBtn = retry;
    uiButtons.menuBtn = menu;

    ctx.fillStyle = 'rgba(0,255,0,0.16)';
    ctx.fillRect(retry.x, retry.y, retry.w, retry.h);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(retry.x, retry.y, retry.w, retry.h);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('↻ REPETIR FASE  (R)', W / 2, retry.y + 30);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(menu.x, menu.y, menu.w, menu.h);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(menu.x, menu.y, menu.w, menu.h);
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 15px Courier New';
    ctx.fillText('MENU  (ESPAÇO)', W / 2, menu.y + 28);
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', W / 2, H / 2 - 10);
    ctx.font = '16px Courier New';
    ctx.fillStyle = '#0f0';
    ctx.fillText('Pressione P ou toque para continuar', W / 2, H / 2 + 26);
}

function drawHearts(x, y, count, maxCount, align) {
    // Desenha corações preenchidos para a vida atual e contornados para
    // a vida máxima restante, crescendo para a direita (align:'left')
    // ou para a esquerda (align:'right').
    const size = 14;
    const gap = 4;
    for (let i = 0; i < maxCount; i++) {
        const offset = i * (size + gap);
        const hx = align === 'right' ? x - offset : x + offset;
        const filled = i < count;
        ctx.fillStyle = filled ? '#ff3355' : 'rgba(255,255,255,0.15)';
        ctx.strokeStyle = filled ? '#ff8899' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const cx = hx - (align === 'right' ? size / 2 : -size / 2);
        const cy = y;
        ctx.moveTo(cx, cy + size * 0.28);
        ctx.bezierCurveTo(cx, cy, cx - size * 0.5, cy, cx - size * 0.5, cy + size * 0.28);
        ctx.bezierCurveTo(cx - size * 0.5, cy + size * 0.55, cx, cy + size * 0.75, cx, cy + size * 0.95);
        ctx.bezierCurveTo(cx, cy + size * 0.75, cx + size * 0.5, cy + size * 0.55, cx + size * 0.5, cy + size * 0.28);
        ctx.bezierCurveTo(cx + size * 0.5, cy, cx, cy, cx, cy + size * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawHUD() {
    const HUD_H = 64;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.strokeStyle = 'rgba(0,255,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_H);
    ctx.lineTo(W, HUD_H);
    ctx.stroke();

    // ---- Esquerda: pontuação e fase ----
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + score, 10, 18);

    ctx.font = '12px Courier New';
    ctx.fillStyle = '#0a0';
    ctx.fillText('FASE ' + currentLevel + '/' + MAX_LEVEL, 10, 36);
    ctx.font = '11px Courier New';
    ctx.fillStyle = '#088';
    ctx.fillText(getPhase(currentLevel).name, 10, 51);

    // Objetivos da fase: resgates e indicador de Perfect
    ctx.font = '10px Courier New';
    const rescueDone = phaseSurvivorsRescued;
    const rescueNeed = phaseTargetSurvivors;
    const rescueColor = (rescueDone >= rescueNeed && phaseSurvivorsMissed === 0) ? '#0ff' : '#088';
    ctx.fillStyle = rescueColor;
    ctx.fillText('RESGATE ' + rescueDone + '/' + rescueNeed, 10, 62);
    if (!phaseTookDamage && gameState === 'PLAYING') {
        ctx.fillStyle = '#ff0';
        ctx.fillText('PERFECT', 110, 62);
    }

    // ---- Direita: vidas (corações), arma (pips) e escudo ----
    const maxHearts = Math.max(player.maxHealth || 3, player.health);
    drawHearts(W - 10, 6, player.health, Math.min(maxHearts, 6), 'right');

    ctx.font = '11px Courier New';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0a0';
    ctx.fillText('ARMA', W - 10, 36);
    for (let i = 0; i < 3; i++) {
        const px = W - 14 - i * 12;
        ctx.beginPath();
        ctx.arc(px, 41, 4, 0, Math.PI * 2);
        ctx.fillStyle = i < player.weaponLevel ? '#0ff' : 'rgba(255,255,255,0.15)';
        ctx.fill();
        ctx.strokeStyle = i < player.weaponLevel ? '#aff' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    if (player.shield > 0) {
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText('🛡×' + player.shield, W - 10, 58);
    }

    // ---- Centro: dificuldade + combo/progresso/aviso de chefe ----
    const diff = currentDifficulty();
    ctx.fillStyle = diff.color;
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(diff.label, W / 2, 12);

    if (bossActive) {
        ctx.fillStyle = '#f33';
        ctx.font = 'bold 15px Courier New';
        const flash = Math.sin(Date.now() / 150) > 0;
        if (flash) ctx.fillText('⚠ CHEFE ⚠', W / 2, 32);
    } else if (comboCount >= 3) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 15px Courier New';
        ctx.fillText('COMBO x' + comboMultiplier().toFixed(1) + ' (' + comboCount + ')', W / 2, 32);
    } else if (gameState === 'PLAYING') {
        const progress = Math.min(1, enemiesKilledThisLevel / enemiesToKill);
        const barW = 150;
        const barX = (W - barW) / 2;
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, 24, barW, 8);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(barX, 24, barW * progress, 8);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, 24, barW, 8);
    }

    // ---- Aviso de vida baixa: borda vermelha pulsante ao redor da tela ----
    if (gameState === 'PLAYING' && player.health === 1) {
        const pulse = 0.25 + Math.sin(Date.now() / 180) * 0.2;
        ctx.strokeStyle = `rgba(255,0,0,${pulse})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, W - 10, H - 10);
    }
}
