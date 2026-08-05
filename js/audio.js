// ================= ÁUDIO =================
// Efeitos sonoros e trilha (Web Audio API). Respeita soundMuted.

let audioCtx;

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
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
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
        setTimeout(() => playSound(notes[i], 0.22, 'sine', 0.1), i * 120);
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

let melody = MELODIES.none.melody;
let bassLine = MELODIES.none.bass;
let noteIndex = 0;
let bassIndex = 0;

function setMusicForLevel(level) {
    const phase = typeof getPhase === 'function' ? getPhase(level) : null;
    const key = (phase && phase.decor && MELODIES[phase.decor]) ? phase.decor : 'none';
    melody = MELODIES[key].melody;
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
