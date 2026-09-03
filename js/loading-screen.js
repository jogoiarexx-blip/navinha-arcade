const LOADING_TIPS = [
    'Mova a nave continuamente para escapar de tiros mirados.',
    'Resgate todos os sobreviventes para conquistar uma estrela extra.',
    'Complete a fase sem sofrer dano para obter Perfect.',
    'Use P ou Esc para pausar durante a missão.',
    'Alguns chefes mudam o padrão de ataque entre as fases.'
];

const LoadingScreen = {
    level: 1,
    progress: 0,
    detail: '',
    error: null,
    retryAction: null,
    tip: LOADING_TIPS[0],
    animation: 0,

    begin(level, retryAction) {
        this.level = level;
        this.progress = 0;
        this.detail = 'Preparando recursos';
        this.error = null;
        this.retryAction = retryAction;
        this.tip = LOADING_TIPS[(level - 1) % LOADING_TIPS.length];
        this.animation = 0;
        uiButtons.loadingRetry = null;
    },

    setProgress(value, detail) {
        this.progress = Math.max(0, Math.min(100, Math.round(value)));
        this.detail = detail || '';
    },

    fail(error) {
        this.error = error || new Error('Erro desconhecido');
    },

    retry() {
        if (this.error && typeof this.retryAction === 'function') this.retryAction();
    }
};

function drawLoadingScreen() {
    LoadingScreen.animation++;
    const meta = getPhaseMeta(LoadingScreen.level);
    const compact = W < 600;
    const barW = Math.min(W - 64, compact ? 360 : 520);
    const barH = compact ? 18 : 22;
    const barX = (W - barW) / 2;
    const barY = H * 0.54;

    // O fundo preto e as estrelas são desenhados pelo draw() global antes
    // desta tela. A nave mínima abaixo mantém a animação viva sem criar DOM.
    const shipX = W / 2 + Math.sin(LoadingScreen.animation * 0.035) * Math.min(90, W * 0.16);
    const shipY = H * 0.27 + Math.cos(LoadingScreen.animation * 0.05) * 7;
    ctx.save();
    const loadingShipDrawn = ShipSpriteManager.draw(
        selectedShip, shipX, shipY, compact ? 86 : 108,
        { glow: (SHIP_DEFS[selectedShip] || SHIP_DEFS[0]).color, glowBlur: 16 }
    );
    if (!loadingShipDrawn) {
        ctx.translate(shipX, shipY);
        ctx.fillStyle = meta.accent;
        ctx.shadowColor = meta.accent;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(16, 15);
        ctx.lineTo(0, 9);
        ctx.lineTo(-16, 15);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ' + (compact ? 22 : 28) + 'px Courier New';
    ctx.fillText('FASE ' + LoadingScreen.level, W / 2, H * 0.39);
    ctx.fillStyle = meta.accent;
    ctx.font = 'bold ' + (compact ? 15 : 18) + 'px Courier New';
    ctx.fillText(meta.name.toUpperCase(), W / 2, H * 0.39 + 30);

    if (LoadingScreen.error) {
        ctx.fillStyle = '#ff5b6e';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('NÃO FOI POSSÍVEL CARREGAR A FASE', W / 2, barY - 24);
        const retry = { x: W / 2 - 105, y: barY + 20, w: 210, h: 46 };
        uiButtons.loadingRetry = retry;
        ctx.fillStyle = 'rgba(255,40,70,.12)';
        ctx.fillRect(retry.x, retry.y, retry.w, retry.h);
        ctx.strokeStyle = '#ff5b6e';
        ctx.lineWidth = 2;
        ctx.strokeRect(retry.x, retry.y, retry.w, retry.h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Courier New';
        ctx.fillText('TENTAR NOVAMENTE', W / 2, retry.y + 29);
        ctx.fillStyle = '#8095a8';
        ctx.font = '11px Courier New';
        ctx.fillText('Esc: voltar ao menu', W / 2, retry.y + 76);
        return;
    }

    uiButtons.loadingRetry = null;
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.fillRect(barX, barY, barW, barH);
    const fillW = barW * (LoadingScreen.progress / 100);
    if (fillW > 0) {
        const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        gradient.addColorStop(0, '#1ca9ff');
        gradient.addColorStop(1, meta.accent);
        ctx.fillStyle = gradient;
        const profile = typeof GraphicsManager !== 'undefined' ? GraphicsManager.profile() : null;
        ctx.shadowColor = meta.accent;
        ctx.shadowBlur = !profile || profile.glows ? Math.min(12, profile ? (profile.glowCap || 12) : 12) : 0;
        ctx.fillRect(barX, barY, fillW, barH);
        ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = 'rgba(190,240,255,.65)';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(LoadingScreen.progress + '%', W / 2, barY + 49);
    const dots = '.'.repeat(1 + Math.floor(LoadingScreen.animation / 20) % 3);
    ctx.fillStyle = '#9edfff';
    ctx.font = '14px Courier New';
    ctx.fillText('Carregando' + dots, W / 2, barY - 22);

    ctx.fillStyle = 'rgba(150,220,240,.72)';
    ctx.font = '11px Courier New';
    ctx.fillText('DICA: ' + LoadingScreen.tip, W / 2, Math.min(H - 52, barY + 105));
}
