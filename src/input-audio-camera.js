/* ---------- input ---------- */
const keys={};let yaw=Math.atan2(-.6,.8),pitch=.28,dragging=false,locked=false;
const S={mode:'title',t:0,wake:0,step:0,lamps:0,rang:false,letter:false,dawn:.1,dawnT:.1,ended:false,free:false,endT:0,foxGoal:0,sound:true};
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)pressE();if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;});
canvas.addEventListener('mousedown',e=>{dragging=true;if(S.mode==='play'&&!locked){try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(_){}}});
addEventListener('mouseup',()=>{dragging=false;});
addEventListener('mousemove',e=>{if(S.mode!=='play'||S.letter)return;if(locked||dragging){yaw-=e.movementX*.0032;pitch=clamp(pitch+e.movementY*.0028,-.25,1.1);}});

/* ---------- sound: everything is synthesized ---------- */
const AU={ctx:null};
function audioInit(){
  if(AU.ctx)return;
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();AU.ctx=ctx;
    const master=ctx.createGain();master.gain.value=AU_ON()?.85:0;master.connect(ctx.destination);AU.master=master;
    const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;AU.nb=nb;
    const ib=ctx.createBuffer(2,ctx.sampleRate*3,ctx.sampleRate);for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.6);}
    const conv=ctx.createConvolver();conv.buffer=ib;const rg=ctx.createGain();rg.gain.value=.7;conv.connect(rg);rg.connect(master);AU.rev=conv;
    const loopNoise=(type,f,q,g)=>{const s=ctx.createBufferSource();s.buffer=nb;s.loop=true;const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;const gg=ctx.createGain();gg.gain.value=0;s.connect(b);b.connect(gg);gg.connect(master);s.start();return {g:gg,f:b};};
    AU.wind=loopNoise('bandpass',420,.5);AU.stream=loopNoise('bandpass',2200,.7);
    AU.next={pad:0,pluck:2,bird:3};AU.chord=0;
  }catch(_){AU.ctx=null;}
}
function AU_ON(){return S.sound;}
function tone(freq,when,dur,gain,type,dest,attack){
  const ctx=AU.ctx;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.value=freq;
  const a=attack||.01;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(gain,when+a);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
  o.connect(g);g.connect(dest||AU.master);if(dest!==AU.rev&&AU.rev){const s=ctx.createGain();s.gain.value=.5;g.connect(s);s.connect(AU.rev);}o.start(when);o.stop(when+dur+.1);
}
const mtof=m=>440*Math.pow(2,(m-69)/12);
const PENT=[62,64,66,69,71,74,76,78];
function chime(){if(!AU.ctx)return;const t=AU.ctx.currentTime;[74,78,81,86].forEach((m,i)=>tone(mtof(m),t+i*.14,3.2,.07,'sine'));}
function bellSound(){if(!AU.ctx)return;const t=AU.ctx.currentTime;[[1,.16,7],[2.01,.09,5],[2.76,.07,4],[4.1,.04,3],[5.4,.03,2.2]].forEach(([r,g,d])=>tone(196*r,t,d,g,'sine'));}
function stepSound(wet){if(!AU.ctx)return;const ctx=AU.ctx,t=ctx.currentTime,s=ctx.createBufferSource();s.buffer=AU.nb;s.playbackRate.value=.9+Math.random()*.3;
  const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=wet?1300:480+Math.random()*120;f.Q.value=wet?.6:.9;const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(wet?.09:.06,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+(wet?.22:.12));
  s.connect(f);f.connect(g);g.connect(AU.master);s.start(t,Math.random(),.3);}
function chirp(){const ctx=AU.ctx,t=ctx.currentTime,base=2300+Math.random()*1800,n=2+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){const o=ctx.createOscillator(),g=ctx.createGain(),t0=t+i*.11;o.frequency.setValueAtTime(base,t0);o.frequency.exponentialRampToValueAtTime(base*(1.2+Math.random()*.3),t0+.07);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.025,t0+.015);g.gain.exponentialRampToValueAtTime(.0001,t0+.09);o.connect(g);g.connect(AU.master);o.start(t0);o.stop(t0+.12);}}
const CHORDS=[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]];
function audioUpdate(t,dt,ds,sf,dawn){
  if(!AU.ctx)return;const ctx=AU.ctx;if(ctx.state==='suspended')ctx.resume();
  AU.master.gain.setTargetAtTime(S.sound?.85:0,ctx.currentTime,.2);
  AU.wind.g.gain.setTargetAtTime(.05+.035*Math.sin(t*.23)+.03*dawn,ctx.currentTime,.5);AU.wind.f.frequency.setTargetAtTime(340+160*Math.sin(t*.17+1),ctx.currentTime,1);
  AU.stream.g.gain.setTargetAtTime(.13*Math.exp(-ds*ds/70)*sf,ctx.currentTime,.3);
  const now=ctx.currentTime;
  if(t>AU.next.pad){AU.next.pad=t+13;const ch=CHORDS[AU.chord++%CHORDS.length];ch.forEach((m,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type='triangle';o.frequency.value=mtof(m)+(i-1.5)*.4;f.type='lowpass';f.frequency.value=900;
    g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.022+.014*dawn,now+4);g.gain.linearRampToValueAtTime(0,now+15);o.connect(f);f.connect(g);g.connect(AU.master);g.connect(AU.rev);o.start(now);o.stop(now+15.5);});}
  if(t>AU.next.pluck){AU.next.pluck=t+2.5+Math.random()*5;if(Math.random()<.55+.3*dawn){const m=PENT[Math.floor(Math.random()*PENT.length)];tone(mtof(m),now,2.6,.05,'triangle');}}
  if(dawn>.22&&t>AU.next.bird){AU.next.bird=t+1.6+Math.random()*(5-dawn*3);chirp();}
}

/* ---------- the walker ---------- */
const P={x:BED.x-.2,z:BED.z-.1,y:BED.y+.28,face:Math.PI,speed:0,wade:false,stepAcc:0};
P.x=BED.x;P.z=BED.z;
const ws=(x,z)=>{const s=sample(x,z);return s;};
function blocked(x,z){
  if(Math.abs(x)>84||Math.abs(z)>86)return true;
  if(terrainH(x,z)<-.05)return true;
  return false;
}
function movePlayer(dt){
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  const l=Math.hypot(ix,iz);let moving=l>0&&S.mode==='play'&&!S.letter&&S.wake>=1;
  let tx=0,tz=0;
  if(moving){ix/=l;iz/=l;tx=-Math.sin(yaw)*iz+Math.cos(yaw)*ix;tz=-Math.cos(yaw)*iz-Math.sin(yaw)*ix;}
  const cur=ws(P.x,P.z);P.wade=inStream(cur);
  const stone=STONES.find(s=>Math.hypot(s.x-P.x,s.z-P.z)<.75);
  const top=(keys.ShiftLeft||keys.ShiftRight)?4.8:2.9,want=moving?top*(P.wade&&!stone?.62:1):0;
  P.speed+=(want-P.speed)*Math.min(1,dt*7);
  if(moving){
    let nx=P.x+tx*P.speed*dt,nz=P.z+tz*P.speed*dt;
    for(let k=0;k<2;k++)for(const c of colliders){const dx=nx-c.x,dz=nz-c.z,d=Math.hypot(dx,dz),m=c.r+.4;if(d<m&&d>1e-4){nx=c.x+dx/d*m;nz=c.z+dz/d*m;}}
    if(!blocked(nx,nz)){P.x=nx;P.z=nz;}else if(!blocked(nx,P.z))P.x=nx;else if(!blocked(P.x,nz))P.z=nz;
    const tf=Math.atan2(tx,tz);let df=tf-P.face;while(df>Math.PI)df-=TAU;while(df<-Math.PI)df+=TAU;P.face+=df*Math.min(1,dt*9);
  }
  const s=ws(P.x,P.z);let gy=s.h;if(stone)gy=Math.max(gy,stone.y);
  P.y+=(gy-P.y)*Math.min(1,dt*14);
  P.stepAcc+=P.speed*dt;if(P.stepAcc>1.35){P.stepAcc=0;if(P.speed>.5)stepSound(P.wade&&!stone);}
  return s;
}

/* ---------- the third-person camera ---------- */
const CAMS={dist:5.4,look:new THREE.Vector3(),pos:new THREE.Vector3(),init:false};
function updateCamera(dt){
  const lie=TRAV.lie,intro=(S.mode!=='play'||S.wake<1),wk=S.mode==='play'?S.wake:.5;
  const dist=lerp(4.4,5.4,smooth(0,1,wk)),pit=intro?lerp(.05,.28,smooth(0,1,wk)):pitch;
  const ty=P.y+lerp(.5,1.45,1-lie);
  const wantLook=new THREE.Vector3(P.x,ty,P.z);
  const cy=Math.cos(pit),ox=Math.sin(yaw)*cy*dist,oz=Math.cos(yaw)*cy*dist,oy=Math.sin(pit)*dist+.3;
  let want=new THREE.Vector3(P.x+ox,ty+oy,P.z+oz);
  for(let f=1;f>=.15;f-=.07){const px=P.x+ox*f,pz=P.z+oz*f,py=ty+oy*f;if(py>terrainH(px,pz)+.55){want.set(px,py,pz);break;}want.set(px,Math.max(py,terrainH(px,pz)+.55),pz);}
  if(!CAMS.init){CAMS.pos.copy(want);CAMS.look.copy(wantLook);CAMS.init=true;}
  const k=Math.min(1,dt*(S.mode==='play'?11:3));CAMS.pos.lerp(want,k);CAMS.look.lerp(wantLook,Math.min(1,dt*14));
  camera.position.copy(CAMS.pos);camera.lookAt(CAMS.look);
}
