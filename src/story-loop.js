/* ---------- dawn: the world brightens as lamps are lit ---------- */
const K0={top:'#34447a',mid:'#8c78a8',hor:'#f4a27f',sun:'#ffb27c',sunI:1.15,hemiS:'#8fa0d8',hemiG:'#4a3f4e',hemiI:.62,fog:'#cf9488',fogD:.017,exp:.95,sunH:.10};
const K1={top:'#5b9ae0',mid:'#a9d0f2',hor:'#ffe6c2',sun:'#fff0d2',sunI:2.3,hemiS:'#c3dcff',hemiG:'#8a9a62',hemiI:.95,fog:'#ecdcc4',fogD:.0095,exp:1.08,sunH:.52};
const KC={};for(const k of['top','mid','hor','sun','hemiS','hemiG','fog']){KC[k]=[new THREE.Color(K0[k]),new THREE.Color(K1[k])];}
const _c=new THREE.Color(),sunDir=new THREE.Vector3(),SEA0=C('#6c7ca2'),SEA1=C('#a9c4e2'),WAT0=C('#7f90aa'),WAT1=C('#ffffff');
const mixc=(k,d)=>_c.copy(KC[k][0]).lerp(KC[k][1],d);
function applyDawn(d){
  const e=smooth(0,1,d);
  skyU.top.value.copy(mixc('top',e));skyU.mid.value.copy(mixc('mid',e));skyU.hor.value.copy(mixc('hor',e));
  const sh=lerp(K0.sunH,K1.sunH,e);sunDir.set(.32,sh,-1).normalize();skyU.sunDir.value.copy(sunDir);
  skyU.sunCol.value.copy(mixc('sun',e));skyU.stars.value=clamp(1-e*1.9,0,1);
  sun.color.copy(mixc('sun',e));sun.intensity=lerp(K0.sunI,K1.sunI,e);
  hemi.color.copy(mixc('hemiS',e));hemi.groundColor.copy(mixc('hemiG',e));hemi.intensity=lerp(K0.hemiI,K1.hemiI,e);
  scene.fog.color.copy(mixc('fog',e));scene.fog.density=lerp(K0.fogD,K1.fogD,e);
  renderer.toneMappingExposure=lerp(K0.exp,K1.exp,e);
  sun.position.set(P.x,P.y,P.z).addScaledVector(sunDir,110);sun.target.position.set(P.x,P.y,P.z);sun.target.updateMatrixWorld();
  sunGlow.position.copy(camera.position).addScaledVector(sunDir,480);sunGlow.material.color.copy(mixc('sun',e));sunGlow.material.opacity=lerp(.85,.55,e);
  seaMat.color.copy(SEA0).lerp(SEA1,e);waterMat.color.copy(WAT0).lerp(WAT1,e);
  cloudMats.forEach(m=>{m.color.copy(mixc('hor',e)).lerp(new THREE.Color(1,1,1),.35);m.opacity=lerp(.4,.8,e);});
}

/* ---------- words on screen ---------- */
let capUntil=0,objLast='';
function say(text,secs){const c=$('cap');c.textContent=text;c.classList.add('on');capUntil=S.t+(secs||5);}
function setObj(text){if(text===objLast)return;objLast=text;const o=$('obj');if(!text){o.classList.remove('on');return;}$('objtxt').textContent=text;o.classList.add('on');}
const prompt_=$('prompt');let promptLast='';
function setPrompt(label){if(label===promptLast)return;promptLast=label;prompt_.innerHTML=label?'<b>E</b>'+label:'';prompt_.classList.toggle('on',!!label);}

/* ---------- things you can touch ---------- */
const SP={note:makeSparkle(NOTE.x,NOTE.y+1.1,NOTE.z),lantern:makeSparkle(LANT_HOME.x,LANT_HOME.y+.95,LANT_HOME.z),fire:makeSparkle(FIRE.x,FIRE.y+2.0,FIRE.z),bell:makeSparkle(BELLP.x,BELLP.y+3.5,BELLP.z)};
const LSP=LAMPOBJ.map(o=>makeSparkle(o.x,o.y+2.6,o.z));
const OBJ_LAMP=['Follow the little fox down the path to the first old lamp','Another old lamp waits farther along the path','One last lamp, close to the sea'];
const IA=[
  {x:NOTE.x,z:NOTE.z,r:3,label:'Read the note',sp:SP.note,ok:()=>S.step===1,go(){S.letter=true;$('letter').hidden=false;}},
  {x:LANT_HOME.x,z:LANT_HOME.z,r:2.6,label:'Take the lantern',sp:SP.lantern,ok:()=>S.step===2,go(){
    TRAV.arms[1].add(LANTERN);LANTERN.position.set(0,-.78,.04);TRAV.heldLantern=true;S.step=3;
    setObj('Light your lantern at the fire');say('It is still cold, but it fits your hand as if it had always been there.',5);}},
  {x:FIRE.x,z:FIRE.z,r:3.6,label:'Light your lantern',sp:SP.fire,ok:()=>S.step===3,go(){
    setLanternLit(true);FIRE.target=1;S.fireFlare=S.t+4;S.step=4;chime();
    setObj(OBJ_LAMP[0]);say('A small, steady flame. Over by the path, the fox gets to its feet.',6);}},
  ...LAMPOBJ.map((o,i)=>({x:o.x,z:o.z,r:3.4,label:'Wake the old lamp',sp:LSP[i],ok:()=>S.step===4&&S.lamps===i,go(){
    lightLamp(i);S.lamps=i+1;chime();
    const lines=['The first lamp wakes. Somewhere nearby, a bird tries a single note.','The second lamp hums awake. The grass seems to lean toward the light.','The last lamp glows. Far below, the lighthouse turns its head.'];
    say(lines[i],6);
    if(S.lamps===3){LHO.lit=true;S.step=5;setObj('Walk down to the lighthouse and ring the bell');}else setObj(OBJ_LAMP[S.lamps]);}})),
  {x:BELLP.x,z:BELLP.z,r:3.8,label:'Ring the bell',sp:SP.bell,ok:()=>S.step===5&&!S.rang,go(){
    S.rang=true;BELL.swing=.55;bellSound();setObj('');say('The sound rolls out over the water, and the sun climbs to meet it.',7);S.endT=S.t+9;}}
];
function pressE(){
  if(S.mode!=='play')return;
  if(S.letter){S.letter=false;$('letter').hidden=true;if(S.step===1){S.step=2;setObj('Take the lantern waiting by your tent');say('Three old lamps. A fox who pretends not to know the way.',5);}return;}
  if(S.wake<1)return;
  const a=nearIA();if(a)a.go();
}
function nearIA(){let best=null,bd=1e9;for(const a of IA){if(!a.ok())continue;const d=Math.hypot(P.x-a.x,P.z-a.z);if(d<a.r&&d<bd){bd=d;best=a;}}return best;}

/* ---------- the fox leads the way ---------- */
const PATH_LEN=pathCurve.getLength();
const FX={t:.03,side:2.2,x:0,z:0,moving:false,face:0};
{const p=pathAt(FX.t,FX.side);FX.x=p.x;FX.z=p.z;}
function foxAI(dt){
  let goal=.03;
  if(S.step>=4){goal=S.lamps<3?LAMP_T[S.lamps]-.012:.965;}
  const pd=Math.hypot(P.x-FX.x,P.z-FX.z),np=nearestPath(P.x,P.z);
  let sp=0;
  if(FX.t<goal-.004&&(pd<12||np.t>FX.t+.03)){sp=pd>14?6.5:3.9;FX.t=Math.min(goal,FX.t+sp*dt/PATH_LEN);}
  FX.moving=sp>0;
  const side=FX.side*(FX.moving?1:.8);
  const p=pathAt(FX.t,side),dx=p.x-FX.x,dz=p.z-FX.z;
  FX.x+=dx*Math.min(1,dt*6);FX.z+=dz*Math.min(1,dt*6);
  let tf;if(FX.moving||Math.hypot(dx,dz)>.05)tf=Math.atan2(dx,dz);else tf=Math.atan2(P.x-FX.x,P.z-FX.z);
  let df=tf-FX.face;while(df>Math.PI)df-=TAU;while(df<-Math.PI)df+=TAU;FX.face+=df*Math.min(1,dt*5);
  FOX.g.position.set(FX.x,terrainH(FX.x,FX.z),FX.z);FOX.g.rotation.y=FX.face;
  foxUpdate(dt,FX.moving?3.4:0,S.t);
}

/* ---------- one frame ---------- */
function frame(dt,skip){
  S.t+=dt;U.time.value=S.t;
  if(S.mode==='play'&&S.wake<1){
    S.wake=Math.min(1,S.wake+dt/7.5);TRAV.lie=1-smooth(.36,.8,S.wake);
    if(S.wake>.05&&S.step===0&&!S.said0){S.said0=true;say('Cold ash. A grey light on the tent. The air smells of dew and woodsmoke.',5);}
    if(S.wake>=1&&S.step===0){S.step=1;setObj('A note has been left by the log');}
  }
  const s=movePlayer(dt);
  TRAV.g.position.set(P.x,P.y,P.z);TRAV.g.rotation.y=S.mode==='play'||S.wake>0?P.face:2.02;
  if(S.mode!=='play'&&S.wake===0)TRAV.g.rotation.y=2.02;
  travUpdate(dt,P.speed,P.wade);
  if(TRAV.heldLantern)LANTERN.rotation.x=-TRAV.arms[1].rotation.x;
  if(S.fireFlare&&S.t>S.fireFlare){FIRE.target=.6;S.fireFlare=0;}
  S.dawnT=.1+.26*S.lamps+(S.rang?.12:0);S.dawn+=(S.dawnT-S.dawn)*Math.min(1,dt*.35);
  foxAI(dt);
  propsUpdate(S.t,dt,S.dawn);natureUpdate(S.t,dt,P.x,P.z,S.dawn);
  wTexA.offset.y-=dt*.18;wTexB.offset.x=S.t*.004;wTexB.offset.y=S.t*.002;
  updateCamera(dt);applyDawn(S.dawn);
  audioUpdate(S.t,dt,s.ds,s.sf,S.dawn);
  // prompts and sparkles
  IA.forEach(a=>{a.sp.on=a.ok()&&S.mode==='play'&&!S.letter;});
  const near=(S.mode==='play'&&!S.letter&&S.wake>=1)?nearIA():null;setPrompt(near?near.label:S.letter?'':'');
  if(S.letter)setPrompt('');
  if(S.t>capUntil)$('cap').classList.remove('on');
  if(S.rang&&!S.ended&&S.t>S.endT){S.ended=true;const e=$('endcard');e.hidden=false;requestAnimationFrame(()=>e.classList.add('on'));if(document.exitPointerLock)document.exitPointerLock();}
  if(!skip)renderer.render(scene,camera);
}

/* ---------- buttons and start ---------- */
$('begin').addEventListener('click',()=>{
  audioInit();$('intro').hidden=true;S.mode='play';S.wake=0;canvas.focus();
});
$('keep').addEventListener('click',()=>{const e=$('endcard');e.classList.remove('on');setTimeout(()=>{e.hidden=true;},300);S.free=true;setObj('Wander as long as you like');say('Nothing left to do but look around.',5);});
$('snd').addEventListener('click',()=>{S.sound=!S.sound;$('snd').textContent='Sound: '+(S.sound?'on':'off');});
let last=performance.now();
function loop(now){requestAnimationFrame(loop);if(window.__hold){last=now;return;}const dt=Math.min(.05,(now-last)/1000);last=now;frame(dt);}
window.__vale={S,P,FX,TRAV,FOX,IA,LAMPOBJ,LHO,frame,
  step(dt,n){n=n||1;for(let i=0;i<n;i++)frame(dt,i<n-1);},
  tp(x,z,y){P.x=x;P.z=z;P.y=terrainH(x,z);if(y!==undefined)yaw=y;},
  pathAt,nearestPath,CROSS,LAMPS,LH,BELLP,terrainH,
  setYaw(v,p){yaw=v;if(p!==undefined)pitch=p;},press:pressE,keys};
frame(.016);
requestAnimationFrame(loop);
