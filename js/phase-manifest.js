// Metadados leves usados pelo menu e pelo carregador. Cada fase declara
// somente os recursos exclusivos que realmente usa durante a missão.
const phaseImage = (key, url) => ({ type: 'image', key, url });
const environmentImage = (name, file) => phaseImage('environment-' + name, 'assets/environment/' + file);

const PHASE_MANIFEST = {
    1: { name:'Patrulha Estelar', accent:'#ff5555', script:'js/phases/phase1.js', assets:[
        phaseImage('phase1-boss','assets/animations/boss-sentinela-zero-sheet.webp'),
        phaseImage('phase1-background','assets/phases/phase1/patrulha-estelar-background.webp') ] },
    2: { name:'Vanguarda Inimiga', accent:'#cfcfe0', script:'js/phases/phase2-runtime.js', assets:[
        phaseImage('phase2-boss','assets/phases/phase2/guardiao-cinza.webp'),
        phaseImage('phase2-background','assets/phases/phase2/vanguarda-background.webp'),
        environmentImage('asteroid','asteroide.webp') ] },
    3: { name:'Véu Carmesim', accent:'#ff6ab0', script:'js/phases/phase3-runtime.js', assets:[
        phaseImage('phase3-boss','assets/phases/phase3/devoradora-escarlate.webp'),
        phaseImage('phase3-background','assets/phases/phase3/veu-carmesim-background.webp'),
        environmentImage('nebula','nebulosa.webp') ] },
    4: { name:'Coração da Nebulosa', accent:'#ff80ff', script:'js/phases/phase4.js', assets:[
        phaseImage('phase4-boss','assets/phases/phase4/pulsar-magenta.webp'),
        phaseImage('phase4-background','assets/phases/phase4/coracao-nebulosa-background.webp'),
        environmentImage('nebula','nebulosa.webp'), environmentImage('mine','mina-espacial.webp') ] },
    5: { name:'Cinturão Rochoso', accent:'#ffcc55', script:'js/phases/phase5.js', assets:[
        phaseImage('phase5-boss','assets/phases/phase5/britador.webp'),
        phaseImage('phase5-background','assets/phases/phase5/cinturao-background.webp'),
        environmentImage('asteroid','asteroide.webp'), environmentImage('laserEmitter','emissor-laser.webp') ] },
    6: { name:'Tempestade de Detritos', accent:'#ffb060', script:'js/phases/phase6.js', assets:[
        phaseImage('phase6-boss','assets/phases/phase6/colisor.webp'),
        phaseImage('phase6-background','assets/phases/phase6/detritos-background.webp'),
        environmentImage('asteroid','asteroide.webp') ] },
    7: { name:'Geleira Profunda', accent:'#a0f0ff', script:'js/phases/phase7.js', assets:[
        phaseImage('phase7-boss','assets/phases/phase7/glacius.webp'),
        phaseImage('phase7-background','assets/phases/phase7/geleira-background.webp'),
        environmentImage('crystal','cristal-ambiental.webp'), environmentImage('shard','fragmento-gelo.webp') ] },
    8: { name:'Fenda Congelada', accent:'#ffffff', script:'js/phases/phase8.js', assets:[
        phaseImage('phase8-boss','assets/phases/phase8/cristal-prime.webp'),
        phaseImage('phase8-background','assets/phases/phase8/fenda-background.webp'),
        environmentImage('crystal','cristal-ambiental.webp'), environmentImage('laserEmitter','emissor-laser.webp') ] },
    9: { name:'Portal do Núcleo', accent:'#ffaa40', script:'js/phases/phase9.js', assets:[
        phaseImage('phase9-boss','assets/phases/phase9/guardiao-nucleo.webp'),
        phaseImage('phase9-background','assets/phases/phase9/portal-background.webp'),
        environmentImage('core','nucleo-energia.webp'), environmentImage('mine','mina-espacial.webp') ] },
    10: { name:'Núcleo Final', accent:'#ffd040', script:'js/phases/phase10.js', assets:[
        phaseImage('phase10-boss','assets/phases/phase10/imperador-abissal.webp'),
        phaseImage('phase10-background','assets/phases/phase10/nucleo-final-background.webp'),
        environmentImage('core','nucleo-energia.webp'), environmentImage('asteroid','asteroide.webp'),
        environmentImage('shard','fragmento-gelo.webp'), environmentImage('laserEmitter','emissor-laser.webp') ] }
};

function getPhaseMeta(level) {
    return PHASE_MANIFEST[level] || {
        name: 'Fase ' + level, accent: '#00ffff',
        script: 'js/phases/phase' + level + '.js', assets: []
    };
}
