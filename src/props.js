/* ---------- prop helpers ---------- */
const lm=(hex,extra)=>new THREE.MeshLambertMaterial(Object.assign({color:C(hex)},extra||{}));
function lathe(pts,seg,mat){const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg||24);return new THREE.Mesh(g,mat);}
function put(o,x,y,z,parent){o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;(parent||scene).add(o);return o;}
const lights=[];
function mkLight(color,dist,decay){const l=new THREE.PointLight(C(color),0,dist||20,decay||2);scene.add(l);lights.push(l);return l;}
const campAt=(dx,dz)=>{const x=CAMP.x+dx,z=CAMP.z+dz;return {x,z,y:terrainH(x,z)};};

/* ---------- camp: fire, tent, bedroll, pack, note ---------- */
const FIRE={x:CAMP.x,z:CAMP.z,y:CAMP.y,level:.25,target:.25,light:null,flames:[],embers:null};
{
  const f=FIRE;f.light=mkLight('#ff9a4a',22,1.6);f.light.position.set(f.x,f.y+1.1,f.z);
  const stoneM=lm('#8d8a82');
  for(let i=0;i<9;i++){const a=i/9*TAU,s=new THREE.Mesh(new THREE.SphereGeometry(.3,12,9),stoneM);s.scale.set(1.1,.7,1);put(s,f.x+Math.cos(a)*1.05,f.y+.1,f.z+Math.sin(a)*1.05);}
  const logM=lm('#5c4332');
  for(let i=0;i<3;i++){const g=lathe([[.001,-.7],[.14,-.65],[.16,0],[.14,.65],[.001,.7]],10,logM);g.rotation.z=Math.PI/2;g.rotation.y=i*2.1;g.position.set(f.x,f.y+.2+i*.05,f.z);g.castShadow=true;scene.add(g);}
  const emberM=new THREE.MeshBasicMaterial({color:C('#ff7a3a')});
  const em=new THREE.Mesh(new THREE.SphereGeometry(.55,14,8),emberM);em.scale.set(1,.28,1);em.position.set(f.x,f.y+.25,f.z);scene.add(em);f.embers=em;
  for(let i=0;i<5;i++){
    const m=new THREE.SpriteMaterial({map:glowTex,color:C(i<2?'#ffd27a':'#ff8a3c'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false});
    const s=new THREE.Sprite(m);s.position.set(f.x,f.y+.7,f.z);scene.add(s);f.flames.push({s,ph:i*1.3,off:i});
  }
}
const TENT=campAt(-3.6,-2.0);
{
  const m=lathe([[.001,2.35],[.5,1.9],[1.45,.5],[1.85,0]],28,lm('#d98b6c',{side:THREE.DoubleSide}));put(m,TENT.x,TENT.y,TENT.z);m.rotation.y=.6;
  const door=lathe([[.001,1.5],[.1,1.3],[.7,.2],[.9,0]],14,lm('#3a2a35'));door.scale.set(.5,.92,.5);put(door,TENT.x+Math.cos(.6+2.3)*1.25*.66,TENT.y,TENT.z+Math.sin(.6+2.3)*-1.25*.66);door.visible=false;
  const trim=new THREE.Mesh(new THREE.TorusGeometry(1.85,.07,8,32),lm('#f0dcb4'));trim.rotation.x=Math.PI/2;put(trim,TENT.x,TENT.y+.07,TENT.z);
  colliders.push({x:TENT.x,z:TENT.z,r:1.7});
}
const BED=campAt(1.9,1.5);
{
  const roll=lathe([[.001,-1.0],[.3,-.96],[.38,0],[.3,.96],[.001,1.0]],16,lm('#9fb0d0'));roll.rotation.z=Math.PI/2;roll.rotation.y=.5;roll.scale.set(1,1,1.15);put(roll,BED.x,BED.y+.2,BED.z);
  const pill=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),lm('#f0dcb4'));pill.scale.set(1.2,.6,1);put(pill,BED.x-.95,BED.y+.35,BED.z+.45);
}
const PACK=campAt(-1.2,2.6);
{
  const b=new THREE.Mesh(new THREE.SphereGeometry(.45,14,10),lm('#8a6a4a'));b.scale.set(1,1.15,.8);put(b,PACK.x,PACK.y+.5,PACK.z);b.rotation.y=.8;
  const fl=new THREE.Mesh(new THREE.SphereGeometry(.34,12,8,0,TAU,0,Math.PI/2),lm('#6e5240'));fl.scale.set(1,.9,.8);put(fl,PACK.x,PACK.y+.66,PACK.z);fl.rotation.y=.8;
}
const NOTE=campAt(2.9,-.9);
{
  const log=lathe([[.001,-.6],[.3,-.55],[.34,0],[.3,.55],[.001,.6]],12,lm('#6e5240'));log.rotation.z=Math.PI/2;put(log,NOTE.x,NOTE.y+.3,NOTE.z);
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(.42,.32),new THREE.MeshLambertMaterial({color:C('#f3e5c4'),side:THREE.DoubleSide}));paper.rotation.set(-Math.PI/2,0,.4);put(paper,NOTE.x,NOTE.y+.64,NOTE.z);NOTE.mesh=paper;
}

/* ---------- the lantern ---------- */
const LANTERN=new THREE.Group();LANTERN.userData={lit:false,glow:0};
{
  const metal=lm('#3b2f33'),brass=lm('#c9a24f');
  LANTERN.add(lathe([[.001,0],[.13,0],[.15,.03],[.15,.06],[.001,.06]],12,metal));
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(.115,.13,.22,12,1,true),new THREE.MeshBasicMaterial({color:C('#6a5a46'),transparent:true,opacity:.9}));glass.position.y=.17;LANTERN.add(glass);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:C('#ffd27a')}));core.position.y=.16;core.visible=false;LANTERN.add(core);
  const cap=lathe([[.001,.34],[.05,.34],[.14,.29],[.15,.28],[.001,.28]],12,brass);LANTERN.add(cap);
  const h=new THREE.Mesh(new THREE.TorusGeometry(.09,.012,6,16,Math.PI),brass);h.position.y=.34;LANTERN.add(h);
  const lt=mkLight('#ffcf80',16,1.8);lt.position.y=.2;LANTERN.add(lt);
  LANTERN.userData={lit:false,glow:0,glass,core,light:lt};
}
const LANT_HOME=campAt(-1.1,1.3);LANTERN.position.set(LANT_HOME.x,LANT_HOME.y,LANT_HOME.z);scene.add(LANTERN);
function setLanternLit(v){const u=LANTERN.userData;u.lit=v;u.core.visible=v;u.glass.material.color.set(v?C('#ffd89a'):C('#6a5a46'));}

/* ---------- three old stone lamps ---------- */
const LAMPOBJ=LAMPS.map((L,i)=>{
  const stone=lm('#a6a39a'),mossy=lm('#86a06a');
  const base=lathe([[.001,0],[.55,0],[.6,.1],[.5,.25],[.3,.35],[.24,1.0],[.3,1.15],[.001,1.15]],20,stone);put(base,L.x,L.y,L.z);
  const m=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10,0,TAU,0,Math.PI/2),mossy);m.scale.set(1,.5,1);put(m,L.x,L.y+.05,L.z);m.scale.set(1.9,.8,1.9);
  const box=lathe([[.001,1.15],[.34,1.15],[.34,1.7],[.001,1.7]],14,stone);put(box,L.x,L.y,L.z);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),new THREE.MeshBasicMaterial({color:C('#ffd27a')}));glow.position.set(L.x,L.y+1.43,L.z);glow.visible=false;scene.add(glow);
  const roof=lathe([[.001,2.15],[.15,1.95],[.5,1.7],[.3,1.7]],14,stone);put(roof,L.x,L.y,L.z);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C('#ffc070'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));halo.scale.set(6,6,1);halo.position.set(L.x,L.y+1.43,L.z);scene.add(halo);
  const lt=mkLight('#ffbf70',24,1.7);lt.position.set(L.x,L.y+1.5,L.z);
  colliders.push({x:L.x,z:L.z,r:.6});
  return {x:L.x,y:L.y,z:L.z,lit:false,k:0,glow,halo,lt};
});
function lightLamp(i){LAMPOBJ[i].lit=true;LAMPOBJ[i].glow.visible=true;}

/* ---------- lighthouse, cottage and bell ---------- */
const LHO={beam:[],lit:false,k:0,room:null,lt:null};
{
  const wh=lm('#f1e6d2'),rose=lm('#d9826c'),dark=lm('#3e3140');
  const tower=lathe([[.001,0],[3.2,0],[3.1,2],[2.6,10],[2.25,16.5],[.001,16.5]],32,wh);put(tower,LH.x,LH.y,LH.z);
  for(const [y,h] of [[3.2,2.2],[8.2,2.2],[13,1.8]]){
    const r0=3.2-(3.2-2.25)*(y/16.5)+.02,r1=3.2-(3.2-2.25)*((y+h)/16.5)+.02;
    put(lathe([[r0,y],[r1,y+h]],32,new THREE.MeshLambertMaterial({color:C('#d9826c'),side:THREE.DoubleSide})),LH.x,LH.y,LH.z);
  }
  put(lathe([[2.2,16.5],[3.0,16.7],[3.2,16.9],[2.9,17.1],[2.2,17.1]],32,dark),LH.x,LH.y,LH.z);
  const room=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,2.2,20,1,true),new THREE.MeshBasicMaterial({color:C('#35303f'),transparent:true,opacity:.85,side:THREE.DoubleSide}));
  room.position.set(LH.x,LH.y+18.1,LH.z);scene.add(room);LHO.room=room;
  put(lathe([[.001,20.6],[.4,20.35],[1.9,19.2],[2.0,19.1],[.001,19.1]],24,rose),LH.x,LH.y,LH.z);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),dark);put(ball,LH.x,LH.y+20.75,LH.z);
  const door=new THREE.Mesh(new THREE.SphereGeometry(.95,14,8,0,TAU,0,Math.PI/2),lm('#7a5a45'));door.scale.set(1,1.5,.3);door.position.set(LH.x,LH.y,LH.z+3.15);scene.add(door);
  for(const wy of[6.5,11.5]){const w=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),new THREE.MeshBasicMaterial({color:C('#3b3548')}));w.scale.set(1,1.4,.3);w.position.set(LH.x,LH.y+wy,LH.z+2.7);scene.add(w);}
  const lt=mkLight('#ffe2a0',90,1.3);lt.position.set(LH.x,LH.y+18.2,LH.z);LHO.lt=lt;
  for(let k=0;k<2;k++){
    const m=new THREE.MeshBasicMaterial({color:C('#ffe8b0'),transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const c=new THREE.Mesh(new THREE.ConeGeometry(2.4,38,16,1,true),m);c.geometry.translate(0,-19,0);c.geometry.rotateZ(Math.PI/2);
    const g=new THREE.Group();g.add(c);g.position.set(LH.x,LH.y+18.1,LH.z);g.rotation.y=k*Math.PI;scene.add(g);LHO.beam.push({g,m});
  }
  colliders.push({x:LH.x,z:LH.z,r:3.4});
}
const COT=(()=>{const x=LH.x-8.5,z=LH.z+3.5;return {x,z,y:terrainH(x,z)};})();
const COTO={smoke:[],win:[]};
{
  const body=lathe([[.001,0],[3.0,0],[3.0,2.5],[.001,2.5]],24,lm('#efe0c4'));put(body,COT.x,COT.y,COT.z);
  const roof=lathe([[.001,4.6],[.6,4.1],[3.5,2.4],[3.4,2.3],[.001,2.3]],24,lm('#c9735a'));put(roof,COT.x,COT.y,COT.z);
  const ch=lathe([[.35,2.8],[.35,5.0],[.001,5.0]],10,lm('#b9a58d'));put(ch,COT.x+1.3,COT.y,COT.z-.8);
  const dr=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8,0,TAU,0,Math.PI/2),lm('#7a5a45'));dr.scale.set(1,1.5,.3);put(dr,COT.x,COT.y,COT.z+2.95);
  for(const sx of[-1.7,1.7]){const w=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),new THREE.MeshBasicMaterial({color:C('#ffcf7a')}));w.scale.set(1,1.2,.3);w.position.set(COT.x+sx*.8,COT.y+1.4,COT.z+2.85);scene.add(w);COTO.win.push(w);w.material.color.multiplyScalar(.35);}
  for(let i=0;i<7;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C('#f4efe8'),transparent:true,opacity:0,depthWrite:false}));scene.add(s);COTO.smoke.push({s,p:i/7});}
  colliders.push({x:COT.x,z:COT.z,r:3.2});
}
const BELLP=(()=>{const x=LH.x+5.6,z=LH.z+4.4;return {x,z,y:terrainH(x,z)};})();
const BELL={swing:0,t:0,g:new THREE.Group()};
{
  const wood=lm('#7a5a45'),brass=lm('#d1a850');
  for(const sx of[-1,1])put(lathe([[.001,0],[.14,0],[.12,2.6],[.001,2.6]],8,wood),BELLP.x+sx*.9,BELLP.y,BELLP.z);
  const bar=lathe([[.001,-1],[.1,-.95],[.1,.95],[.001,1]],8,wood);bar.rotation.z=Math.PI/2;put(bar,BELLP.x,BELLP.y+2.55,BELLP.z);
  const bell=lathe([[.001,.0],[.1,.02],[.2,-.2],[.34,-.55],[.38,-.62],[.001,-.62]],20,brass);BELL.g.add(bell);
  const clap=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),lm('#6b4f2f'));clap.position.y=-.7;BELL.g.add(clap);
  BELL.g.position.set(BELLP.x,BELLP.y+2.5,BELLP.z);scene.add(BELL.g);
  colliders.push({x:BELLP.x-.9,z:BELLP.z,r:.2},{x:BELLP.x+.9,z:BELLP.z,r:.2});
}

/* ---------- stepping stones across the stream ---------- */
const STONES=[];
{
  const m=lm('#9d9a90');
  for(let i=-2;i<=2;i++){const x=CROSS.x+CROSS.tx*i*1.15+(i%2)*.1,z=CROSS.z+CROSS.tz*i*1.15,s=sample(x,z);
    const st=new THREE.Mesh(new THREE.SphereGeometry(.62,14,8),m);st.scale.set(1.15,.3,1);put(st,x,Math.max(s.wy+.1,s.h)+.0,z);st.rotation.y=i;STONES.push({x,z,y:Math.max(s.wy+.1,s.h)+.12});}
}

/* ---------- little sparkles that hint at what can be touched ---------- */
const sparkles=[];
function makeSparkle(x,y,z){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C('#fff0c0'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.9,fog:false}));
  s.scale.set(.55,.55,1);s.position.set(x,y,z);scene.add(s);const o={s,y,on:true,ph:rr(0,6)};sparkles.push(o);return o;
}

/* ---------- per frame ---------- */
function propsUpdate(t,dt,dawn){
  const f=FIRE;f.level+=(f.target-f.level)*Math.min(1,dt*1.6);
  const fl=f.level,fk=.82+.18*Math.sin(t*13)+.08*Math.sin(t*23.7);
  f.light.intensity=(1.0+fl*3.6)*fk*(1-.55*dawn);f.light.position.set(f.x+Math.sin(t*3)*.08,f.y+1.0+fl*.4,f.z);
  f.embers.material.color.setRGB(1,.35+.15*Math.sin(t*5),.12).multiplyScalar(.5+.5*fl);
  f.flames.forEach((q,i)=>{const w=Math.sin(t*9+q.ph),h=.25+fl*(1.0+.35*w+(i%3)*.2);q.s.scale.set((.4+fl*.55)*(1-i*.08),h,1);q.s.position.set(f.x+Math.sin(t*4+q.ph)*.08*fl,f.y+.35+h*.38,f.z+Math.cos(t*3.3+q.ph)*.08*fl);q.s.material.opacity=.15+fl*.85;});
  const L=LANTERN.userData;L.glow+=((L.lit?1:0)-L.glow)*Math.min(1,dt*2.5);
  L.light.intensity=L.glow*(1.5+.18*Math.sin(t*11)+.1*Math.sin(t*17.3))*(1-.35*dawn);
  LAMPOBJ.forEach((o,i)=>{o.k+=((o.lit?1:0)-o.k)*Math.min(1,dt*1.8);o.lt.intensity=o.k*(3.0+.2*Math.sin(t*9+i))*(1-.55*dawn);o.halo.material.opacity=o.k*.75*(1-.4*dawn);});
  LHO.k+=((LHO.lit?1:0)-LHO.k)*Math.min(1,dt*.5);
  LHO.lt.intensity=LHO.k*5.5*(1-.5*dawn);
  LHO.room.material.color.setRGB(.2+LHO.k*.8,.19+LHO.k*.7,.25+LHO.k*.3);
  LHO.beam.forEach((b,i)=>{b.g.rotation.y=t*.45+i*Math.PI;b.m.opacity=LHO.k*.2*(1-.6*dawn);});
  COTO.win.forEach(w=>w.material.color.copy(C('#ffcf7a')).multiplyScalar(.3+.7*(1-dawn)));
  COTO.smoke.forEach(q=>{q.p=(q.p+dt*.08)%1;const p=q.p;q.s.position.set(COT.x+1.3+p*2.5+Math.sin(p*7)*.3,COT.y+5.2+p*6,COT.z-.8+Math.cos(p*5)*.3);q.s.scale.setScalar(.8+p*3.4);q.s.material.opacity=Math.sin(p*Math.PI)*.22;});
  BELL.t+=dt;BELL.swing*=Math.pow(.35,dt);BELL.g.rotation.z=Math.sin(BELL.t*5.5)*BELL.swing;
  sparkles.forEach(o=>{o.s.visible=o.on;if(!o.on)return;o.s.position.y=o.y+Math.sin(t*2+o.ph)*.08;const k=.5+.5*Math.sin(t*3+o.ph);o.s.scale.setScalar(.4+.35*k);o.s.material.opacity=.45+.5*k;});
  NOTE.mesh.rotation.z=.4+Math.sin(t*.9)*.01;
}
