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
    2: {
        name: 'Vanguarda Inimiga', accent: '#cfcfe0', script: 'js/phases/phase2.js',
        assets: [
            { type: 'image', key: 'phase2-boss', url: 'assets/phases/phase2/guardiao-cinza.webp' }
        ]
    },
    3: {
        name: 'Véu Carmesim', accent: '#ff6ab0', script: 'js/phases/phase3.js',
        assets: [
            { type: 'image', key: 'phase3-boss', url: 'assets/phases/phase3/devoradora-escarlate.webp' }
        ]
    },
    4: { name: 'Coração da Nebulosa', accent: '#ff80ff', script: 'js/phases/phase4.js' },
    5: { name: 'Cinturão Rochoso', accent: '#ffcc55', script: 'js/phases/phase5.js' },
    6: { name: 'Tempestade de Detritos', accent: '#ffb060', script: 'js/phases/phase6.js' },
    7: { name: 'Geleira Profunda', accent: '#a0f0ff', script: 'js/phases/phase7.js' },
    8: { name: 'Fenda Congelada', accent: '#ffffff', script: 'js/phases/phase8.js' },
    9: { name: 'Portal do Núcleo', accent: '#ffaa40', script: 'js/phases/phase9.js' },
    10: { name: 'Núcleo Final', accent: '#ffd040', script: 'js/phases/phase10.js' }
};
Object.assign(PHASE_MANIFEST,{2:{name:'Vanguarda Inimiga',accent:'#cfcfe0',script:'js/phases/phase2.js',assets:[{type:'image',key:'phase2-boss',url:'assets/phases/phase2/guardiao-cinza.webp'},{type:'image',key:'phase2-background',url:'assets/phases/phase2/vanguarda-background.webp'}]},3:{name:'Véu Carmesim',accent:'#ff6ab0',script:'js/phases/phase3.js',assets:[{type:'image',key:'phase3-boss',url:'assets/phases/phase3/devoradora-escarlate.webp'},{type:'image',key:'phase3-background',url:'assets/phases/phase3/veu-carmesim-background.webp'}]},4:{name:'Coração da Nebulosa',accent:'#ff80ff',script:'js/phases/phase4.js',assets:[{type:'image',key:'phase4-boss',url:'assets/phases/phase4/pulsar-magenta.webp'},{type:'image',key:'phase4-background',url:'assets/phases/phase4/coracao-nebulosa-background.webp'}]},5:{name:'Cinturão Rochoso',accent:'#ffcc55',script:'js/phases/phase5.js',assets:[{type:'image',key:'phase5-boss',url:'assets/phases/phase5/britador.webp'},{type:'image',key:'phase5-background',url:'assets/phases/phase5/cinturao-background.webp'}]},6:{name:'Tempestade de Detritos',accent:'#ffb060',script:'js/phases/phase6.js',assets:[{type:'image',key:'phase6-boss',url:'assets/phases/phase6/colisor.webp'},{type:'image',key:'phase6-background',url:'assets/phases/phase6/detritos-background.webp'}]},7:{name:'Geleira Profunda',accent:'#a0f0ff',script:'js/phases/phase7.js',assets:[{type:'image',key:'phase7-boss',url:'assets/phases/phase7/glacius.webp'},{type:'image',key:'phase7-background',url:'assets/phases/phase7/geleira-background.webp'}]},8:{name:'Fenda Congelada',accent:'#fff',script:'js/phases/phase8.js',assets:[{type:'image',key:'phase8-boss',url:'assets/phases/phase8/cristal-prime.webp'},{type:'image',key:'phase8-background',url:'assets/phases/phase8/fenda-background.webp'}]},9:{name:'Portal do Núcleo',accent:'#ffaa40',script:'js/phases/phase9.js',assets:[{type:'image',key:'phase9-boss',url:'assets/phases/phase9/guardiao-nucleo.webp'},{type:'image',key:'phase9-background',url:'assets/phases/phase9/portal-background.webp'}]},10:{name:'Núcleo Final',accent:'#ffd040',script:'js/phases/phase10.js',assets:[{type:'image',key:'phase10-boss',url:'assets/phases/phase10/imperador-abissal.webp'},{type:'image',key:'phase10-background',url:'assets/phases/phase10/nucleo-final-background.webp'}]}});

function getPhaseMeta(level) {
    return PHASE_MANIFEST[level] || {
        name: 'Fase ' + level,
        accent: '#00ffff',
        script: 'js/phases/phase' + level + '.js'
    };
}
