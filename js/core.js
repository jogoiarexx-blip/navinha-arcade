// ================= CORE: canvas, estado global e utilitários =================
// Define o canvas, todas as variáveis de estado compartilhadas entre os
// demais módulos, e funções utilitárias de baixo nível.
// Deve ser carregado ANTES de qualquer outro script do jogo.

const canvas = document.getElementById('gameCanvas');
// `desynchronized` reduz a fila entre CPU e compositor quando o navegador
// oferece suporte. Navegadores antigos simplesmente ignoram essa opção.
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
// A resolução interna pode ser ajustada pelas opções gráficas enquanto o
// jogador está no menu. As coordenadas continuam usando a mesma altura.
let W = canvas.width;
let H = canvas.height;

// ================= STORAGE SEGURO =================
// localStorage pode lançar erro em file://, webviews e navegadores
// in-app (Instagram, Facebook, etc). Isso travava o script inteiro
// e deixava a tela preta. Agora usamos funções seguras com fallback,
// e um par genérico safeGet/safeSet para qualquer dado persistido.
// Dados lidos ainda passam por sanitize* para rejeitar formas corrompidas
// (string no lugar de número, chaves faltando, valores fora do range, etc).
function safeGet(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}
function safeSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // Ignora silenciosamente se localStorage não estiver disponível
    }
}

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function sanitizeBool(raw, fallback) {
    return typeof raw === 'boolean' ? raw : fallback;
}

// Inteiro finito dentro de [min, max]; senão retorna fallback.
function clampInt(v, min, max, fallback) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

// ---- Sanitizers por tipo de dado persistido ----
const DEFAULT_STARS = { NORMAL: 0, DIFICIL: 0, INSANO: 0, INFERNO: 0 };
const DEFAULT_UPGRADES = { life: 0, firerate: 0, shield: 0, damage: 0, rescuerange: 0, rescuespeed: 0 };
// Máximos alinhados com PERMANENT_UPGRADE_DEFS em upgrades.js
const UPGRADE_MAX = { life: 3, firerate: 3, shield: 2, damage: 3, rescuerange: 3, rescuespeed: 3 };
// Estrelas por fase (1–10): 0 a 3 por dificuldade
const DEFAULT_PHASE_STARS = { NORMAL: null, DIFICIL: null, INSANO: null, INFERNO: null };

function sanitizeStars(raw) {
    const out = { NORMAL: 0, DIFICIL: 0, INSANO: 0, INFERNO: 0 };
    if (!isPlainObject(raw)) return out;
    for (const key of Object.keys(out)) {
        out[key] = clampInt(raw[key], 0, 5, 0);
    }
    return out;
}

// phaseStars[diff] = array de 11 slots (índice 1..10 = fase); cada valor 0–3
function makeEmptyPhaseStars() {
    const arr = new Array(11).fill(0);
    arr[0] = 0;
    return arr;
}

function sanitizePhaseStars(raw) {
    const out = { NORMAL: makeEmptyPhaseStars(), DIFICIL: makeEmptyPhaseStars(),
                  INSANO: makeEmptyPhaseStars(), INFERNO: makeEmptyPhaseStars() };
    if (!isPlainObject(raw)) return out;
    for (const key of Object.keys(out)) {
        const src = raw[key];
        if (Array.isArray(src)) {
            for (let i = 1; i <= 10; i++) {
                out[key][i] = clampInt(src[i], 0, 3, 0);
            }
        } else if (isPlainObject(src)) {
            for (let i = 1; i <= 10; i++) {
                out[key][i] = clampInt(src[i], 0, 3, 0);
            }
        }
    }
    return out;
}

function getPhaseStars(diffKey, level) {
    const arr = phaseStars[diffKey] || makeEmptyPhaseStars();
    return arr[level] || 0;
}

function setPhaseStarsBest(diffKey, level, stars) {
    if (!phaseStars[diffKey]) phaseStars[diffKey] = makeEmptyPhaseStars();
    const prev = phaseStars[diffKey][level] || 0;
    if (stars > prev) {
        phaseStars[diffKey][level] = stars;
        safeSet('navinhaPhaseStars', phaseStars);
        return true;
    }
    return false;
}

// Média das fases (arredondada) usada como “estrelas da dificuldade” (0–5)
function recomputeDifficultyStars(diffKey) {
    const arr = phaseStars[diffKey] || makeEmptyPhaseStars();
    let sum = 0;
    let count = 0;
    for (let i = 1; i <= 10; i++) {
        if (arr[i] > 0) {
            sum += arr[i];
            count++;
        }
    }
    if (count === 0) return 0;
    // 3 estrelas/fase → escala para 0–5; exige ter jogado várias fases
    const avg3 = sum / Math.max(count, 1);
    const scaled = Math.round((avg3 / 3) * 5);
    // Bônus: se todas as 10 fases têm pelo menos 1★, mínimo 3; se todas 3★, 5
    let result = Math.max(1, Math.min(5, scaled));
    if (count >= 10) {
        const minStar = Math.min(...arr.slice(1, 11));
        if (minStar >= 3) result = 5;
        else if (minStar >= 2) result = Math.max(result, 4);
        else if (minStar >= 1) result = Math.max(result, 3);
    }
    return result;
}

function starString3(n) {
    n = Math.max(0, Math.min(3, n | 0));
    return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function sanitizeUpgrades(raw) {
    const out = { life: 0, firerate: 0, shield: 0, damage: 0, rescuerange: 0, rescuespeed: 0 };
    if (!isPlainObject(raw)) return out;
    out.life = clampInt(raw.life, 0, UPGRADE_MAX.life, 0);
    out.firerate = clampInt(raw.firerate, 0, UPGRADE_MAX.firerate, 0);
    out.shield = clampInt(raw.shield, 0, UPGRADE_MAX.shield, 0);
    out.damage = clampInt(raw.damage, 0, UPGRADE_MAX.damage, 0);
    out.rescuerange = clampInt(raw.rescuerange, 0, UPGRADE_MAX.rescuerange, 0);
    out.rescuespeed = clampInt(raw.rescuespeed, 0, UPGRADE_MAX.rescuespeed, 0);
    return out;
}

function sanitizeRankings(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(isPlainObject)
        .map(r => ({
            score: clampInt(r.score, 0, 99999999, 0),
            level: clampInt(r.level, 1, 10, 1),
            difficulty: (typeof r.difficulty === 'string' && DIFFICULTIES.indexOf(r.difficulty) >= 0)
                ? r.difficulty
                : 'NORMAL'
        }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function sanitizeHighScore(raw) {
    return clampInt(raw, 0, 99999999, 0);
}

function sanitizeCredits(raw) {
    return clampInt(raw, 0, 99999999, 0);
}

function sanitizeUnlockedLevel(raw) {
    // MAX_LEVEL ainda não está declarado aqui; o teto 10 é o valor fixo do modo história
    return clampInt(raw, 1, 10, 1);
}

function sanitizeSelectedShip(raw) {
    return clampInt(raw, 0, SHIP_DEFS.length - 1, 0);
}

// ================= NAVES =================
// Nave 0 é a padrão (sempre disponível). As demais precisam ser
// liberadas na loja com créditos (ver upgrades.js / purchaseShipUnlock).
// w/h/speed/healthBonus/bulletDmg definem as diferenças de jogabilidade
// de cada nave (aplicadas em buildPlayer, em levels.js).
const SHIP_DEFS = [
    { key: 'default', name: 'Interceptora', desc: 'Equilibrada, arma centralizada',
      color: '#00aaff', w: 40, h: 50, renderH: 72, sprite: 'assets/ships/interceptora.webp', speed: 6, healthBonus: 0, bulletDmg: 1 },
    { key: 'phantom', name: 'Fantasma Branca', desc: 'Mais veloz e ágil, casco mais estreito',
      color: '#f2f2f2', w: 34, h: 44, renderH: 68, sprite: 'assets/ships/fantasma-branca.webp', speed: 7.5, healthBonus: 0, bulletDmg: 1, unlockCost: 280 },
    { key: 'juggernaut', name: 'Blindada Cinza', desc: 'Lenta e robusta, tiro com o dobro de dano',
      color: '#9aa5b1', w: 50, h: 58, renderH: 84, sprite: 'assets/ships/blindada-cinza.webp', speed: 4.2, healthBonus: 1, bulletDmg: 2, unlockCost: 420 },
    { key: 'spectre', name: 'Espectro Violeta', desc: 'Ágil, pequena e focada em esquiva',
      color: '#9d5cff', w: 32, h: 42, renderH: 68, sprite: 'assets/ships/espectro-violeta.webp', speed: 8.2, healthBonus: 0, bulletDmg: 1, unlockCost: 600 },
    { key: 'phoenix', name: 'Fênix Solar', desc: 'Canhão pesado e casco reforçado',
      color: '#ff7a18', w: 46, h: 54, renderH: 82, sprite: 'assets/ships/fenix-solar.webp', speed: 5.2, healthBonus: 1, bulletDmg: 3, unlockCost: 850 }
];

// Índices das naves que precisam ser liberadas na loja (tudo que não é a 0)
const LOCKABLE_SHIP_INDICES = SHIP_DEFS.map((s, i) => i).filter(i => SHIP_DEFS[i].unlockCost);

// ================= DIFICULDADE =================
const DIFFICULTIES = ['NORMAL', 'DIFICIL', 'INSANO', 'INFERNO'];
const DIFFICULTY_CONFIG = {
    NORMAL:  { label: 'NORMAL',  enemySpeedMult: 1.0,  enemyHealthMult: 1.0, spawnRateMult: 1.0,  startLives: 3, color: '#0f0' },
    DIFICIL: { label: 'DIFÍCIL', enemySpeedMult: 1.15, enemyHealthMult: 1.25, spawnRateMult: 1.18, startLives: 3, color: '#ff0' },
    INSANO:  { label: 'INSANO',  enemySpeedMult: 1.35, enemyHealthMult: 1.6, spawnRateMult: 1.38, startLives: 2, color: '#f80' },
    INFERNO: { label: 'INFERNO', enemySpeedMult: 1.6,  enemyHealthMult: 2.1, spawnRateMult: 1.6,  startLives: 1, color: '#f00' }
};
let difficultyIndex = 0;
function currentDifficulty() {
    return DIFFICULTY_CONFIG[DIFFICULTIES[difficultyIndex]];
}

// ================= DESBLOQUEIO DE DIFICULDADE =================
// NORMAL sempre está liberada. Cada dificuldade seguinte só destrava
// quando a anterior atinge 5 estrelas (derivadas do desempenho por fase:
// todas as 10 fases com 3★, ou média alta com história completa).
let starsByDifficulty = sanitizeStars(safeGet('navinhaStars', DEFAULT_STARS));
let phaseStars = sanitizePhaseStars(safeGet('navinhaPhaseStars', DEFAULT_PHASE_STARS));
let lastUnlockedDifficulty = null; // usado para exibir aviso de nova dificuldade na tela de vitória
let lastRunStars = null; // estrelas (1-5) da última corrida concluída, exibidas na tela de vitória
let lastPhaseStarsEarned = null; // { stars, details[] } da última fase concluída
let lockMessage = '';
let lockMessageTimer = 0;
let phaseClearMessage = ''; // exibida rapidamente na tela de seleção de fases após vencer um chefe
let phaseClearTimer = 0;

// Objetivos da fase atual (resetados em setupLevel / resetPhaseObjectives)
let phaseTookDamage = false;
let phaseMaxCombo = 0;
let phaseSurvivorsSpawned = 0;
let phaseSurvivorsRescued = 0;
let phaseSurvivorsMissed = 0;
let phaseTargetSurvivors = 2;
let phaseObjectivesMet = null; // preenchido ao derrotar o chefe

function isDifficultyUnlocked(idx) {
    if (idx <= 0) return true;
    const prevKey = DIFFICULTIES[idx - 1];
    return (starsByDifficulty[prevKey] || 0) >= 5;
}

function starString(n) {
    n = Math.max(0, Math.min(5, n));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// ================= ESTADO DO JOGO =================
// Estados: START, SHOP, LEVEL_SELECT, PLAYING, PAUSED,
// LEVEL_TRANSITION, PHASE_RESULT, GAMEOVER, STORY_COMPLETE, TUTORIAL
let gameState = 'START';
let score = 0;
let highScore = sanitizeHighScore(safeGet('navinhaHighScore', 0));
let rankings = sanitizeRankings(safeGet('navinhaRankings', [])); // [{score, level, difficulty}]
let credits = sanitizeCredits(safeGet('navinhaCredits', 0));
let unlockedLevel = sanitizeUnlockedLevel(safeGet('navinhaUnlockedLevel', 1));
let permanentUpgrades = sanitizeUpgrades(safeGet('navinhaUpgrades', DEFAULT_UPGRADES));
let shakeTime = 0;
let hitStopFrames = 0;          // freeze frames de impacto
let phaseScoreStart = 0;        // score no início da fase (para créditos parciais)
let lastCreditsEarned = 0;      // créditos da última fase / game over
let runCreditsEarned = 0;       // créditos já pagos nesta run (evita double-pay)
let continuousRun = false;      // true se veio de "Continuar" entre fases

// Áudio / tutorial / vibração (persistidos)
let soundMuted = sanitizeBool(safeGet('navinhaMuted', false), false);
let tutorialSeen = sanitizeBool(safeGet('navinhaTutorialSeen', false), false);
let vibrateEnabled = sanitizeBool(safeGet('navinhaVibrate', true), true);

// Multiplicador de créditos por dificuldade
function creditDifficultyMult() {
    return [1, 1.25, 1.6, 2.1][difficultyIndex] || 1;
}

// Paga créditos e persiste; retorna o valor pago
function grantCredits(amount) {
    amount = Math.max(0, Math.floor(amount));
    if (amount <= 0) return 0;
    credits += amount;
    runCreditsEarned += amount;
    safeSet('navinhaCredits', credits);
    return amount;
}

// Créditos de uma fase: pontuação da fase + bônus por estrelas × dificuldade
function computePhaseCredits(phasePoints, stars) {
    const starBonus = [0, 8, 20, 45][Math.max(0, Math.min(3, stars | 0))] || 0;
    const base = Math.floor(phasePoints / 70);
    return Math.floor((base + starBonus) * creditDifficultyMult());
}

// ================= NAVE SELECIONADA =================
// shipsUnlocked[i] = true se a nave i (índice em SHIP_DEFS) já foi liberada.
// A nave 0 está sempre liberada por padrão; as demais são compradas na loja.
const rawShipsUnlocked = safeGet('navinhaShipsUnlocked', null);
let shipsUnlocked = SHIP_DEFS.map((s, i) => {
    if (i === 0) return true;
    return Array.isArray(rawShipsUnlocked) ? sanitizeBool(rawShipsUnlocked[i], false) : false;
});
let selectedShip = sanitizeSelectedShip(safeGet('navinhaSelectedShip', 0));
if (!shipsUnlocked[selectedShip]) selectedShip = 0;

// ================= SISTEMA DE FASES (MODO HISTÓRIA) =================
let currentLevel = 1;
const MAX_LEVEL = 10;
let enemiesKilledThisLevel = 0;
let enemiesToKill = 15;
let levelTransitionTimer = 0;
let bossActive = false;

// ================= REGISTRO DE FASES (MODO HISTÓRIA) =================
// Cada fase (1 a 10) tem seu próprio arquivo em js/phases/phaseN.js, que
// preenche PHASE_DEFS[N] com tema visual (cores + decoração) e o chefe
// daquela fase (nome, paleta, padrão de ataque, tamanho). Os arquivos de
// fase são carregados logo depois deste, então PHASE_DEFS precisa
// existir antes deles.
let PHASE_DEFS = {};

function getPhase(level) {
    return PHASE_DEFS[level] || PHASE_DEFS[1] || {
        name: (typeof getPhaseMeta === 'function' ? getPhaseMeta(level).name : 'Fase ' + level),
        bgTop: '#000', bgBottom: '#000', decor: 'none',
        boss: { name: 'Chefe', primaryColor: '#880000', secondaryColor: '#ff2222', coreColor: '#ff5555', pattern: 0, sizeScale: 1 }
    };
}
// Mantido por compatibilidade com o nome usado em telas/HUD já existentes
function getLevelTheme(level) {
    return getPhase(level);
}

let levelDecor = []; // elementos de fundo da fase atual (nebulosa, asteroides, cristais, planeta...)
function generateLevelDecor(level) {
    const phase = getPhase(level);
    const decor = [];
    const accent = phase.decorAccent || '#f26';
    const decorScale = typeof GraphicsManager !== 'undefined'
        ? GraphicsManager.profile().decorScale : 1;

    // Planeta/lua ao fundo: dá identidade instantânea à fase por um custo
    // baixíssimo (1 gradiente CRIADO UMA VEZ aqui e reaproveitado todo
    // frame — nunca recriado dentro do draw, que é o que pesa).
    if (!phase.hasImageBackground) {
        const planetSide = level % 2 === 0 ? 1 : -1; // alterna lado a cada fase
        const px = W / 2 + planetSide * W * 0.62;
        const py = H * (0.16 + (level % 3) * 0.05);
        const pr = 95 + (level % 4) * 18;
        let planetGrad = null;
        if (ctx.createRadialGradient) {
            planetGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, pr * 0.1, px, py, pr);
            planetGrad.addColorStop(0, accent);
            planetGrad.addColorStop(0.55, phase.bgTop || '#111');
            planetGrad.addColorStop(1, 'rgba(0,0,0,0)');
        }
        decor.push({
            type: 'planet', x: px, y: py, r: pr, grad: planetGrad, color: accent,
            driftSpeed: 0.05, twinklePhase: 0
        });
    }

    // Poeira/detritos leves em toda fase — camada extra de profundidade,
    // tão barata quanto as camadas de estrelas (só fillRect com alpha).
    const dustCount = Math.max(5, Math.round((phase.decor === 'none' ? 26 : 14) * decorScale));
    for (let i = 0; i < dustCount; i++) {
        decor.push({
            type: 'dust', x: Math.random() * W, y: Math.random() * H,
            size: 1 + Math.random() * 2, speed: 0.6 + Math.random() * 1.4,
            color: accent, alphaBase: 0.15 + Math.random() * 0.2,
            twinklePhase: Math.random() * Math.PI * 2, twinkleSpeed: 0.02 + Math.random() * 0.03
        });
    }

    // No perfil Baixo ficam somente planeta e poeira. Nebulosas, cristais e
    // glows grandes ocupam muita área de rasterização em GPUs integradas.
    if (decorScale >= 0.25 && phase.decor === 'nebula') {
        for (let i = 0; i < Math.max(3, Math.round(8 * decorScale)); i++) {
            decor.push({
                type: 'blob', x: Math.random() * W, y: Math.random() * H,
                r: 60 + Math.random() * 90, color: accent, alphaBase: 0.05 + Math.random() * 0.06,
                speed: 0.12 + Math.random() * 0.2, vx: (Math.random() - 0.5) * 0.15,
                twinklePhase: Math.random() * Math.PI * 2, twinkleSpeed: 0.008 + Math.random() * 0.012
            });
        }
    } else if (decorScale >= 0.25 && phase.decor === 'asteroids') {
        for (let i = 0; i < Math.max(3, Math.round(9 * decorScale)); i++) {
            decor.push({
                type: 'asteroid', x: Math.random() * W, y: Math.random() * H,
                r: 12 + Math.random() * 20, speed: 0.3 + Math.random() * 0.5, rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    } else if (decorScale >= 0.25 && phase.decor === 'crystals') {
        for (let i = 0; i < Math.max(3, Math.round(9 * decorScale)); i++) {
            decor.push({
                type: 'crystal', x: Math.random() * W, y: Math.random() * H,
                r: 10 + Math.random() * 16, speed: 0.4 + Math.random() * 0.5,
                twinklePhase: Math.random() * Math.PI * 2, twinkleSpeed: 0.03 + Math.random() * 0.04
            });
        }
    } else if (decorScale >= 0.25 && phase.decor === 'core') {
        const spots = [
            { x: W / 2, y: H * 0.32, r: 190 },
            { x: W * 0.2, y: H * 0.75, r: 110 },
            { x: W * 0.85, y: H * 0.6, r: 90 }
        ];
        spots.forEach((s, i) => {
            let g = null;
            if (ctx.createRadialGradient) {
                g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
                g.addColorStop(0, 'rgba(255,80,0,0.22)');
                g.addColorStop(1, 'rgba(255,80,0,0)');
            }
            decor.push({
                type: 'coreGlow', x: s.x, y: s.y, r: s.r, grad: g,
                twinklePhase: i * 2, twinkleSpeed: 0.02 + i * 0.006
            });
        });
    }
    return decor;
}

// ================= COMBO =================
let comboCount = 0;
let comboTimer = 0;
let maxComboReached = 0; // melhor combo da partida atual, usado no cálculo de estrelas
const COMBO_WINDOW = 90; // frames sem matar até o combo zerar
function comboMultiplier() {
    return 1 + Math.floor(comboCount / 5) * 0.5;
}
function resetCombo() {
    comboCount = 0;
    comboTimer = 0;
}

// ================= OBJETOS =================
let stars = [];       // camada intermediária (compatibilidade)
let starsFar = [];    // paralaxe: fundo, mais lenta
let starsNear = [];   // paralaxe: frente, mais rápida
let player = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let powerups = [];

let keys = {};
let touchX = null;
let touchY = null;
let isTouching = false;

let enemySpawnTimer = 0;

// Retângulos de toque/clique das telas de menu (START, SHOP, LEVEL_SELECT),
// recalculados a cada draw() e usados pelos handlers de toque/mouse em
// player.js — assim a loja e a seleção de fase funcionam no celular também,
// não só pelo teclado.
let uiButtons = {};
function pointInRect(px, py, r) {
    return !!r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function collide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

function spawnParticles(x, y, color, amount) {
    const useExplosionSprite = typeof GraphicsManager === 'undefined' ||
        GraphicsManager.profile().spriteExplosions;
    if (useExplosionSprite && amount >= 10) {
        const explosionSize = amount >= 30 ? 96 : (amount >= 18 ? 68 : 48);
        particles.push({
            effect: 'explosion', x, y, size: explosionSize,
            vx: 0, vy: 0, life: 18, maxLife: 18,
            rotation: Math.random() * Math.PI * 2, color
        });
    }
    for (let i = 0; i < amount; i++) {
        const life = 25 + Math.random() * 15;
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 1,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            life: life,
            maxLife: life,
            rotation: Math.random() * Math.PI * 2,
            color: color
        });
    }
}

// Vibração tátil (respeita preferência do jogador)
function vibrate(ms) {
    if (!vibrateEnabled) return;
    try {
        if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
}
