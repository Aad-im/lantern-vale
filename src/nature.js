/* ---------- shared geometry helpers ---------- */
function merge(parts){
  let n=0;for(const p of parts){if(p.g.index)p.g=p.g.toNonIndexed();n+=p.g.attributes.position.count;}
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  for(const p of parts){
    const a=p.g.attributes,c=a.position.count;pos.set(a.position.array,o*3);nor.set(a.normal.array,o*3);
    for(let i=0;i<c;i++){const cc=typeof p.color==='function'?p.color(a.position.getX(i),a.position.getY(i),a.position.getZ(i)):p.color;col[(o+i)*3]=cc.r;col[(o+i)*3+1]=cc.g;col[(o+i)*3+2]=cc.b;}
    o+=c;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;
}
function blob(cx,cy,cz,rx,ry,rz,seed){
  const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(vnoise(x*1.8+seed,z*1.8+y*1.4)-.5)*.36;
    const l=Math.hypot(x,y,z)||1;n.setXYZ(i,x/l,y/l,z/l);
    p.setXYZ(i,cx+x*k*rx,cy+y*k*ry,cz+z*k*rz);
  }
  return g;
}
function instanced(geo,mat,items,place){
  const m=new THREE.InstancedMesh(geo,mat,items.length),d=new THREE.Object3D(),c=new THREE.Color();
  items.forEach((it,i)=>{d.position.set(0,0,0);d.rotation.set(0,0,0);d.scale.set(1,1,1);place(it,d,c);d.updateMatrix();m.setMatrixAt(i,d.matrix);m.setColorAt(i,c);});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;return m;
}
function softTex(inner,outer){
  const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,inner);gr.addColorStop(.35,outer||inner);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;
}
const glowTex=softTex('rgba(255,255,255,1)','rgba(255,255,255,.35)');
function freeSpot(x,z,s,pr,sr){
  if(s.d<pr)return false;if(s.ds<sr&&s.sf>.2)return false;
  if(Math.hypot(x-CAMP.x,z-CAMP.z)<9||Math.hypot(x-LH.x,z-LH.z)<13||Math.hypot(x-CROSS.x,z-CROSS.z)<6)return false;
  for(const l of LAMPS)if(Math.hypot(x-l.x,z-l.z)<4.5)return false;
  return true;
}
function scatter(n,tries,accept){const out=[];for(let t=0;t<tries&&out.length<n;t++){const x=rr(-90,90),z=rr(-90,90),s=sample(x,z);if(accept(x,z,s))out.push({x,z,s});}return out;}
const litMat=()=>new THREE.MeshLambertMaterial({vertexColors:true});

/* ---------- trees ---------- */
const trunkC=C('#6e5240');
const fCol=new THREE.Color(),fLo=C('#3f7040'),fHi=C('#a6d062'),pLo=C('#2f5e48'),pHi=C('#68a45e');
function makeBroadleaf(){
  const parts=[];const tr=new THREE.CylinderGeometry(.16,.3,2.8,9,1);tr.translate(0,1.4,0);parts.push({g:tr,color:trunkC});
  [[0,3.5,0,1.9,1.7,1.9],[1.0,3.0,.5,1.4,1.2,1.4],[-.9,3.2,-.6,1.5,1.3,1.5],[.1,4.5,-.1,1.3,1.2,1.3],[-.4,3.0,1.0,1.2,1.0,1.2]]
    .forEach((b,i)=>parts.push({g:blob(b[0],b[1],b[2],b[3],b[4],b[5],i*7.3),color:(x,y)=>fCol.copy(fLo).lerp(fHi,smooth(2.2,5.6,y))}));
  return merge(parts);
}
function makePine(){
  const parts=[];const tr=new THREE.CylinderGeometry(.12,.24,1.7,8,1);tr.translate(0,.85,0);parts.push({g:tr,color:trunkC});
  [[1.9,2.3,1.5],[1.55,2.1,2.6],[1.15,1.9,3.7],[.75,1.7,4.8]].forEach(([r,h,y])=>{const g=new THREE.ConeGeometry(r,h,18,1);g.translate(0,y+h/2,0);
    parts.push({g,color:(x,yy)=>fCol.copy(pLo).lerp(pHi,smooth(y,y+h,yy)*.9)});});
  return merge(parts);
}
{
  const grove=(x,z)=>fbm(x*.05+5,z*.05,3);
  const spots=scatter(150,6000,(x,z,s)=>freeSpot(x,z,s,5,4.2)&&s.h>1.3&&s.h<17&&Math.random()<smooth(.38,.62,grove(x,z)));
  const A=[],B=[];spots.forEach((p,i)=>(rand()<.55?A:B).push(p));
  const place=(it,d,c)=>{const sc=rr(.85,1.45);it.s.sc=sc;d.position.set(it.x,it.s.h-.1,it.z);d.rotation.set(rr(-.04,.04),rr(0,TAU),rr(-.04,.04));d.scale.set(sc,sc*rr(.9,1.15),sc);
    const r=rand();c.setRGB(1,1,1);if(r<.22)c.setRGB(1,.84,.68);else if(r<.38)c.setRGB(.86,1,.94);
    colliders.push({x:it.x,z:it.z,r:.42*sc});};
  const m1=instanced(makeBroadleaf(),litMat(),A,place),m2=instanced(makePine(),litMat(),B,place);
  [m1,m2].forEach(m=>{m.castShadow=true;m.receiveShadow=true;scene.add(m);});
  window.__trees=spots;
}

/* ---------- rocks and mushrooms ---------- */
{
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,n=g.attributes.normal,col=new Float32Array(p.count*3);
  const lo=C('#7c7f78'),hi=C('#9aa186'),moss=C('#6f9a4a'),c=new THREE.Color();
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(vnoise(x*1.3+3,z*1.3+y)-.5)*.5,l=Math.hypot(x,y,z)||1;
    p.setXYZ(i,x*k,y*k*.72,z*k);n.setXYZ(i,x/l,y/l*1.2,z/l);c.copy(lo).lerp(hi,vnoise(x*2,z*2)).lerp(moss,smooth(.3,.9,y/l)*.55);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const near=scatter(70,3000,(x,z,s)=>freeSpot(x,z,s,3.2,1.6)&&s.h>.9&&(s.ds<9||Math.random()<.12));
  const m=instanced(g,litMat(),near,(it,d,c2)=>{const sc=rr(.35,1.5)*(it.s.ds<9?.7:1.2);d.position.set(it.x,it.s.h+sc*.1,it.z);d.rotation.set(0,rr(0,TAU),0);d.scale.set(sc*rr(.9,1.5),sc*rr(.7,1.1),sc*rr(.9,1.4));c2.setRGB(1,1,1);if(sc>.9)colliders.push({x:it.x,z:it.z,r:sc*.9});});
  m.castShadow=true;m.receiveShadow=true;scene.add(m);
}
{
  const cream=C('#f0e3c4'),caps=[C('#e46f4a'),C('#f2b44f'),C('#d9886a')];
  const parts=[];const st=new THREE.CylinderGeometry(.04,.06,.2,8);st.translate(0,.1,0);parts.push({g:st,color:cream});
  const cap=new THREE.SphereGeometry(.14,12,6,0,TAU,0,Math.PI/2);cap.scale(1,.7,1);cap.translate(0,.19,0);parts.push({g:cap,color:caps[0]});
  const geo=merge(parts),tr=window.__trees||[];const items=[];
  for(let i=0;i<tr.length&&items.length<80;i+=1){if(rand()<.35){const a=rr(0,TAU),r=rr(1.2,2.6),x=tr[i].x+Math.cos(a)*r,z=tr[i].z+Math.sin(a)*r,s=sample(x,z);if(freeSpot(x,z,s,2.5,2.5)&&s.h>1)items.push({x,z,s});}}
  const m=instanced(geo,litMat(),items,(it,d,c)=>{const sc=rr(.8,1.6);d.position.set(it.x,it.s.h-.02,it.z);d.rotation.set(rr(-.15,.15),rr(0,TAU),rr(-.15,.15));d.scale.setScalar(sc);c.setRGB(rr(.85,1),rr(.8,1),rr(.8,1));});
  scene.add(m);
}

/* ---------- grass and flowers ---------- */
function tuftGeo(){
  const pos=[],col=[],nor=[],base=C('#3f6b32'),tip=C('#a8d363'),cc=new THREE.Color();
  const tri=(a,b,c)=>{for(const v of[a,b,c]){pos.push(v[0],v[1],v[2]);col.push(v[3],v[4],v[5]);nor.push(0,1,0);}};
  const blades=[[0,0,.95,.0],[.07,.03,.75,2.1],[-.06,.05,.6,4.2]];
  for(const [ox,oz,hh,rot] of blades){
    const cs=Math.cos(rot),sn=Math.sin(rot),segs=2,ring=[];
    for(let j=0;j<=segs;j++){const y=j/segs;cc.copy(base).lerp(tip,smooth(0,1,y));ring.push({y:y*hh,w:.055*(1-y*.9),z:y*y*.24*hh,c:[cc.r,cc.g,cc.b]});}
    const v=(r,s)=>{const lx=s*r.w,lz=r.z;return [ox+lx*cs-lz*sn,r.y,oz+lx*sn+lz*cs,r.c[0],r.c[1],r.c[2]];};
    for(let j=0;j<segs;j++){const a=ring[j],b=ring[j+1];
      tri(v(a,-1),v(a,1),v(b,-1));tri(v(a,1),v(b,1),v(b,-1));
      tri(v(a,-1),v(b,-1),v(a,1));tri(v(a,1),v(b,-1),v(b,1));}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g;
}
const grassMat=litMat();
grassMat.onBeforeCompile=sh=>{
  sh.uniforms.uTime=U.time;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
    float w=sin(uTime*1.5+ip.x*.33+ip.z*.25)+.5*sin(uTime*2.4+ip.x*.8+ip.z*.6);
    float kk=position.y*position.y;
    transformed.x+=w*.16*kk;transformed.z+=cos(uTime*1.2+ip.z*.4+ip.x*.1)*.1*kk;`);
};
{
  const tufts=scatter(30000,80000,(x,z,s)=>freeSpot(x,z,s,1.5,2.5)&&s.h>.95&&s.h<16&&Math.hypot(x-CAMP.x,z-CAMP.z)>2.2&&Math.random()<lerp(.18,1,1-smooth(8,40,s.d))*lerp(.45,1,fbm(x*.09,z*.09,2)));
  const m=instanced(tuftGeo(),grassMat,tufts,(it,d,c)=>{const hs=rr(.45,.95)*lerp(.8,1.3,fbm(it.x*.05+2,it.z*.05,2));d.position.set(it.x,it.s.h-.04,it.z);d.rotation.set(0,rr(0,TAU),0);d.scale.set(rr(.8,1.4),hs,rr(.8,1.4));
    const v=rr(.82,1.12);c.setRGB(v,v*rr(.96,1.06),v*rr(.82,1));});
  m.frustumCulled=false;scene.add(m);
}
{
  const pal=['#fff3d6','#ffd86b','#c9a7ee','#f5a3b8','#ffffff','#9fc7ff'].map(C);
  const fl=scatter(1700,30000,(x,z,s)=>freeSpot(x,z,s,2.2,2.2)&&s.h>1&&s.h<14&&fbm(x*.11+30,z*.11,2)>.55&&s.d<42);
  const g=new THREE.SphereGeometry(.085,8,6);g.scale(1,.7,1);
  const m=instanced(g,new THREE.MeshLambertMaterial({}),fl,(it,d,c)=>{const k=Math.floor(hash2(Math.floor(it.x/6),Math.floor(it.z/6))*pal.length);d.position.set(it.x,it.s.h+rr(.28,.5),it.z);d.scale.setScalar(rr(.8,1.5));c.copy(rand()<.8?pal[k%pal.length]:pal[Math.floor(rand()*pal.length)]);});
  m.material.color=new THREE.Color(1,1,1);scene.add(m);
}

/* ---------- clouds, sun glow ---------- */
const cloudTex=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=128;const g=cv.getContext('2d');
  for(let i=0;i<14;i++){const x=40+Math.random()*176,y=44+Math.random()*40,r=22+Math.random()*30,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,256,128);}
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t;})();
const clouds=new THREE.Group();scene.add(clouds);const cloudMats=[];
for(let i=0;i<16;i++){
  const m=new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:.7,fog:false,depthWrite:false});cloudMats.push(m);
  const s=new THREE.Sprite(m),a=rr(0,TAU),r=rr(260,420);s.position.set(Math.cos(a)*r,rr(70,160),Math.sin(a)*r);s.scale.set(rr(160,260),rr(70,110),1);clouds.add(s);
}
const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:C('#ffb27c'),blending:THREE.AdditiveBlending,transparent:true,fog:false,depthWrite:false,opacity:.8}));sunGlow.scale.set(260,260,1);scene.add(sunGlow);

/* ---------- motes and butterflies ---------- */
const moteN=170,motes=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({map:glowTex,size:.5,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,color:C('#ffd9a0')}));
{const pos=new Float32Array(moteN*3);for(let i=0;i<moteN;i++){pos[i*3]=CAMP.x+rr(-18,18);pos[i*3+1]=CAMP.y+rr(.3,6);pos[i*3+2]=CAMP.z+rr(-18,18);}
 motes.geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));motes.frustumCulled=false;scene.add(motes);}
const flies=[];
for(let i=0;i<14;i++){
  const g=new THREE.Group(),col=C(['#ffd1dc','#fff2b0','#c8e6ff','#ffe0b8','#e3d0ff'][i%5]),mat=new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide});
  const mk=sx=>{const p=new THREE.Group(),w=new THREE.Mesh(new THREE.CircleGeometry(.1,10),mat);w.rotation.x=-Math.PI/2;w.scale.set(1,1.2,1);w.position.x=sx*.1;p.add(w);return p;};
  const L=mk(1),R=mk(-1);g.add(L);g.add(R);g.userData={L,R,h:rr(0,TAU),sp:rr(.7,1.4),ph:rr(0,6),y:rr(.6,1.8)};
  g.position.set(CAMP.x+rr(-10,10),CAMP.y+1,CAMP.z+rr(-10,10));scene.add(g);flies.push(g);
}
function natureUpdate(t,dt,px,pz,dawn){
  U.time.value=t;
  clouds.rotation.y=t*.003;
  const a=motes.geometry.attributes.position.array;
  for(let i=0;i<moteN;i++){
    a[i*3]+=Math.sin(t*.4+i)*dt*.25;a[i*3+1]+=Math.sin(t*.7+i*1.7)*dt*.12;a[i*3+2]+=Math.cos(t*.33+i)*dt*.25;
    if(Math.abs(a[i*3]-px)>20||Math.abs(a[i*3+2]-pz)>20){a[i*3]=px+rr(-18,18);a[i*3+2]=pz+rr(-18,18);a[i*3+1]=terrainH(a[i*3],a[i*3+2])+rr(.4,5);}
  }
  motes.geometry.attributes.position.needsUpdate=true;motes.material.opacity=.45+.4*(1-dawn);
  for(const f of flies){
    const u=f.userData;u.h+=Math.sin(t*.8+u.ph)*dt*1.4;f.position.x+=Math.sin(u.h)*u.sp*dt;f.position.z+=Math.cos(u.h)*u.sp*dt;
    if(Math.hypot(f.position.x-px,f.position.z-pz)>26){f.position.x=px+rr(-14,14);f.position.z=pz+rr(-14,14);}
    f.position.y=terrainH(f.position.x,f.position.z)+u.y+Math.sin(t*2+u.ph)*.25;
    f.rotation.y=u.h;const fl=Math.sin(t*16+u.ph)*.9;u.L.rotation.z=fl;u.R.rotation.z=-fl;f.visible=dawn>.2;
  }
}
