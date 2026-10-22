/* ---------- the traveler: soft lathe shapes, no boxes ---------- */
function capsule(r,len,mat,seg){const h=len/2;const pts=[[.001,-h-r]];for(let i=1;i<=6;i++){const a=-Math.PI/2+i/6*(Math.PI/2);pts.push([Math.cos(a)*r,-h+Math.sin(a)*r]);}
  for(let i=0;i<=6;i++){const a=i/6*(Math.PI/2);pts.push([Math.cos(a)*r,h+Math.sin(a)*r]);}pts[pts.length-1][0]=.001;return lathe(pts,seg||12,mat);}
const TRAV=(()=>{
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const cloakM=new THREE.MeshLambertMaterial({color:C('#4f8a8b'),side:THREE.DoubleSide}),skin=lm('#f0c5a0'),cream=lm('#f0e3c4'),hatM=lm('#c9735a'),boot=lm('#5a4034'),pant=lm('#5b4a63');
  const cloak=lathe([[.001,1.28],[.2,1.3],[.3,1.12],[.4,.75],[.5,.28],[.52,.22]],22,cloakM);body.add(cloak);
  const scarf=new THREE.Mesh(new THREE.TorusGeometry(.2,.08,10,20),lm('#e8a15f'));scarf.rotation.x=Math.PI/2;scarf.position.y=1.3;scarf.scale.set(1,1,1.1);body.add(scarf);
  const tail=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),lm('#e8a15f'));tail.scale.set(1,3,1);tail.position.set(-.14,1.12,-.17);tail.rotation.z=.2;body.add(tail);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,18,14),skin);head.position.y=1.5;body.add(head);
  const brim=lathe([[.001,.0],[.15,.02],[.38,.0],[.4,-.03],[.2,-.02],[.001,-.02]],24,hatM);brim.position.y=1.6;brim.rotation.z=.04;body.add(brim);
  const crown=lathe([[.001,.3],[.1,.28],[.19,.12],[.2,0],[.001,0]],20,hatM);crown.position.y=1.6;body.add(crown);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,6,20),cream);band.rotation.x=Math.PI/2;band.position.y=1.63;body.add(band);
  for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),lm('#3b2c24'));e.position.set(sx*.07,1.52,.185);body.add(e);}
  const pack=new THREE.Mesh(new THREE.SphereGeometry(.26,14,10),lm('#8a6a4a'));pack.scale.set(1,1.1,.75);pack.position.set(0,.85,-.36);body.add(pack);
  const roll=capsule(.08,.34,lm('#9fb0d0'),10);roll.rotation.z=Math.PI/2;roll.position.set(0,1.15,-.4);body.add(roll);
  const legs=[],arms=[];
  for(const sx of[-1,1]){
    const hip=new THREE.Group();hip.position.set(sx*.14,.5,0);const l=capsule(.09,.3,pant,10);l.position.y=-.2;hip.add(l);
    const b=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),boot);b.scale.set(1,.7,1.45);b.position.set(0,-.48,.05);hip.add(b);body.add(hip);legs.push(hip);
    const sh=new THREE.Group();sh.position.set(sx*.3,1.18,0);const a=capsule(.065,.34,cloakM,10);a.position.y=-.2;sh.add(a);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),skin);hand.position.y=-.46;sh.add(hand);sh.userData.hand=hand;body.add(sh);arms.push(sh);
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return {g,body,legs,arms,phase:0,lie:1,bob:0,heldLantern:false};
})();
scene.add(TRAV.g);
function travUpdate(dt,speed,wade){
  const T=TRAV;T.phase+=dt*speed*2.1;const k=Math.min(1,speed/3.2),s=Math.sin(T.phase),c=Math.cos(T.phase);
  T.legs[0].rotation.x=s*.75*k;T.legs[1].rotation.x=-s*.75*k;
  T.arms[0].rotation.x=-s*.5*k;
  if(T.heldLantern){T.arms[1].rotation.x=-.9+c*.04*k;T.arms[1].rotation.z=-.1;}else{T.arms[1].rotation.x=s*.5*k;T.arms[1].rotation.z=0;}
  T.bob=Math.abs(s)*.045*k;
  const L=T.lie;
  T.body.rotation.x=-L*(Math.PI/2)+0;T.body.position.y=T.bob+L*.36;T.body.position.z=L*-.1;
  T.body.rotation.z=Math.sin(T.phase*.5)*.025*k;
  if(L>0){T.legs.forEach(l=>l.rotation.x=0);T.arms.forEach(a=>a.rotation.x=0);}
  T.g.userData.wade=wade;
}

/* ---------- the little fox ---------- */
const FOX=(()=>{
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const fur=lm('#e08a4a'),cream=lm('#f6e9d0'),dark=lm('#3f2f2c');
  const body=capsule(.17,.34,fur,14);body.rotation.x=Math.PI/2;body.position.set(0,.38,0);body.scale.set(1,1,1);b.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(.15,12,10),cream);chest.position.set(0,.34,.28);b.add(chest);
  const head=new THREE.Group();head.position.set(0,.55,.42);b.add(head);
  const sk=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),fur);head.add(sk);
  const sn=new THREE.Mesh(new THREE.ConeGeometry(.08,.2,12),cream);sn.rotation.x=Math.PI/2;sn.position.set(0,-.03,.2);head.add(sn);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),dark);nose.position.set(0,-.01,.3);head.add(nose);
  for(const sx of[-1,1]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.065,.2,10),fur);ear.position.set(sx*.09,.17,-.02);ear.rotation.z=-sx*.18;head.add(ear);
    const ein=new THREE.Mesh(new THREE.ConeGeometry(.032,.12,8),dark);ein.position.set(sx*.09,.17,.02);ein.rotation.z=-sx*.18;head.add(ein);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),dark);eye.position.set(sx*.07,.03,.13);head.add(eye);
  }
  const legs=[];
  [[-1,.2],[1,.2],[-1,-.2],[1,-.2]].forEach(([sx,z])=>{
    const h=new THREE.Group();h.position.set(sx*.09,.3,z);const l=capsule(.04,.16,dark,8);l.position.y=-.14;h.add(l);b.add(h);legs.push(h);});
  const tail=new THREE.Group();tail.position.set(0,.4,-.34);b.add(tail);
  const tl=lathe([[.001,0],[.06,.05],[.13,.3],[.1,.5],[.001,.6]],14,fur);tl.rotation.x=-Math.PI/2+.5;tail.add(tl);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),cream);tip.position.set(0,.3,-.55);tail.add(tip);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return {g,b,legs,tail,head,phase:0,sit:1};
})();
scene.add(FOX.g);
function foxUpdate(dt,speed,t,lookX,lookZ){
  const F=FOX;F.phase+=dt*(speed*3.2);const k=Math.min(1,speed/3);
  F.sit+=((speed<.15?1:0)-F.sit)*Math.min(1,dt*5);
  const s=Math.sin(F.phase);
  F.legs[0].rotation.x=s*.8*k;F.legs[3].rotation.x=s*.8*k;F.legs[1].rotation.x=-s*.8*k;F.legs[2].rotation.x=-s*.8*k;
  F.b.rotation.x=-F.sit*.55;F.b.position.y=F.sit*-.04+Math.abs(s)*.03*k;
  F.legs[2].rotation.x+=F.sit*1.3;F.legs[3].rotation.x+=F.sit*1.3;
  F.tail.rotation.y=Math.sin(t*(2+k*3))*(.3+.15*k);F.tail.rotation.x=.1-.25*k;
  F.head.rotation.x=F.sit*.5+Math.sin(t*.7)*.04*F.sit;
}
