/* ---------- helpers ---------- */
const TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const C=h=>new THREE.Color(h).convertSRGBToLinear();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
let _s=20261021;const rand=()=>{_s=(_s*16807)%2147483647;return (_s-1)/2147483646;};
const rr=(a,b)=>a+rand()*(b-a);
function hash2(ix,iz){let h=(Math.imul(ix,374761393)+Math.imul(iz,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function vnoise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  return lerp(lerp(hash2(ix,iz),hash2(ix+1,iz),u),lerp(hash2(ix,iz+1),hash2(ix+1,iz+1),u),v);}
function fbm(x,z,o){let s=0,a=.5,f=1,m=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,z*f);m+=a;f*=2.03;a*=.5;}return s/m;}
const U={time:{value:0}};
const colliders=[];

/* ---------- renderer, scene, lights ---------- */
const canvas=$('view'),stage=$('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(C('#cf9488'),0.017);
const camera=new THREE.PerspectiveCamera(55,1.6,0.3,900);
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
if(window.ResizeObserver)new ResizeObserver(resize).observe(stage);addEventListener('resize',resize);resize();
const hemi=new THREE.HemisphereLight(C('#8fa0d8'),C('#4a3f4e'),.62);scene.add(hemi);
const sun=new THREE.DirectionalLight(C('#ffb27c'),1.15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
{const s=sun.shadow.camera;s.left=-36;s.right=36;s.top=36;s.bottom=-36;s.near=1;s.far=320;sun.shadow.bias=-0.0006;sun.shadow.normalBias=.45;}
scene.add(sun);scene.add(sun.target);

/* ---------- the path every walker follows ---------- */
const PATH_PTS=[[-52,62],[-40,46],[-26,34],[-8,24],[6,8],[14,-12],[6,-32],[-10,-46],[-4,-62],[8,-72],[14,-77]].map(p=>new THREE.Vector3(p[0],0,p[1]));
const pathCurve=new THREE.CatmullRomCurve3(PATH_PTS,false,'catmullrom',.5);
const PATH_N=260,pathS=pathCurve.getSpacedPoints(PATH_N);
function nearestPath(x,z){let best=1e9,bi=0;for(let i=0;i<=PATH_N;i++){const p=pathS[i],dx=x-p.x,dz=z-p.z,d=dx*dx+dz*dz;if(d<best){best=d;bi=i;}}return {d:Math.sqrt(best),t:bi/PATH_N,i:bi};}
function pathAt(t,side){const i=clamp(Math.round(t*PATH_N),0,PATH_N),a=pathS[Math.max(0,i-2)],b=pathS[Math.min(PATH_N,i+2)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
  return {x:pathS[i].x-tz*(side||0),z:pathS[i].z+tx*(side||0),tx,tz,i};}
const pathH=t=>lerp(10.5,0.9,Math.pow(t,.85));
const CAMP={x:-55,z:66,y:0},LH={x:14,z:-77,y:0};

function rawH(x,z,np){
  const valley=smooth(7,48,np.d);
  const hl=(fbm(x*.028,z*.028,4)-.5)*20+(fbm(x*.09+40,z*.09,3)-.5)*4;
  const gentle=(fbm(x*.07+9,z*.07,3)-.5)*1.4;
  let h=pathH(np.t)+valley*(9+hl)+(1-valley)*gentle;
  h+=3.6*Math.exp(-((x-LH.x)*(x-LH.x)+(z-LH.z)*(z-LH.z))/162);
  h-=smooth(70,96,-z)*9.5;
  h=Math.max(h,lerp(0.7,-3.5,smooth(66,92,-z)));
  return h;
}
CAMP.y=rawH(CAMP.x,CAMP.z,nearestPath(CAMP.x,CAMP.z));LH.y=rawH(LH.x,LH.z,nearestPath(LH.x,LH.z));
function dryH(x,z,np){
  let h=rawH(x,z,np);
  h=lerp(h,CAMP.y,1-smooth(5,10,Math.hypot(x-CAMP.x,z-CAMP.z)));
  h=lerp(h,LH.y+.2,1-smooth(5,10,Math.hypot(x-LH.x,z-LH.z)));
  h-=smooth(88,108,Math.max(Math.abs(x),Math.abs(z)))*28;
  return h;
}

/* ---------- stream that meanders across the path ---------- */
const STR=[];
{let prev=1e9;
  for(let i=0;i<=100;i++){
    const t=.1+i/100*.9,p=pathAt(t,9*Math.sin(t*7+.9)),np=nearestPath(p.x,p.z),bh=dryH(p.x,p.z,np);
    const y=Math.max(bh-.95,Math.min(prev,bh-.32));prev=y;STR.push({x:p.x,z:p.z,y,t});
  }
}
function streamNear(x,z){let best=1e9,bi=0;for(let i=0;i<STR.length;i++){const dx=x-STR[i].x,dz=z-STR[i].z,d=dx*dx+dz*dz;if(d<best){best=d;bi=i;}}return {ds:Math.sqrt(best),si:bi};}
function sample(x,z){
  const np=nearestPath(x,z),sn=streamNear(x,z),dh=dryH(x,z,np),sf=smooth(.1,.16,STR[sn.si].t);
  const carve=1.15*Math.exp(-(sn.ds*sn.ds)/4)*sf;
  return {h:dh-carve,dry:dh,d:np.d,t:np.t,ds:sn.ds,si:sn.si,sf,wy:STR[sn.si].y};
}
const terrainH=(x,z)=>sample(x,z).h;
const inStream=s=>s.sf>.5&&s.ds<2.2&&s.h<s.wy-.03;

/* ---------- landmarks placed along the path ---------- */
const LAMP_T=[.22,.55,.84];
const LAMPS=LAMP_T.map((t,i)=>{
  let side=(i%2?-1:1)*5.2,p=pathAt(t,side);if(streamNear(p.x,p.z).ds<5){side=-side;p=pathAt(t,side);}
  return {x:p.x,z:p.z,y:terrainH(p.x,p.z),t};
});
const CROSS=(()=>{let b=1e9,r=null;for(const s of STR){if(s.t<.27||s.t>.37)continue;const np=nearestPath(s.x,s.z);if(np.d<b){b=np.d;r=s;}}const p=pathAt(r.t,0);return {x:r.x,z:r.z,tx:p.tx,tz:p.tz};})();

/* ---------- terrain mesh ---------- */
const TW=224,TN=176;
const tgeo=new THREE.PlaneGeometry(TW,TW,TN,TN);tgeo.rotateX(-Math.PI/2);
const tp=tgeo.attributes.position,ss=new Array(tp.count);
for(let i=0;i<tp.count;i++){const s=sample(tp.getX(i),tp.getZ(i));ss[i]=s;tp.setY(i,s.h);}
tgeo.computeVertexNormals();
{
  const tn=tgeo.attributes.normal,col=new Float32Array(tp.count*3);
  const g1=C('#6c9a47'),g2=C('#88b255'),g3=C('#5a8743'),gdry=C('#b3bf64'),dirt=C('#d4b483'),dirt2=C('#bd9763'),wet=C('#7b6a52'),sand=C('#ecdaa9'),rock=C('#8f9186'),pebble=C('#c2b394'),pale=C('#c9c4b4');
  const c=new THREE.Color(),c2=new THREE.Color();
  for(let i=0;i<tp.count;i++){
    const x=tp.getX(i),z=tp.getZ(i),h=tp.getY(i),s=ss[i];
    const n1=fbm(x*.06,z*.06,3),n2=fbm(x*.25+7,z*.25,2);
    c.copy(g1).lerp(g2,smooth(.35,.7,n1)).lerp(g3,smooth(.55,.8,n2)*.6);
    c.lerp(gdry,smooth(.55,.75,fbm(x*.03+3,z*.03,3))*.55*smooth(2,12,h));
    const pw=1-smooth(1.0,2.7+n2*.9,s.d);if(pw>0){c2.copy(dirt2).lerp(dirt,n2);c.lerp(c2,pw*.95);}
    c.lerp(wet,(1-smooth(2.0,3.8,s.ds))*.7*s.sf);
    c.lerp(pebble,(1-smooth(.8,2.2,s.ds))*.9*s.sf);
    c.lerp(sand,(1-smooth(.5,1.7,h))*smooth(58,72,-z));
    c.lerp(rock,smooth(.15,.36,1-tn.getY(i))*.85);
    c.lerp(pale,smooth(15,21,h)*.5);
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  tgeo.setAttribute('color',new THREE.BufferAttribute(col,3));
}
const terrain=new THREE.Mesh(tgeo,new THREE.MeshLambertMaterial({vertexColors:true}));terrain.receiveShadow=true;scene.add(terrain);

/* ---------- water ---------- */
function waterTex(){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  g.fillStyle='#78bcc8';g.fillRect(0,0,256,256);
  for(let k=0;k<26;k++){const x=Math.random()*256,y=Math.random()*256,r=20+Math.random()*50;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(60,140,170,.18)');gr.addColorStop(1,'rgba(60,140,170,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  for(let i=0;i<70;i++){const x=Math.random()*256,y=Math.random()*256,w=12+Math.random()*34,a=.1+Math.random()*.22,lw=1+Math.random()*1.4;
    for(const dx of[-256,0,256])for(const dy of[-256,0,256]){g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=lw;g.beginPath();g.moveTo(x+dx,y+dy);g.quadraticCurveTo(x+dx+w/2,y+dy-3-Math.random()*2,x+dx+w,y+dy);g.stroke();}}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;
}
const wTexA=waterTex(),wTexB=waterTex();
const waterMat=new THREE.MeshBasicMaterial({map:wTexA,transparent:true,opacity:.78,depthWrite:false});
{
  const pos=[],uv=[],idx=[];let len=0;
  for(let i=0;i<STR.length;i++){
    const a=STR[Math.max(0,i-1)],b=STR[Math.min(STR.length-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
    if(i)len+=Math.hypot(STR[i].x-STR[i-1].x,STR[i].z-STR[i-1].z);
    const w=2.45*smooth(.1,.16,STR[i].t)+.2+smooth(.9,1,STR[i].t)*1.6,s=STR[i];
    pos.push(s.x+tz*w,s.y,s.z-tx*w, s.x-tz*w,s.y,s.z+tx*w);uv.push(0,len/5,1,len/5);
    if(i<STR.length-1){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  const m=new THREE.Mesh(g,waterMat);m.renderOrder=2;scene.add(m);
}
wTexB.repeat.set(260,260);
const seaMat=new THREE.MeshBasicMaterial({map:wTexB,transparent:true,opacity:.9,depthWrite:false,color:C('#9db8d8')});
const sea=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),seaMat);sea.rotation.x=-Math.PI/2;sea.position.y=-.1;sea.renderOrder=1;scene.add(sea);
wTexA.repeat.set(1,1);

/* ---------- sky ---------- */
const skyU={top:{value:new THREE.Color()},mid:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,.1,-1)},sunCol:{value:new THREE.Color()},stars:{value:1}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(600,32,16),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 vD;uniform vec3 top,mid,hor,sunCol,sunDir;uniform float stars;
  float hs(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  void main(){vec3 d=normalize(vD);float h=max(d.y,0.);
    vec3 c=mix(hor,mid,smoothstep(0.,.22,h));c=mix(c,top,smoothstep(.18,.85,h));
    float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,900.)*1.6+pow(s,30.)*.38+pow(s,5.)*.16);
    vec3 q=floor(d*190.);float st=step(.9972,hs(q))*smoothstep(.15,.6,h)*stars;c+=vec3(st)*.9;
    if(d.y<0.)c=mix(hor,hor*.86,clamp(-d.y*3.,0.,1.));
    gl_FragColor=vec4(c,1.);}`
}));sky.renderOrder=-10;scene.add(sky);
