// ================= NAVINHA ARCADE v1.2 =================
// Polimento visual, menu redesenhado e otimizações de impacto/boss.
const GAME_VERSION='2.2.7';

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
  const t=Date.now()*0.001;
  const g=ctx.createRadialGradient(W*.5,H*.22,10,W*.5,H*.36,Math.max(W,H)*.9);
  g.addColorStop(0,'#112a4a');g.addColorStop(.34,'#081325');g.addColorStop(1,'#01030a');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const profile=typeof GraphicsManager!=='undefined'?GraphicsManager.profile():{additive:true,label:'ALTO'};
  ctx.save();ctx.globalCompositeOperation=profile.additive?'screen':'source-over';
  const neb=[
    [.18,.28,.24,'rgba(36,112,180,.19)',Math.sin(t*.55)*22,Math.cos(t*.42)*18],
    [.72,.22,.20,'rgba(130,52,180,.14)',Math.cos(t*.38)*16,Math.sin(t*.44)*14],
    [.55,.72,.28,'rgba(0,170,150,.10)',Math.sin(t*.31)*20,Math.cos(t*.28)*16]
  ];
  neb.slice(0,profile.label==='BAIXO'?1:3).forEach(n=>{const x=n[0]*W+n[4],y=n[1]*H+n[5],rad=n[2]*Math.min(W,H);const ng=ctx.createRadialGradient(x,y,0,x,y,rad);ng.addColorStop(0,n[3]);ng.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ng;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);});
  ctx.restore();
  const layers=profile.label==='BAIXO'?2:3;
  for(let layer=0;layer<layers;layer++){const count=layer===0?38:(layer===1?26:16),speed=(layer+1)*18,size=layer===0?1:(layer===1?1.6:2.2);for(let i=0;i<count;i++){const seed=i*91.731+layer*17.13,x=(Math.sin(seed)*.5+.5)*W,y=((Math.cos(seed*1.7)*.5+.5)*H+(t*speed+seed*11))%(H+40)-20,tw=.5+.5*Math.sin(t*(2.8+layer)+seed*3.1);ctx.fillStyle=`rgba(255,255,255,${.25+.35*tw})`;ctx.fillRect(x,y,size,size);if(layer>0&&i%4===0){ctx.fillStyle='rgba(102,230,255,.12)';ctx.fillRect(x-1,y,size+2,.8);}}}
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<6;i++){const seed=i*47.31,x=((t*120+seed*22)%(W+220))-110,y=(.16+((i*23)%70)/100)*H,lg=ctx.createLinearGradient(x,y,x+84,y+84);lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(.5,'rgba(92,240,255,.12)');lg.addColorStop(1,'rgba(0,0,0,0)');ctx.strokeStyle=lg;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70,y+70);ctx.stroke();}
  ctx.restore();
  if(profile.label!=='BAIXO'){const fly=[[-90+((t*38)%(W+180)),H*.26,.62],[W+90-((t*28)%(W+180)),H*.62,.48]];fly.forEach(f=>{ctx.save();ctx.translate(f[0],f[1]);ctx.scale(f[2],f[2]);ctx.rotate(f[0]<W/2?.18:-.14);ctx.globalAlpha=.16;ctx.fillStyle='#8b9ab8';ctx.beginPath();ctx.moveTo(-34,0);ctx.lineTo(-8,-10);ctx.lineTo(26,-5);ctx.lineTo(34,0);ctx.lineTo(26,5);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.restore();});}
  if(profile.label!=='BAIXO'){ctx.fillStyle='rgba(255,255,255,.018)';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);const off=(t*18)%24;ctx.strokeStyle='rgba(67,223,255,.05)';ctx.lineWidth=1;for(let x=-24;x<W+24;x+=24){ctx.beginPath();ctx.moveTo(x+off,0);ctx.lineTo(x+off,H);ctx.stroke();}}
}
function drawHeroShipV12(cx,cy,s=1){
  const bob=Math.sin(Date.now()/520)*4;cy+=bob;const heroDef=SHIP_DEFS[selectedShip]||SHIP_DEFS[0];
  if(ShipSpriteManager.draw(selectedShip,cx,cy,82*s,{glow:heroDef.color,glowBlur:18*s}))return;
  ctx.save();ctx.translate(cx,cy);ctx.shadowColor='#00dcff';ctx.shadowBlur=22*s;
  const flame=14+Math.sin(Date.now()/55)*5;let fg=ctx.createLinearGradient(0,20*s,0,(34+flame)*s);fg.addColorStop(0,'#fff');fg.addColorStop(.35,'#00e5ff');fg.addColorStop(1,'rgba(0,98,255,0)');ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(-8*s,22*s);ctx.lineTo(0,(34+flame)*s);ctx.lineTo(8*s,22*s);ctx.closePath();ctx.fill();
  const body=ctx.createLinearGradient(-28*s,-30*s,28*s,30*s);body.addColorStop(0,'#82eeff');body.addColorStop(.35,'#1676ce');body.addColorStop(.7,'#173c86');body.addColorStop(1,'#6ee9ff');ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-36*s);ctx.lineTo(31*s,19*s);ctx.lineTo(12*s,14*s);ctx.lineTo(0,29*s);ctx.lineTo(-12*s,14*s);ctx.lineTo(-31*s,19*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#9ff5ff';ctx.lineWidth=1.5*s;ctx.stroke();ctx.shadowBlur=10*s;ctx.fillStyle='#d8fbff';ctx.beginPath();ctx.ellipse(0,-5*s,7*s,13*s,0,0,Math.PI*2);ctx.fill();ctx.restore();
}


let __uiSceneKeyV12='';
let __uiTransitionStartV12=0;
let __uiTransitionDurationV12=320;
function uiSceneKeyV12(){let extra='';if(typeof shopTab!=='undefined'&&gameState==='SHOP')extra=':'+shopTab;return String(gameState||'')+extra;}
function beginSceneTransitionV12(){__uiTransitionStartV12=Date.now();}
function trackSceneTransitionV12(){const key=uiSceneKeyV12();if(key!==__uiSceneKeyV12){__uiSceneKeyV12=key;beginSceneTransitionV12();}}
function drawUITransitionV12(){trackSceneTransitionV12();const elapsed=Date.now()-__uiTransitionStartV12;if(elapsed<0||elapsed>__uiTransitionDurationV12)return;const p=elapsed/__uiTransitionDurationV12;ctx.save();ctx.globalAlpha=(1-p)*.45;ctx.fillStyle='rgba(2,10,22,1)';ctx.fillRect(0,0,W,H);ctx.globalAlpha=(1-p)*.55;const scanX=(-W*.28)+(W*1.56)*p,grad=ctx.createLinearGradient(scanX,0,scanX+W*.26,0);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.5,'rgba(90,240,255,.40)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);ctx.restore();}
function drawHudIconV12(type,x,y,size,color){ctx.save();ctx.translate(x,y);const s=size||14;ctx.strokeStyle=color||'#90f8ff';ctx.fillStyle=color||'#90f8ff';ctx.lineWidth=1.6;
  if(type==='score'){ctx.beginPath();ctx.moveTo(-s*.55,0);ctx.lineTo(0,-s*.6);ctx.lineTo(s*.55,0);ctx.lineTo(0,s*.62);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s*.28);ctx.lineTo(0,s*.28);ctx.moveTo(-s*.22,0);ctx.lineTo(s*.22,0);ctx.stroke();}
  else if(type==='rescue'){ctx.beginPath();ctx.arc(0,-s*.2,s*.22,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,s*.46);ctx.moveTo(-s*.34,s*.18);ctx.lineTo(s*.34,s*.18);ctx.moveTo(-s*.18,s*.72);ctx.lineTo(0,s*.46);ctx.lineTo(s*.18,s*.72);ctx.stroke();}
  else if(type==='hull'){ctx.beginPath();ctx.moveTo(0,s*.52);ctx.lineTo(-s*.48,.06);ctx.lineTo(-s*.3,-s*.44);ctx.lineTo(0,-s*.2);ctx.lineTo(s*.3,-s*.44);ctx.lineTo(s*.48,.06);ctx.closePath();ctx.stroke();}
  else if(type==='weapon'){ctx.beginPath();ctx.moveTo(-s*.5,s*.16);ctx.lineTo(-s*.06,s*.16);ctx.lineTo(-s*.06,-s*.16);ctx.lineTo(s*.45,-s*.16);ctx.lineTo(s*.45,s*.16);ctx.lineTo(-s*.06,s*.16);ctx.stroke();ctx.beginPath();ctx.moveTo(s*.15,-s*.36);ctx.lineTo(s*.5,-s*.56);ctx.moveTo(s*.15,.36);ctx.lineTo(s*.5,.56);ctx.stroke();}
  else if(type==='shield'){ctx.beginPath();ctx.moveTo(0,-s*.58);ctx.lineTo(s*.42,-s*.34);ctx.lineTo(s*.3,s*.28);ctx.lineTo(0,s*.6);ctx.lineTo(-s*.3,s*.28);ctx.lineTo(-s*.42,-s*.34);ctx.closePath();ctx.stroke();}
  else if(type==='alert'){ctx.beginPath();ctx.arc(0,0,s*.55,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-s*.28);ctx.lineTo(0,s*.12);ctx.stroke();ctx.beginPath();ctx.arc(0,s*.32,1.4,0,Math.PI*2);ctx.fill();}
  ctx.restore();}

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
drawHUD=function(){
  if(gameState==='PLAYING'){
    ctx.save();
    const low=typeof GraphicsManager!=='undefined'&&GraphicsManager.effective()==='BAIXO';
    if(low){ctx.fillStyle='rgba(0,5,15,.18)';}
    else{if(!_hudGradientV12){_hudGradientV12=ctx.createLinearGradient(0,0,0,120);_hudGradientV12.addColorStop(0,'rgba(0,8,20,.36)');_hudGradientV12.addColorStop(.75,'rgba(0,0,0,.04)');_hudGradientV12.addColorStop(1,'rgba(0,0,0,0)');}ctx.fillStyle=_hudGradientV12;}
    ctx.fillRect(0,0,W,120);
    const scan=(Date.now()*.05)%(W+160)-80,gloss=ctx.createLinearGradient(scan,0,scan+120,0);gloss.addColorStop(0,'rgba(0,0,0,0)');gloss.addColorStop(.5,'rgba(110,245,255,.08)');gloss.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gloss;ctx.fillRect(0,0,W,82);ctx.restore();
  }
  _drawHUDV11();
  if(gameState==='PLAYING'){
    const leftW=Math.min(240,Math.max(170,W*.28)),rightW=Math.min(220,Math.max(150,W*.25)),centerGap=10,leftX=8,rightX=W-rightW-8,centerX=leftX+leftW+centerGap;
    drawHudIconV12('score',leftX+12,22,11,'#84f8ff');drawHudIconV12('rescue',leftX+leftW-106,34,10,'#75f5ff');drawHudIconV12('hull',rightX+12,24,11,'#ff97aa');drawHudIconV12('weapon',rightX+12,45,11,'#82f5ff');drawHudIconV12('shield',rightX+rightW-88,45,11,player.shield>0?'#8dfcff':'rgba(220,255,255,.45)');if(bossActive)drawHudIconV12('alert',centerX+22,36,12,'#ff7d7d');
    ctx.save();ctx.strokeStyle='rgba(102,235,255,.12)';ctx.lineWidth=1;[leftX+leftW+5,rightX-5].forEach(x=>{ctx.beginPath();ctx.moveTo(x,16);ctx.lineTo(x,60);ctx.stroke();});ctx.restore();
  }
};

// Flash do chefe centralizado em game.js para evitar desenho duplicado.
