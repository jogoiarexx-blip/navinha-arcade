const CACHE_NAME = 'navinha-arcade-v2.2.1';
const CORE = [
  './','./index.html','./css/style.css','./manifest.webmanifest',
  './js/core.js','./js/phase-manifest.js','./js/audio.js','./js/asset-manager.js',
  './js/ship-sprites.js','./js/powerup-sprites.js','./js/effect-sprites.js','./js/environment-sprites.js',
  './js/loading-screen.js','./js/save-manager.js','./js/levels.js','./js/player.js',
  './js/enemies.js','./js/rescue.js','./js/upgrades.js','./js/ui.js',
  './js/enhancements.js','./js/v12.js','./js/pixi-renderer.js','./js/game.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./vendor/pixi.min.js',
  './js/phases/phase1.js','./js/phases/phase2.js','./js/phases/phase3.js','./js/phases/phase4.js','./js/phases/phase5.js',
  './js/phases/phase6.js','./js/phases/phase7.js','./js/phases/phase8.js','./js/phases/phase9.js','./js/phases/phase10.js',
  './assets/ships/interceptora.webp','./assets/ships/fantasma-branca.webp','./assets/ships/blindada-cinza.webp','./assets/ships/espectro-violeta.webp','./assets/ships/fenix-solar.webp'
  ,'./assets/enemies/shared/patrulheiro-rubro.webp','./assets/enemies/shared/interceptador-zigzag.webp','./assets/enemies/shared/blindado-bronze.webp','./assets/enemies/shared/artilheiro-violeta.webp','./assets/enemies/shared/divisor-esmeralda.webp','./assets/enemies/shared/fragmento-esmeralda.webp','./assets/enemies/shared/rotor-ciano.webp'
  ,'./assets/effects/escudo.webp','./assets/effects/explosao.webp','./assets/effects/particula.webp','./assets/effects/sobrevivente.webp','./assets/effects/tiro-inimigo.webp','./assets/effects/tiro-jogador.webp'
  ,'./assets/powerups/arma.webp','./assets/powerups/bomba.webp','./assets/powerups/drone.webp','./assets/powerups/escudo.webp','./assets/powerups/overdrive.webp','./assets/powerups/vida.webp'
  ,'./assets/phases/phase1/sentinela-zero.webp','./assets/phases/phase1/patrulha-estelar-background.webp','./assets/phases/phase2/guardiao-cinza.webp','./assets/phases/phase2/vanguarda-background.webp','./assets/phases/phase3/devoradora-escarlate.webp','./assets/phases/phase3/veu-carmesim-background.webp'
  ,'./assets/phases/phase4/pulsar-magenta.webp','./assets/phases/phase4/coracao-nebulosa-background.webp','./assets/phases/phase5/britador.webp','./assets/phases/phase5/cinturao-background.webp','./assets/phases/phase6/colisor.webp','./assets/phases/phase6/detritos-background.webp'
  ,'./assets/phases/phase7/glacius.webp','./assets/phases/phase7/geleira-background.webp','./assets/phases/phase8/cristal-prime.webp','./assets/phases/phase8/fenda-background.webp','./assets/phases/phase9/guardiao-nucleo.webp','./assets/phases/phase9/portal-background.webp','./assets/phases/phase10/imperador-abissal.webp','./assets/phases/phase10/nucleo-final-background.webp'
  ,'./assets/environment/asteroide.webp','./assets/environment/mina-espacial.webp','./assets/environment/fragmento-gelo.webp','./assets/environment/emissor-laser.webp','./assets/environment/nebulosa.webp','./assets/environment/cristal-ambiental.webp','./assets/environment/nucleo-energia.webp','./assets/environment/planeta.webp'
];
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
