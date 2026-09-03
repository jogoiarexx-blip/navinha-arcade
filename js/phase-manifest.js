// Metadados leves usados pelo menu e pelo carregador. Os dados completos de
// gameplay continuam isolados em js/phases/phaseN.js e só entram na memória
// quando a fase correspondente é iniciada.
const PHASE_MANIFEST = {
    1: {
        name: 'Patrulha Estelar', accent: '#ff5555', script: 'js/phases/phase1.js',
        assets: [
            { type: 'image', key: 'phase1-boss', url: 'assets/phases/phase1/sentinela-zero.webp' },
            { type: 'image', key: 'phase1-background', url: 'assets/phases/phase1/patrulha-estelar-background.webp' }
        ]
    },
    2: { name: 'Vanguarda Inimiga', accent: '#cfcfe0', script: 'js/phases/phase2.js' },
    3: { name: 'Véu Carmesim', accent: '#ff6ab0', script: 'js/phases/phase3.js' },
    4: { name: 'Coração da Nebulosa', accent: '#ff80ff', script: 'js/phases/phase4.js' },
    5: { name: 'Cinturão Rochoso', accent: '#ffcc55', script: 'js/phases/phase5.js' },
    6: { name: 'Tempestade de Detritos', accent: '#ffb060', script: 'js/phases/phase6.js' },
    7: { name: 'Geleira Profunda', accent: '#a0f0ff', script: 'js/phases/phase7.js' },
    8: { name: 'Fenda Congelada', accent: '#ffffff', script: 'js/phases/phase8.js' },
    9: { name: 'Portal do Núcleo', accent: '#ffaa40', script: 'js/phases/phase9.js' },
    10: { name: 'Núcleo Final', accent: '#ffd040', script: 'js/phases/phase10.js' }
};

function getPhaseMeta(level) {
    return PHASE_MANIFEST[level] || {
        name: 'Fase ' + level,
        accent: '#00ffff',
        script: 'js/phases/phase' + level + '.js'
    };
}
