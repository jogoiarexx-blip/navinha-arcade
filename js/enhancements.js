// ================= NAVINHA ARCADE 2.0: acabamento e expansão =================
// Camada de melhorias não destrutiva: configurações, conquistas, hazards,
// power-ups extras, chefes em fases e UI desktop/mobile.

let controlMode = safeGet('navinhaControlMode', 'HIBRIDO');
if (!['HIBRIDO','TECLADO','MOUSE'].includes(controlMode)) controlMode = 'HIBRIDO';
let fxQuality = safeGet('navinhaFxQuality', 'ALTA');
if (!['BAIXA','ALTA'].includes(fxQuality)) fxQuality = 'ALTA';
let shopTab = 'UPGRADES';
let mouseHoverActive = false;
let hazardObjects = [];
let hazardTimer = 0;
let phaseFrames = 0;
let flashOverlay = 0;
let achievementToast = null;
let achievementToastTimer = 0;
let totalKills = clampInt(safeGet('navinhaTotalKills', 0), 0, 99999999, 0);
let settingsReturnState = 'START';

const ACHIEVEMENTS = [
  {key:'first_blood', name:'Primeiro Sangue', desc:'Destrua seu primeiro inimigo.'},
  {key:'combo20', name:'Piloto Implacável', desc:'Alcance combo 20x.'},
  {key:'perfect', name:'Intocável', desc:'Complete uma fase sem sofrer dano.'},
  {key:'rescuer', name:'Herói do Espaço', desc:'Ganhe a estrela de resgate.'},
  {key:'boss5', name:'Caçador de Titãs', desc:'Derrote o chefe da fase 5.'},
  {key:'story', name:'Fim do Abismo', desc:'Conclua as 10 fases.'},
  {key:'collector', name:'Colecionador', desc:'Libere todas as naves.'},
  {key:'inferno', name:'Além do Limite', desc:'Complete uma fase no INFERNO.'}
];
let achievements = safeGet('navinhaAchievements', {});
if (!isPlainObject(achievements)) achievements = {};
function unlockAchievement(key) {
  if (achievements[key]) return;
  achievements[key] = true;
  safeSet('navinhaAchievements', achievements);
  const a = ACHIEVEMENTS.find(x => x.key === key);
  if (a) { achievementToast = a; achievementToastTimer = 210; playSound(1100, .18, 'sine', .1); }
}
function checkShipCollector() { if (shipsUnlocked.every(Boolean)) unlockAchievement('collector'); }

function setGameSetting(key, value) {
  if (key === 'control') { controlMode = value; safeSet('navinhaControlMode', value); }
  if (key === 'fx') { fxQuality = value; safeSet('navinhaFxQuality', value); }
}
function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  } catch(e) {}
}

// ---------- hazards únicos por fase ----------
function resetPhaseHazards() { hazardObjects = []; hazardTimer = 0; phaseFrames = 0; }
function hazardHitPlayer(obj) {
  if (player.invincible > 0) return;
  if (collide(player, obj)) {
    if (player.shield > 0) absorbHitWithShield(35); else playerHit();
  }
}
function spawnHazardAsteroid(fast) {
  const r = 11 + Math.random()*17;
  hazardObjects.push({kind:'rock', x:Math.random()*(W-r*2), y:-40, w:r*2, h:r*2, r, vy:(fast?5.2:3.1)+Math.random()*2, vx:(Math.random()-.5)*1.2, rot:0, vr:(Math.random()-.5)*.08});
}
function spawnHazardMine() {
  hazardObjects.push({kind:'mine', x:25+Math.random()*(W-70), y:-30, w:28,h:28, vy:1.6+Math.random(), pulse:Math.random()*6.28});
}
function spawnHazardShard() {
  hazardObjects.push({kind:'shard', x:Math.random()*W, y:-35, w:12,h:34, vy:4+Math.random()*2.2, vx:(Math.random()-.5)*2.2});
}
function spawnLaserGate() {
  const gapW = Math.max(120, W*.28); const gapX = 30+Math.random()*(W-gapW-60);
  hazardObjects.push({kind:'laser', y:-20, x:0, w:W, h:12, vy:2.6, gapX, gapW, warn:65});
}
function updatePhaseHazards() {
  if (gameState !== 'PLAYING' || bossActive) return;
  phaseFrames++; hazardTimer++;
  const lvl = currentLevel;
  // identidade crescente: fases iniciais leves; finais combinam perigos
  if ((lvl===2 || lvl===6 || lvl===10) && hazardTimer % (lvl===10?95:140) === 0) spawnHazardAsteroid(lvl>=6);
  if ((lvl===4 || lvl===9) && hazardTimer % 165 === 0) spawnHazardMine();
  if ((lvl===7 || lvl===10) && hazardTimer % 120 === 0) spawnHazardShard();
  if ((lvl===5 || lvl===8 || lvl===10) && hazardTimer % (lvl===10?260:340) === 0) spawnLaserGate();
  // tempestade/gravid. lateral
  if ((lvl===3 || lvl===8) && player && player.w) {
    const dir = Math.sin(phaseFrames/110);
    player.x += dir * (lvl===8 ? 1.15 : .55);
  }
  hazardObjects.forEach(o => {
    if (o.kind==='laser') { if (o.warn>0) o.warn--; else o.y += o.vy; }
    else { o.x += o.vx||0; o.y += o.vy||0; o.rot=(o.rot||0)+(o.vr||0); o.pulse=(o.pulse||0)+.08; }
    if (o.kind==='laser') {
      if (o.warn<=0 && player.y < o.y+o.h && player.y+player.h > o.y && !(player.x>o.gapX && player.x+player.w<o.gapX+o.gapW)) hazardHitPlayer({x:0,y:o.y,w:o.gapX,h:o.h});
      if (o.warn<=0) hazardHitPlayer({x:o.gapX+o.gapW,y:o.y,w:W-(o.gapX+o.gapW),h:o.h});
    } else hazardHitPlayer(o);
  });
  hazardObjects = hazardObjects.filter(o => o.y < H+80);
}
function drawPhaseHazards() {
  hazardObjects.forEach(o => {
    ctx.save();
    if (o.kind==='rock') {
      ctx.translate(o.x+o.r,o.y+o.r); ctx.rotate(o.rot); ctx.fillStyle='#6b5648'; ctx.strokeStyle='#b89b7e'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(-o.r,-o.r*.25); ctx.lineTo(-o.r*.25,-o.r); ctx.lineTo(o.r*.75,-o.r*.45); ctx.lineTo(o.r,o.r*.35); ctx.lineTo(o.r*.15,o.r); ctx.lineTo(-o.r*.75,o.r*.45); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (o.kind==='mine') {
      ctx.translate(o.x+14,o.y+14); ctx.rotate(o.pulse*.35); ctx.strokeStyle='#ff3b3b'; ctx.fillStyle='#351010'; ctx.lineWidth=2;
      for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(-2,-20,4,10);} ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=Math.sin(o.pulse)>0?'#fff':'#f00';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
    } else if (o.kind==='shard') {
      ctx.translate(o.x+6,o.y+17); ctx.rotate(.3); ctx.fillStyle='#6de8ff'; ctx.shadowColor='#6de8ff';ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(6,7);ctx.lineTo(0,17);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
    } else if (o.kind==='laser') {
      const alpha=o.warn>0 ? (.18+.15*Math.sin(Date.now()/70)) : .9; ctx.globalAlpha=alpha;ctx.fillStyle=o.warn>0?'#ffea00':'#ff2a2a';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=16;
      ctx.fillRect(0,o.y,o.gapX,o.h);ctx.fillRect(o.gapX+o.gapW,o.y,W-(o.gapX+o.gapW),o.h);
      if(o.warn>0){ctx.globalAlpha=.8;ctx.fillStyle='#fff';ctx.font='bold 11px Courier New';ctx.textAlign='center';ctx.fillText('⚠ PORTÃO DE LASER',W/2,82);}
    }
    ctx.restore();
  });
}

// ---------- power-ups novos ----------
POWERUP_EFFECTS.overdrive = () => { player.overdriveTimer = 600; playSound(980,.2,'square',.1); };
POWERUP_EFFECTS.drone = () => { player.droneTimer = 720; playSound(760,.2,'triangle',.1); };
POWERUP_EFFECTS.bomb = () => {
  enemyBullets = []; flashOverlay=12; shakeTime=16;
  enemies.forEach(e => { if(e.type!=='boss') e.health=0; else e.health=Math.max(1,e.health-Math.ceil(e.maxHealth*.07)); });
  playExplosion();
};
const baseShoot = shoot;
shoot = function() {
  const before = bullets.length;
  baseShoot();
  if (bullets.length===before) return;
  if (player.overdriveTimer>0) player.shootCooldown = Math.max(2, Math.floor(player.shootCooldown*.55));
  if (player.droneTimer>0) {
    const dmg=Math.max(1,Math.floor((player.bulletDmg||1)*.7));
    bullets.push({x:player.x-3,y:player.y+18,w:5,h:12,speed:9,vx:-.35,dmg});
    bullets.push({x:player.x+player.w-2,y:player.y+18,w:5,h:12,speed:9,vx:.35,dmg});
  }
};
const baseSpawnPowerup = spawnPowerup;
spawnPowerup = function(x,y) {
  const roll=Math.random();
  if(roll<.18){ const types=['overdrive','drone','bomb']; const type=types[Math.floor(Math.random()*types.length)]; powerups.push({x,y,w:34,h:34,type,speed:2,life:420}); return; }
  baseSpawnPowerup(x,y);
};
// ---------- chefes multiestágio ----------
const baseUpdateEnemy = updateEnemy;
updateEnemy = function(e){
  if(e.type==='boss'){
    const hp=e.health/Math.max(1,e.maxHealth); const stages=e.isFinalBoss?4:3;
    const stage=hp>.66?1:(hp>.33?2:3); const finalStage=e.isFinalBoss && hp<.16 ? 4:stage;
    if(e.bossStage!==finalStage){ e.bossStage=finalStage; e.shootTimer=Math.max(BOSS_TELEGRAPH_FRAMES+8,36-finalStage*3); shakeTime=8; flashOverlay=7; playSound(120+finalStage*90,.2,'sawtooth',.08); }
    e.bossPattern=((e.baseBossPattern ?? e.bossPattern ?? 0)+(finalStage-1))%4;
    e.speed=(1.35+finalStage*.22)*currentDifficulty().enemySpeedMult;
  }
  baseUpdateEnemy(e);
};
const baseSpawnBoss = spawnBoss;
spawnBoss = function(){
  baseSpawnBoss(); const e=enemies.find(x=>x.type==='boss'); if(e){e.baseBossPattern=e.bossPattern;e.bossStage=1;}
};
const baseBossBar = drawBossNameAndHealthBar;
drawBossNameAndHealthBar = function(e){
  baseBossBar(e); if(e.bossStage){ctx.fillStyle='#ff0';ctx.font='bold 11px Courier New';ctx.textAlign='center';ctx.fillText('ESTÁGIO '+e.bossStage+(e.isFinalBoss?' / 4':' / 3'),e.x+e.w/2,e.y-43);}
};

// ---------- conquistas ----------
const baseRegisterKill = registerKill;
registerKill = function(points){ baseRegisterKill(points); totalKills++; safeSet('navinhaTotalKills',totalKills); if(totalKills>=1)unlockAchievement('first_blood'); if(comboCount>=20)unlockAchievement('combo20'); };
const baseAwardPhaseStars = awardPhaseStars;
awardPhaseStars = function(level){ const r=baseAwardPhaseStars(level); if(r.details[1]&&r.details[1].ok)unlockAchievement('rescuer'); if(r.details[2]&&r.details[2].ok)unlockAchievement('perfect'); if(level>=5)unlockAchievement('boss5'); if(level>=10)unlockAchievement('story'); if(DIFFICULTIES[difficultyIndex]==='INFERNO')unlockAchievement('inferno'); return r; };
const basePurchaseShipUnlock = purchaseShipUnlock;
purchaseShipUnlock = function(i){basePurchaseShipUnlock(i);checkShipCollector();};

// ---------- UI: menu + loja por abas + configurações ----------
const originalStart = drawStartScreen;
drawStartScreen = function(){
  originalStart();
  uiButtons.settingsBtn={x:12,y:10,w:104,h:30}; uiButtons.achievementsBtn={x:124,y:10,w:124,h:30};
  [['settingsBtn','⚙ AJUSTES'],['achievementsBtn','★ CONQUISTAS']].forEach(([k,t])=>{const r=uiButtons[k];ctx.fillStyle='rgba(0,255,255,.08)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#0aa';ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.fillStyle='#0ff';ctx.font='bold 11px Courier New';ctx.textAlign='center';ctx.fillText(t,r.x+r.w/2,r.y+20);});
};

drawShopScreen = function(){
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';
  ctx.fillStyle='#0ff';ctx.font='bold 28px Courier New';ctx.fillText('ARSENAL',W/2,58);ctx.fillStyle='#ff0';ctx.font='16px Courier New';ctx.fillText('Créditos: '+credits,W/2,86);
  const up={x:30,y:105,w:(W-70)/2,h:38}, sh={x:40+up.w,y:105,w:up.w,h:38};uiButtons.shopTabUp=up;uiButtons.shopTabShips=sh;
  [[up,'UPGRADES','UPGRADES'],[sh,'NAVES','NAVES']].forEach(([r,l,key])=>{ctx.fillStyle=shopTab===key?'rgba(0,255,255,.18)':'rgba(255,255,255,.04)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=shopTab===key?'#0ff':'#555';ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.fillStyle=shopTab===key?'#0ff':'#888';ctx.font='bold 14px Courier New';ctx.fillText(l,r.x+r.w/2,r.y+24);});
  uiButtons.shopRows=[];uiButtons.shipUnlockRows=[];let y=172;
  if(shopTab==='UPGRADES'){
    PERMANENT_UPGRADE_DEFS.forEach(def=>{const level=permanentUpgrades[def.key]||0,maxed=level>=def.max,cost=upgradeCost(def),aff=credits>=cost;const r={x:30,y:y-22,w:W-60,h:48};uiButtons.shopRows.push(r);ctx.fillStyle=maxed?'rgba(0,255,255,.09)':aff?'rgba(255,255,0,.07)':'rgba(255,255,255,.035)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=maxed?'#0ff':aff?'#aa0':'#444';ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.textAlign='left';ctx.fillStyle='#0f0';ctx.font='bold 15px Courier New';ctx.fillText(def.label,42,y-2);ctx.fillStyle=maxed?'#0ff':aff?'#ff0':'#777';ctx.font='12px Courier New';ctx.fillText(maxed?'NÍVEL MÁXIMO':'Custo: '+cost,42,y+17);ctx.textAlign='right';ctx.fillStyle='#0ff';ctx.fillText(level+'/'+def.max,W-42,y+5);ctx.textAlign='center';y+=62;});
  } else {
    SHIP_DEFS.forEach((s,i)=>{const owned=shipsUnlocked[i],selected=selectedShip===i,cost=s.unlockCost||0;const r={x:30,y:y-26,w:W-60,h:72};uiButtons.shipUnlockRows[i]=r;ctx.fillStyle=selected?'rgba(0,255,255,.14)':'rgba(255,255,255,.045)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle=owned?s.color:'#444';ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.textAlign='left';ctx.fillStyle=s.color;ctx.font='bold 16px Courier New';ctx.fillText(s.name,42,y-3);ctx.fillStyle='#aaa';ctx.font='11px Courier New';ctx.fillText(s.desc,42,y+15);const sp=Math.round((s.speed/8)*5),pow=Math.min(5,Math.round((s.bulletDmg||1)*2.5)),def=Math.min(5,2+(s.healthBonus||0));ctx.fillStyle='#0a0';ctx.fillText('VEL '+ '★'.repeat(Math.max(1,sp))+'  POD '+ '★'.repeat(Math.max(1,pow))+'  DEF '+ '★'.repeat(def),42,y+34);ctx.textAlign='right';ctx.fillStyle=owned?'#0ff':credits>=cost?'#ff0':'#777';ctx.fillText(selected?'SELECIONADA':owned?'TOQUE PARA USAR':'LIBERAR '+cost+' CR',W-42,y+4);ctx.textAlign='center';y+=86;});
  }
  const back={x:W/2-90,y:H-58,w:180,h:40};uiButtons.shopBack=back;ctx.fillStyle='rgba(0,255,0,.08)';ctx.fillRect(back.x,back.y,back.w,back.h);ctx.strokeStyle='#0f0';ctx.strokeRect(back.x,back.y,back.w,back.h);ctx.fillStyle='#0f0';ctx.font='bold 14px Courier New';ctx.fillText('← VOLTAR',W/2,back.y+25);
};

function drawSettingsScreen(){
  ctx.fillStyle='#03060a';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#0ff';ctx.font='bold 28px Courier New';ctx.fillText('CONFIGURAÇÕES',W/2,70);
  const rows=[
    ['settingsSound','SOM',soundMuted?'DESLIGADO':'LIGADO'],
    ['settingsVibrate','VIBRAÇÃO',vibrateEnabled?'LIGADA':'DESLIGADA'],
    ['settingsControl','CONTROLE',controlMode],
    ['settingsFx','EFEITOS',fxQuality],
    ['settingsFullscreen','TELA CHEIA',document.fullscreenElement?'SAIR':'ATIVAR']
  ];
  let y=130;rows.forEach(([key,label,val])=>{const r={x:45,y,w:W-90,h:58};uiButtons[key]=r;ctx.fillStyle='rgba(0,255,255,.06)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#166';ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.textAlign='left';ctx.fillStyle='#ddd';ctx.font='14px Courier New';ctx.fillText(label,r.x+16,r.y+23);ctx.textAlign='right';ctx.fillStyle='#0ff';ctx.font='bold 14px Courier New';ctx.fillText(val,r.x+r.w-16,r.y+35);ctx.textAlign='center';y+=72;});
  uiButtons.settingsBack={x:W/2-90,y:H-70,w:180,h:42};ctx.strokeStyle='#0f0';ctx.strokeRect(uiButtons.settingsBack.x,uiButtons.settingsBack.y,180,42);ctx.fillStyle='#0f0';ctx.font='bold 14px Courier New';ctx.fillText('← VOLTAR',W/2,H-43);
  ctx.fillStyle='#688';ctx.font='11px Courier New';ctx.fillText('MOUSE: mover pelo cursor + tiro automático',W/2,H-100);ctx.fillText('TECLADO: WASD/setas + Espaço',W/2,H-84);
}
function drawAchievementsScreen(){
  ctx.fillStyle='#04030a';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#ff0';ctx.font='bold 27px Courier New';ctx.fillText('CONQUISTAS',W/2,62);const got=ACHIEVEMENTS.filter(a=>achievements[a.key]).length;ctx.fillStyle='#0ff';ctx.font='14px Courier New';ctx.fillText(got+'/'+ACHIEVEMENTS.length+' desbloqueadas',W/2,90);let y=120;ACHIEVEMENTS.forEach(a=>{const ok=!!achievements[a.key];ctx.fillStyle=ok?'rgba(255,255,0,.08)':'rgba(255,255,255,.025)';ctx.fillRect(38,y,W-76,54);ctx.strokeStyle=ok?'#aa0':'#333';ctx.strokeRect(38,y,W-76,54);ctx.textAlign='left';ctx.fillStyle=ok?'#ff0':'#666';ctx.font='bold 13px Courier New';ctx.fillText((ok?'★ ':'☆ ')+a.name,50,y+21);ctx.font='11px Courier New';ctx.fillStyle=ok?'#aaa':'#555';ctx.fillText(a.desc,50,y+40);y+=62;});uiButtons.achievementsBack={x:W/2-90,y:H-58,w:180,h:40};ctx.textAlign='center';ctx.strokeStyle='#0f0';ctx.strokeRect(W/2-90,H-58,180,40);ctx.fillStyle='#0f0';ctx.fillText('← VOLTAR',W/2,H-33);}

// Menu tap substituído para retirar "clique vazio = jogar" e incluir telas novas.
const baseMenuTap = handleMenuTap;
handleMenuTap = function(px,py){
  if(gameState==='START'){
    if(uiButtons.muteBtn&&pointInRect(px,py,uiButtons.muteBtn)){toggleMute();return;}
    if(pointInRect(px,py,uiButtons.settingsBtn)){settingsReturnState='START';gameState='SETTINGS';return;}
    if(pointInRect(px,py,uiButtons.achievementsBtn)){gameState='ACHIEVEMENTS';return;}
    if(pointInRect(px,py,uiButtons.diffLeft)){changeDifficulty(-1);return;} if(pointInRect(px,py,uiButtons.diffRight)){changeDifficulty(1);return;}
    if(pointInRect(px,py,uiButtons.shop)){gameState='SHOP';return;} if(uiButtons.levelSelect&&pointInRect(px,py,uiButtons.levelSelect)){gameState='LEVEL_SELECT';return;}
    if(pointInRect(px,py,uiButtons.shipLeft)){cycleSelectedShip(-1);return;} if(pointInRect(px,py,uiButtons.shipRight)){cycleSelectedShip(1);return;}
    if(pointInRect(px,py,uiButtons.playButton)){resetGame();return;} return;
  }
  if(gameState==='SHOP'){
    if(pointInRect(px,py,uiButtons.shopBack)){gameState='START';return;} if(pointInRect(px,py,uiButtons.shopTabUp)){shopTab='UPGRADES';return;} if(pointInRect(px,py,uiButtons.shopTabShips)){shopTab='NAVES';return;}
    if(shopTab==='UPGRADES'){(uiButtons.shopRows||[]).forEach((r,i)=>{if(pointInRect(px,py,r))purchaseUpgrade(PERMANENT_UPGRADE_DEFS[i].key);});}
    else {(uiButtons.shipUnlockRows||[]).forEach((r,i)=>{if(!r||!pointInRect(px,py,r))return;if(shipsUnlocked[i]){selectedShip=i;safeSet('navinhaSelectedShip',i);playSound(400,.08,'sine',.07);}else purchaseShipUnlock(i);});} return;
  }
  if(gameState==='SETTINGS'){
    if(pointInRect(px,py,uiButtons.settingsSound)){toggleMute();return;} if(pointInRect(px,py,uiButtons.settingsVibrate)){vibrateEnabled=!vibrateEnabled;safeSet('navinhaVibrate',vibrateEnabled);return;}
    if(pointInRect(px,py,uiButtons.settingsControl)){const modes=['HIBRIDO','TECLADO','MOUSE'];setGameSetting('control',modes[(modes.indexOf(controlMode)+1)%modes.length]);return;}
    if(pointInRect(px,py,uiButtons.settingsFx)){setGameSetting('fx',fxQuality==='ALTA'?'BAIXA':'ALTA');return;} if(pointInRect(px,py,uiButtons.settingsFullscreen)){toggleFullscreen();return;} if(pointInRect(px,py,uiButtons.settingsBack)){gameState=settingsReturnState;return;} return;
  }
  if(gameState==='ACHIEVEMENTS'){if(pointInRect(px,py,uiButtons.achievementsBack))gameState='START';return;}
  baseMenuTap(px,py);
};

// mouse arcade opcional: cursor move a nave sem segurar botão.
canvas.addEventListener('mousemove',e=>{if(gameState!=='PLAYING'||controlMode!=='MOUSE')return;const r=canvas.getBoundingClientRect();touchX=(e.clientX-r.left)*(W/r.width);touchY=(e.clientY-r.top)*(H/r.height);mouseHoverActive=true;});
canvas.addEventListener('mouseleave',()=>{mouseHoverActive=false;if(controlMode==='MOUSE'){touchX=null;touchY=null;}});
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='c'&&gameState==='START'){gameState='ACHIEVEMENTS';}if(k==='o'&&gameState==='START'){gameState='SETTINGS';}if((gameState==='SETTINGS'||gameState==='ACHIEVEMENTS')&&(k==='escape'||k==='backspace'))gameState='START';});

// desenho extra de naves novas
function drawShipGeneric(scheme){const x=player.x,y=player.y,w=player.w,h=player.h,cx=x+w/2;ctx.save();ctx.shadowColor=scheme.glow;ctx.shadowBlur=12;ctx.fillStyle=scheme.flame;const flick=5+Math.sin(Date.now()/45)*3;ctx.beginPath();ctx.moveTo(cx-8,y+h-5);ctx.lineTo(cx,y+h+flick);ctx.lineTo(cx+8,y+h-5);ctx.fill();ctx.fillStyle=scheme.body;ctx.beginPath();ctx.moveTo(cx,y);ctx.lineTo(x+w,y+h*.72);ctx.lineTo(cx+w*.18,y+h*.62);ctx.lineTo(cx,y+h*.92);ctx.lineTo(cx-w*.18,y+h*.62);ctx.lineTo(x,y+h*.72);ctx.closePath();ctx.fill();ctx.fillStyle=scheme.core;ctx.beginPath();ctx.arc(cx,y+h*.42,w*.11,0,Math.PI*2);ctx.fill();ctx.restore();}
const oldDrawPlayerShip = drawPlayerShip;
drawPlayerShip=function(){if(player.shipType===3)drawShipGeneric({body:'#6f38ff',core:'#f0b3ff',glow:'#9d5cff',flame:'#53f3ff'});else if(player.shipType===4)drawShipGeneric({body:'#ff7a18',core:'#fff08a',glow:'#ff7a18',flame:'#fff'});else oldDrawPlayerShip();};

// wrappers visuais
const originalHUD = drawHUD;
drawHUD=function(){originalHUD();if(gameState==='PLAYING'){ctx.textAlign='left';ctx.font='10px Courier New';let y=74;if(player.overdriveTimer>0){ctx.fillStyle='#ff9a00';ctx.fillText('⚡ OVERDRIVE '+Math.ceil(player.overdriveTimer/60)+'s',10,y);y+=14;}if(player.droneTimer>0){ctx.fillStyle='#c78cff';ctx.fillText('◆ DRONES '+Math.ceil(player.droneTimer/60)+'s',10,y);}}
};
function drawAchievementToast(){if(achievementToastTimer<=0||!achievementToast)return;const w=Math.min(360,W-40),x=(W-w)/2,y=90;ctx.fillStyle='rgba(0,0,0,.88)';ctx.fillRect(x,y,w,54);ctx.strokeStyle='#ff0';ctx.strokeRect(x,y,w,54);ctx.fillStyle='#ff0';ctx.font='bold 12px Courier New';ctx.textAlign='center';ctx.fillText('★ CONQUISTA DESBLOQUEADA',W/2,y+19);ctx.fillStyle='#fff';ctx.font='13px Courier New';ctx.fillText(achievementToast.name,W/2,y+39);}

checkShipCollector();
