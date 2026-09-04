// ================= NAVINHA ARCADE v1.2 =================
// Polimento visual, menu redesenhado e otimizações de impacto/boss.
const GAME_VERSION='2.2';

// Limita partículas em máquinas mais fracas e impede acúmulo durante bosses.
const _spawnParticlesV11=spawnParticles;
spawnParticles=function(x,y,color,amount){
  const profile=typeof GraphicsManager!=='undefined'?GraphicsManager.profile():{particleCap:260,particleScale:1};
  const maxParticles=profile.particleCap;
  if(particles.length>=maxParticles)return;
  const room=maxParticles-particles.length;
  const scaledAmount=Math.max(1,Math.round(amount*profile.particleScale));
  _spawnParticlesV11(x,y,color,Math.max(0,Math.min(scaledAmount,room)));
};

function roundRectPath(x,y,w,h,r){
  r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function glassCard(x,y,w,h,accent,alpha=.10){
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,`rgba(16,33,55,.94)`);g.addColorStop(1,'rgba(4,9,20,.92)');ctx.fillStyle=g;roundRectPath(x,y,w,h,14);ctx.fill();ctx.strokeStyle=accent||'rgba(90,210,255,.38)';ctx.lineWidth=1.4;ctx.stroke();
  ctx.fillStyle=`rgba(255,255,255,${alpha})`;roundRectPath(x+1,y+1,w-2,2,1);ctx.fill();
}
function neonButton(r,label,sub,accent,active=true){
  ctx.save();const a=active?accent:'#53616d';ctx.shadowColor=active?a:'transparent';ctx.shadowBlur=active?10:0;const g=ctx.createLinearGradient(r.x,r.y,r.x,r.y+r.h);g.addColorStop(0,active?'rgba(25,54,78,.98)':'rgba(25,29,34,.94)');g.addColorStop(1,'rgba(5,10,19,.98)');ctx.fillStyle=g;roundRectPath(r.x,r.y,r.w,r.h,12);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=active?a:'#39434b';ctx.lineWidth=1.5;ctx.stroke();ctx.textAlign='center';ctx.fillStyle=active?'#f4fbff':'#69757f';ctx.font=`800 ${Math.max(13,Math.min(17,r.w/13))}px Segoe UI,Arial`;ctx.fillText(label,r.x+r.w/2,r.y+r.h/2+(sub?-3:5));if(sub){ctx.fillStyle=active?a:'#59636b';ctx.font='10px Segoe UI,Arial';ctx.fillText(sub,r.x+r.w/2,r.y+r.h/2+15);}ctx.restore();
}
function drawMenuBackdropV12(){
  const g=ctx.createRadialGradient(W*.5,H*.25,10,W*.5,H*.35,Math.max(W,H)*.85);g.addColorStop(0,'#102645');g.addColorStop(.35,'#081325');g.addColorStop(1,'#01030a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // nebulosas leves
  const profile=typeof GraphicsManager!=='undefined'?GraphicsManager.profile():{additive:true};
  ctx.save();ctx.globalCompositeOperation=profile.additive?'screen':'source-over';
  const nebulaCount=profile.label==='BAIXO'?1:3;
  for(let i=0;i<nebulaCount;i++){const x=[.18,.72,.52][i]*W,y=[.30,.24,.72][i]*H,r=[.24,.20,.27][i]*Math.min(W,H);const ng=ctx.createRadialGradient(x,y,0,x,y,r);ng.addColorStop(0,['rgba(36,112,180,.17)','rgba(130,52,180,.13)','rgba(0,170,150,.09)'][i]);ng.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ng;ctx.fillRect(x-r,y-r,r*2,r*2);}ctx.restore();
  // scanlines sutis
  if(profile.label!=='BAIXO'){ctx.fillStyle='rgba(255,255,255,.018)';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);}
}
function drawHeroShipV12(cx,cy,s=1){
  const bob=Math.sin(Date.now()/520)*4;cy+=bob;const heroDef=SHIP_DEFS[selectedShip]||SHIP_DEFS[0];
  if(ShipSpriteManager.draw(selectedShip,cx,cy,82*s,{glow:heroDef.color,glowBlur:18*s}))return;
  ctx.save();ctx.translate(cx,cy);ctx.shadowColor='#00dcff';ctx.shadowBlur=22*s;
  const flame=14+Math.sin(Date.now()/55)*5;let fg=ctx.createLinearGradient(0,20*s,0,(34+flame)*s);fg.addColorStop(0,'#fff');fg.addColorStop(.35,'#00e5ff');fg.addColorStop(1,'rgba(0,98,255,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(-8*s,22*s);ctx.lineTo(0,(34+flame)*s);ctx.lineTo(8*s,22*s);ctx.closePath();ctx.fill();
  const body=ctx.createLinearGradient(-28*s,-30*s,28*s,30*s);body.addColorStop(0,'#82eeff');body.addColorStop(.35,'#1676ce');body.addColorStop(.7,'#173c86');body.addColorStop(1,'#6ee9ff');ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-36*s);ctx.lineTo(31*s,19*s);ctx.lineTo(12*s,14*s);ctx.lineTo(0,29*s);ctx.lineTo(-12*s,14*s);ctx.lineTo(-31*s,19*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#9ff5ff';ctx.lineWidth=1.5*s;ctx.stroke();ctx.shadowBlur=10*s;ctx.fillStyle='#d8fbff';ctx.beginPath();ctx.ellipse(0,-5*s,7*s,13*s,0,0,Math.PI*2);ctx.fill();ctx.restore();
}

drawStartScreen=function(){
  drawMenuBackdropV12();uiButtons={};const diff=currentDifficulty();const mobile=W<700;
  // cabeçalho
  ctx.textAlign='center';drawHeroShipV12(W/2,mobile?42:78,mobile?.58:.9);
  const titleY=mobile?105:170;ctx.save();ctx.shadowColor='#13d8ff';ctx.shadowBlur=18;ctx.fillStyle='#eafcff';ctx.font=`900 ${mobile?34:50}px Segoe UI,Arial`;ctx.fillText('NAVINHA',W/2,titleY);ctx.fillStyle='#35d7ff';ctx.font=`900 ${mobile?18:24}px Segoe UI,Arial`;ctx.letterSpacing='6px';ctx.fillText('A R C A D E',W/2,titleY+30);ctx.restore();
  ctx.fillStyle='#8098ab';ctx.font='11px Segoe UI,Arial';ctx.fillText('CAMPAIGN // 10 MISSÕES // v'+GAME_VERSION,W/2,titleY+53);

  const panelW=mobile?W-28:Math.min(650,W*.62), panelX=(W-panelW)/2, panelY=mobile?165:250;
  glassCard(panelX,panelY,panelW,mobile?100:108,diff.color,.04);
  ctx.fillStyle='#698195';ctx.font='10px Segoe UI,Arial';ctx.fillText('DIFICULDADE',W/2,panelY+22);
  uiButtons.diffLeft={x:panelX+14,y:panelY+(mobile?31:36),w:48,h:42};uiButtons.diffRight={x:panelX+panelW-62,y:panelY+(mobile?31:36),w:48,h:42};
  neonButton(uiButtons.diffLeft,'‹','',diff.color);neonButton(uiButtons.diffRight,'›','',diff.color);
  ctx.fillStyle=diff.color;ctx.font=`900 ${mobile?22:26}px Segoe UI,Arial`;ctx.fillText(diff.label,W/2,panelY+(mobile?58:66));
  const bestStars=starsByDifficulty[DIFFICULTIES[difficultyIndex]]||0;ctx.fillStyle='#ffd65a';ctx.font='16px Segoe UI,Arial';ctx.fillText(starString(bestStars),W/2,panelY+(mobile?84:91));

  const gap=10, rowY=panelY+(mobile?112:124), btnH=mobile?48:56, half=(panelW-gap)/2;
  uiButtons.shop={x:panelX,y:rowY,w:half,h:btnH};uiButtons.levelSelect={x:panelX+half+gap,y:rowY,w:half,h:btnH};
  neonButton(uiButtons.shop,'ARSENAL','UPGRADES + NAVES','#39e7ff',true);neonButton(uiButtons.levelSelect,'MISSÕES',unlockedLevel>1?'SELECIONAR FASE':'BLOQUEADO','#5cff9a',unlockedLevel>1);if(unlockedLevel<=1)uiButtons.levelSelect=null;

  const shipY=rowY+btnH+(mobile?10:14);glassCard(panelX,shipY,panelW,mobile?72:82,'rgba(88,210,255,.28)',.025);const sd=SHIP_DEFS[selectedShip]||SHIP_DEFS[0];
  uiButtons.shipLeft={x:panelX+10,y:shipY+(mobile?13:18),w:42,h:42};uiButtons.shipRight={x:panelX+panelW-52,y:shipY+(mobile?13:18),w:42,h:42};neonButton(uiButtons.shipLeft,'‹','','#59bfff');neonButton(uiButtons.shipRight,'›','','#59bfff');
  ctx.fillStyle=sd.color||'#0ff';ctx.font='800 16px Segoe UI,Arial';ctx.fillText(sd.name||'NAVE',W/2,shipY+(mobile?25:30));ctx.fillStyle='#73889a';ctx.font='10px Segoe UI,Arial';ctx.fillText(sd.desc||'',W/2,shipY+(mobile?43:51));ctx.fillStyle='#d7faff';ctx.font='11px Segoe UI,Arial';ctx.fillText('NAVE '+(selectedShip+1)+' / '+SHIP_DEFS.length,W/2,shipY+(mobile?60:69));

  const playY=shipY+(mobile?82:96);uiButtons.playButton={x:panelX,y:playY,w:panelW,h:mobile?56:68};
  ctx.save();ctx.shadowColor='#25f3ae';ctx.shadowBlur=24;let pg=ctx.createLinearGradient(panelX,playY,panelX+panelW,playY);pg.addColorStop(0,'#0a8d75');pg.addColorStop(.45,'#19cca1');pg.addColorStop(1,'#087d89');ctx.fillStyle=pg;roundRectPath(panelX,playY,panelW,uiButtons.playButton.h,15);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#8effdf';ctx.lineWidth=1.4;ctx.stroke();ctx.fillStyle='#fff';ctx.font=`900 ${mobile?21:24}px Segoe UI,Arial`;ctx.fillText('▶  INICIAR MISSÃO',W/2,playY+(mobile?35:43));ctx.restore();

  const checkpoint=typeof SaveManager!=='undefined'?SaveManager.read():null;
  const smallY=playY+uiButtons.playButton.h+(mobile?9:13), smallW=(panelW-gap)/2;uiButtons.settingsBtn={x:panelX,y:smallY,w:smallW,h:mobile?38:42};uiButtons.achievementsBtn={x:panelX+smallW+gap,y:smallY,w:smallW,h:mobile?38:42};neonButton(uiButtons.settingsBtn,'AJUSTES','','#718cff');neonButton(uiButtons.achievementsBtn,'CONQUISTAS','','#ffc857');
  if(checkpoint){uiButtons.continueRun={x:panelX,y:smallY+(mobile?43:47),w:panelW,h:34};neonButton(uiButtons.continueRun,'CONTINUAR FASE '+checkpoint.level,'CHECKPOINT (C)','#62e8ff',true);}
  ctx.fillStyle='#4b6173';ctx.font='10px Segoe UI,Arial';ctx.fillText(mobile?'Arraste para mover • tiro automático':'WASD/Setas • Espaço • Mouse opcional',W/2,Math.min(H-13,smallY+61));
};

// HUD/tiros com visual mais limpo e moderno.
const _drawHUDV11=drawHUD;
let _hudGradientV12=null;
drawHUD=function(){_drawHUDV11();if(gameState==='PLAYING'){ctx.save();const low=typeof GraphicsManager!=='undefined'&&GraphicsManager.effective()==='BAIXO';if(low){ctx.fillStyle='rgba(0,5,15,.22)';}else{if(!_hudGradientV12){_hudGradientV12=ctx.createLinearGradient(0,0,0,110);_hudGradientV12.addColorStop(0,'rgba(0,5,15,.34)');_hudGradientV12.addColorStop(1,'rgba(0,0,0,0)');}ctx.fillStyle=_hudGradientV12;}ctx.fillRect(0,0,W,110);ctx.restore();}};

// Flash do chefe centralizado em game.js para evitar desenho duplicado.
