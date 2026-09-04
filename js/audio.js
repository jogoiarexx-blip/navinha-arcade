// ================= ÁUDIO =================
// Efeitos sonoros e trilha (Web Audio API). Respeita soundMuted.

let audioCtx;
let explosionBuffer = null;
const levelAudioTimers = new Set();

function scheduleLevelSound(callback, delay) {
    const timer = setTimeout(() => {
        levelAudioTimers.delete(timer);
        callback();
    }, delay);
    levelAudioTimers.add(timer);
    return timer;
}

function clearLevelAudio() {
    levelAudioTimers.forEach(timer => clearTimeout(timer));
    levelAudioTimers.clear();
    noteIndex = 0;
    bassIndex = 0;
}

function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {}
}

function playSound(freq, duration, type = 'square', vol = 0.1) {
    if (typeof soundMuted !== 'undefined' && soundMuted) return;
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playExplosion() {
    if (typeof soundMuted !== 'undefined' && soundMuted) return;
    if (!audioCtx) return;
    try {
        if (!explosionBuffer) {
            const bufferSize = Math.floor(audioCtx.sampleRate * 0.4);
            explosionBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = explosionBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = explosionBuffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
        noise.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
}

function playStarJingle(stars) {
    const notes = [523, 659, 784, 1046];
    for (let i = 0; i < Math.min(stars, notes.length); i++) {
        scheduleLevelSound(() => playSound(notes[i], 0.22, 'sine', 0.1), i * 120);
    }
}

function toggleMute() {
    soundMuted = !soundMuted;
    safeSet('navinhaMuted', soundMuted);
    if (!soundMuted) {
        initAudio();
        playSound(440, 0.08, 'sine', 0.08);
    }
}

// Melodias por tema de decoração da fase
const MELODIES = {
    none:     { melody: [262, 0, 330, 0, 392, 0, 523, 0, 392, 0, 330, 0], bass: [131, 0, 0, 0, 165, 0, 0, 0] },
    nebula:   { melody: [294, 0, 349, 0, 440, 0, 349, 0, 294, 0, 220, 0], bass: [147, 0, 0, 0, 110, 0, 0, 0] },
    asteroids:{ melody: [196, 0, 247, 0, 294, 0, 247, 0, 196, 0, 147, 0], bass: [98, 0, 0, 0, 123, 0, 0, 0] },
    crystals: { melody: [330, 0, 392, 0, 494, 0, 587, 0, 494, 0, 392, 0], bass: [165, 0, 0, 0, 196, 0, 0, 0] },
    core:     { melody: [220, 0, 262, 0, 311, 0, 392, 0, 311, 0, 262, 0], bass: [110, 0, 0, 0, 131, 0, 0, 0] }
};

// Motivos exclusivos por missão; continuam sintetizados e leves (zero MP3
// residente) e evitam que pares de fases soem exatamente iguais.
const PHASE_MUSIC = {
  1:[262,330,392,523,392,330,294,392], 2:[220,277,330,440,370,330,277,247],
  3:[294,349,440,587,523,440,349,262], 4:[311,392,466,622,523,466,392,311],
  5:[196,247,294,370,330,294,247,165], 6:[175,233,294,349,294,233,196,147],
  7:[330,392,494,659,587,494,440,392], 8:[349,440,523,698,659,523,466,392],
  9:[220,277,349,466,415,349,311,233], 10:[165,220,262,330,392,330,262,196]
};

let melody = MELODIES.none.melody;
let bassLine = MELODIES.none.bass;
let noteIndex = 0;
let bassIndex = 0;

function setMusicForLevel(level) {
    const phase = typeof getPhase === 'function' ? getPhase(level) : null;
    const key = (phase && phase.decor && MELODIES[phase.decor]) ? phase.decor : 'none';
    const motif = PHASE_MUSIC[level] || MELODIES[key].melody;
    melody = motif.flatMap(note => [note, 0]);
    bassLine = MELODIES[key].bass;
    noteIndex = 0;
    bassIndex = 0;
}

setInterval(() => {
    if (typeof gameState === 'undefined' || gameState !== 'PLAYING') return;
    if (typeof soundMuted !== 'undefined' && soundMuted) return;
    let note = melody[noteIndex % melody.length];
    if (note > 0) playSound(note, 0.18, 'triangle', 0.035);
    noteIndex++;
    if (noteIndex % 3 === 0) {
        let bass = bassLine[bassIndex % bassLine.length];
        if (bass > 0) playSound(bass, 0.3, 'sine', 0.025);
        bassIndex++;
    }
}, 200);
