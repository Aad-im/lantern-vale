import { chromium } from 'playwright-core';
import fs from 'fs';
const S='/tmp/claude-0/-home-claude/71f56498-104b-582b-8643-27338c84820b/scratchpad';
const three=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js','utf8');
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox']});
const page=await browser.newPage({viewport:{width:960,height:560}});
const errs=[];page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('ERR_FAILED'))errs.push(m.text());});
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com')&&u.includes('three'))return r.fulfill({contentType:'application/javascript',body:three});if(u.startsWith('file://'))return r.continue();return r.abort();});
await page.goto('file://'+S+'/lantern-vale/dist/lantern-vale.html');await page.waitForTimeout(1200);
page.setDefaultTimeout(150000);
const E=(f,a)=>page.evaluate(f,a);
await E(()=>{window.__hold=true;});
await page.screenshot({path:S+'/v_title.png',timeout:150000});
await page.click('#begin');
await E(()=>__vale.step(.05,170));
const log=async(tag)=>console.log(tag,JSON.stringify(await E(()=>({step:__vale.S.step,lamps:__vale.S.lamps,dawn:+__vale.S.dawn.toFixed(2),prompt:document.getElementById('prompt').textContent,obj:document.getElementById('objtxt').textContent,cap:document.getElementById('cap').textContent,fox:[+__vale.FX.t.toFixed(3)]}))));
await log('wake');
// note
await E(()=>{const a=__vale.IA[0];__vale.tp(a.x+1,a.z+1);__vale.step(.05,3);});await log('near note');
await E(()=>{__vale.press();__vale.step(.05,2);});
await page.screenshot({path:S+'/v_letter.png',timeout:150000});
await E(()=>{__vale.press();__vale.step(.05,2);});await log('after letter');
await E(()=>{const a=__vale.IA[1];__vale.tp(a.x+1,a.z+1);__vale.step(.05,3);__vale.press();__vale.step(.05,2);});await log('lantern');
await E(()=>{const a=__vale.IA[2];__vale.tp(a.x+2,a.z+2,-2.4);__vale.step(.05,3);__vale.press();__vale.step(.05,30);});await log('fire');
await E(()=>{__vale.step(.05,1);});
await page.screenshot({path:S+'/v_fire.png',timeout:150000});
// walk the fox along: simulate player following
for(let i=0;i<3;i++){
  await E((i)=>{const lt=[.22,.55,.84][i];const a=__vale.IA[3+i];
    // walk player along path in steps so fox follows
    for(let k=0;k<400;k++){__vale.step(.1,1);if(__vale.FX.t>=lt-.02)break;
      const p=__vale.pathAt(Math.min(1,__vale.FX.t-.03),0);__vale.P.x=p.x;__vale.P.z=p.z;}
  },i).catch(e=>console.log('walk err',e.message.slice(0,120)));
  await log('lamp'+i+' fox at lamp?');
  await E((i)=>{const a=__vale.IA[3+i];__vale.tp(a.x+1.5,a.z+1.5);__vale.step(.05,3);__vale.press();__vale.step(.05,2);},i);
  await log('lamp'+i+' lit');
  await E(()=>{__vale.step(.1,50)});
  await page.screenshot({path:S+'/v_lamp'+i+'.png'});
}
await E(()=>{__vale.tp(__vale.BELLP.x-1.5,__vale.BELLP.z+1.5,0.3);__vale.step(.05,3);__vale.press();__vale.step(.1,40);});
await log('bell');
await page.screenshot({path:S+'/v_bell.png',timeout:150000});
await E(()=>{__vale.step(.1,120);});
await page.screenshot({path:S+'/v_end.png',timeout:150000});
console.log('ended',await E(()=>__vale.S.ended));
console.log('errors',JSON.stringify(errs));
await browser.close();
