import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {serve} from './serve.mjs';
const out=process.env.RECEIPT || path.join(os.tmpdir(),'alsacreations-publication-check.json');
const r={date:new Date().toISOString(),baseURL:null,checks:[],pages:[],errors:[],passed:false};
const check=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);r.checks.push(name);};
let server,browser;
try{
 for(const file of ['a.html','b.html','c.html','styles.css','experiment.js','observations.json'])check('Historique préservé '+file,fs.readFileSync(file).equals(execFileSync('git',['show','ae88025:'+file])),true);
 if(!process.env.BASE_URL)server=await serve({port:0});
 const base=process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/html-aria-agent-demo/`;r.baseURL=base;
 browser=await chromium.launch({channel:'chrome',headless:true});r.chrome=browser.version();
 const context=await browser.newContext();
 const manifest=JSON.parse(fs.readFileSync('preuves/2026-10-08/checksums.json'));
 for(const [file,hash] of Object.entries(manifest.hashes)){
  const response=await context.request.get(base+'preuves/2026-10-08/'+file);check('HTTP '+file,response.status(),200);check('Octets '+file,crypto.createHash('sha256').update(await response.body()).digest('hex'),hash);
 }
 for(const file of ['index.html','index-en.html','presentation-manifest.json']){
  const response=await context.request.get(base+file);check('Livraison '+file,response.status(),200);check('Octets accueil '+file,(await response.body()).equals(fs.readFileSync(file)),true);
 }
 if(!process.env.BASE_URL)for(const file of ['preuves/2026-10-08/.git/config','preuves/2026-10-08/node_modules/foo.js','preuves/2026-10-08/runs/example.json'])check('Accès exclu '+file,(await context.request.get(base+file)).status(),404);
 await context.close();
 for(const lang of ['fr','en'])for(const width of [390,1280])for(const js of [true,false]){
  const url=base+'preuves/2026-10-08/'+(lang==='fr'?'':'index-en.html');
  const c=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:js});const p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));
  check(`Page ${lang} ${width} JS=${js}`,(await p.goto(url)).status(),200);
  check('Langue',await p.locator('html').getAttribute('lang'),lang);
  check('Débordement',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  check('Titre',await p.locator('h1').count(),1);
  check('Langues alternatives',await p.locator('link[rel="alternate"][hreflang]').count(),3);
  const anchors=await p.locator('a[href^="#"]').evaluateAll(as=>as.every(a=>!!document.getElementById(a.hash.slice(1))));check('Ancres',anchors,true);
  const links=await p.locator('a[href]').evaluateAll(as=>as.map(a=>a.href).filter(h=>h.startsWith(location.origin)&&!h.includes('#')));
  for(const href of new Set(links))check('Lien '+href,(await c.request.get(href)).status(),200);
  await p.keyboard.press('Tab');check('Lien d’évitement',await p.evaluate(()=>document.activeElement.className),'skip');
  await p.keyboard.press('Enter');await p.keyboard.press('Tab');check('Découverte clavier du complément',await p.evaluate(()=>document.activeElement.getAttribute('href')),'controle-v21/'+(lang==='fr'?'index.html':'index-en.html'));await p.keyboard.press('Tab');check('Navigation du dossier',await p.evaluate(()=>document.activeElement.getAttribute('href')),'#summary');
  if(width===390){await p.locator('.table-scroll').scrollIntoViewIfNeeded();const before=await p.locator('.table-scroll').evaluate(el=>el.scrollLeft);await p.locator('.table-scroll').focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);check('Tableau défilable au clavier',await p.locator('.table-scroll').evaluate(el=>el.scrollLeft>0),true);}
  if(js)await p.screenshot({path:path.join(os.tmpdir(),`alsacreations-preuves-${lang}-${width}${process.env.BASE_URL?'-production':''}.png`),fullPage:true});
  r.pages.push({lang,width,javaScript:js,passed:true});await c.close();
 }
 for(const lang of ['fr','en'])for(const width of [390,1280])for(const js of [true,false]){
  const url=base+'preuves/2026-10-08/controle-v21/'+(lang==='fr'?'':'index-en.html');
  const c=await browser.newContext({viewport:{width,height:900},javaScriptEnabled:js});const p=await c.newPage();p.on('pageerror',e=>r.errors.push(e.message));
  check('Complément HTTP',(await p.goto(url)).status(),200);check('Complément langue',await p.locator('html').getAttribute('lang'),lang);
  check('Complément largeur',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  check('Complément tableaux',await p.locator('.table-scroll').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)),true);
  check('Complément canonical',await p.locator('link[rel="canonical"]').getAttribute('href'),'https://edikkaweb.github.io/html-aria-agent-demo/preuves/2026-10-08/controle-v21/'+(lang==='fr'?'':'index-en.html'));
  check('Complément hreflang',await p.locator('link[rel="alternate"][hreflang]').count(),3);
  check('Complément ancres',await p.locator('a[href^="#"]').evaluateAll(as=>as.every(a=>!!document.getElementById(a.hash.slice(1)))),true);
  const links=await p.locator('a[href]').evaluateAll(as=>as.map(a=>a.href).filter(h=>h.startsWith(location.origin)&&!h.includes('#')));
  for(const href of new Set(links))check('Complément lien '+href,(await c.request.get(href)).status(),200);
  await p.keyboard.press('Tab');check('Complément évitement',await p.evaluate(()=>document.activeElement.className),'skip');await p.keyboard.press('Enter');await p.keyboard.press('Tab');check('Complément navigation',await p.evaluate(()=>document.activeElement.getAttribute('href')),'#summary');
  if(js)await p.screenshot({path:path.join(os.tmpdir(),`alsacreations-v21-${lang}-${width}${process.env.BASE_URL?'-production':''}.png`),fullPage:true});
  r.pages.push({supplement:true,lang,width,javaScript:js,passed:true});await c.close();
 }
 for(const [file,lang] of [['index.html','fr'],['index-en.html','en']]){
  const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();await p.goto(base+file);const target='preuves/2026-10-08/'+(lang==='fr'?'index.html':'index-en.html');check('Lien de découverte '+lang,await p.locator(`a[href="${target}"]`).count()>0,true);await c.close();
 }
 check('Erreurs JavaScript',r.errors,[]);r.passed=true;
}catch(e){r.error=e.stack;process.exitCode=1;console.error(e);}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(out,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({passed:r.passed,checks:r.checks.length,pages:r.pages,error:r.error}));}
