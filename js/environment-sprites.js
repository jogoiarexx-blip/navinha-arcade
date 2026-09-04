// Sprites leves compartilhados por decoração e hazards. Mantêm fallback
// procedural nos módulos originais caso uma imagem não esteja disponível.
const ENVIRONMENT_SPRITES = {
    asteroid:{file:'assets/environment/asteroide.webp',glow:'#ff9f43'},
    mine:{file:'assets/environment/mina-espacial.webp',glow:'#ff3030'},
    shard:{file:'assets/environment/fragmento-gelo.webp',glow:'#6de8ff'},
    laserEmitter:{file:'assets/environment/emissor-laser.webp',glow:'#36eaff'},
    nebula:{file:'assets/environment/nebulosa.webp',glow:'#ff35ee'},
    crystal:{file:'assets/environment/cristal-ambiental.webp',glow:'#6de8ff'},
    core:{file:'assets/environment/nucleo-energia.webp',glow:'#ff7b18'},
    planet:{file:'assets/environment/planeta.webp',glow:'#568cff'}
};

const EnvironmentSpriteManager=(()=>{
    const keyFor=name=>'environment-'+name;
    function loadAll(){return Promise.allSettled(Object.entries(ENVIRONMENT_SPRITES).map(([name,def])=>AssetManager.loadSharedImage(keyFor(name),def.file)));}
    function get(name){return AssetManager.getSharedImage(keyFor(name));}
    function draw(name,cx,cy,w,h,options){
        const def=ENVIRONMENT_SPRITES[name],image=def&&get(name);
        if(!image||!image.naturalWidth||!image.naturalHeight)return false;
        const opts=options||{},profile=GraphicsManager.profile();
        ctx.save();ctx.translate(cx,cy);ctx.rotate(opts.rotation||0);ctx.globalAlpha=opts.alpha===undefined?1:opts.alpha;
        ctx.imageSmoothingEnabled=false;
        if(profile.glows&&opts.glow!==false){ctx.shadowColor=opts.color||def.glow;ctx.shadowBlur=Math.min(opts.glowBlur||8,profile.glowCap||8);}
        if(opts.flipX)ctx.scale(-1,1);
        ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();return true;
    }
    return{loadAll,get,draw};
})();
EnvironmentSpriteManager.loadAll().catch(error=>console.warn('[EnvironmentSpriteManager]',error));
