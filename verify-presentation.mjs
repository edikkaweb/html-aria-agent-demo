import { chromium, firefox, webkit } from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {serve} from './serve.mjs';
import {orderedRuns,metadata,cells} from './observations-view.js';
import {renderObservations} from './render-observations.mjs';
const root=new URL('.',import.meta.url),require=createRequire(import.meta.url);
const data=JSON.parse(await readFile(new URL('observations.json',root),'utf8'));
const runs=orderedRuns(data),latest=runs[0];
const engine=process.env.BROWSER||'chromium', channel=process.env.CHANNEL||undefined;
const receipt={date:new Date().toISOString(),scope:'Présentation uniquement ; aucun relevé comportemental créé.',browser:engine,channel:channel||'bundled',playwright:require('playwright/package.json').version,scenarios:[],checks:[],limits:[],passed:false};
const originalArchive=await readFile(new URL('observations.json',root));
let server,browser;
try {
 await renderObservations({check:true});
 receipt.manifest=JSON.parse(await readFile(new URL('presentation-manifest.json',root),'utf8'));
 if(!process.env.BASE_URL) server=await serve({port:0});
 const base=process.env.BASE_URL||`http://127.0.0.1:${server.address().port}/html-aria-agent-demo/`;
 receipt.baseURL=base;
 browser=await ({chromium,firefox,webkit})[engine].launch({headless:true,...(channel?{channel}:{})});receipt.browserVersion=browser.version();
 if(process.env.BASE_URL) {
  const context=await browser.newContext();
  for(const [file,hash] of Object.entries(receipt.manifest.hashes)) {
   const r=await context.request.get(new URL(file,base).href);assert.equal(r.status(),200,file);
   assert.equal(createHash('sha256').update(await r.body()).digest('hex'),hash,file);
  }
  await context.close();receipt.checks.push('Octets servis identiques au manifeste de présentation');
 }
 for(const width of [390,1280]) for(const mode of ['js','no-js','json-blocked','json-invalid']) {
  const context=await browser.newContext({viewport:{width,height:900},locale:'fr-FR',javaScriptEnabled:mode!=='no-js'});
  if(mode==='json-blocked') await context.route('**/observations.json',r=>r.abort());
  if(mode==='json-invalid') await context.route('**/observations.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{"runs":[{}]}'}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);
  if(mode==='js') await page.waitForFunction(()=>!document.querySelector('#run').disabled);
  if(mode.startsWith('json-')) await page.waitForFunction(()=>document.querySelector('#history-status').textContent.includes('Chargement de l’historique échoué'));
  assert.equal(await page.locator('#run-meta').textContent(),metadata(latest?.run));
  for(const [i,v] of ['a','b','c'].entries()) assert.deepEqual(await page.locator('#observed tr').nth(i).locator('th,td').allTextContents(),cells(latest?.run,v));
  assert.equal(await page.locator('label[for=run]').count(),1);
  assert.equal(await page.locator('div.diagram[aria-label]').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'viewport overflow');
  if(mode==='js') {
   let found=false;
   for(let i=0;i<30;i++){await page.keyboard.press('Tab');if(await page.locator('#run').evaluate(e=>e===document.activeElement)){found=true;break;}}
   assert(found,'select reached with natural Tab');
   const focus=await page.locator('#run').evaluate(e=>({visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle}));assert(focus.visible&&focus.outline!=='none');
   if(runs.length>1) {
    // The first ArrowDown may open a native macOS select; the next moves its option.
    await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    let value=await page.locator('#run').inputValue();
    if(value===String(latest.index)) {
     receipt.limits.push(`${width}px: native menu did not accept simulated arrows in headless ${engine} on ${process.platform}; selection change below uses selectOption, not a keyboard proof. Check the native menu in a visible browser separately.`);
     await page.keyboard.press('Escape');
     await page.locator('#run').selectOption(String(runs[1].index));
     value=await page.locator('#run').inputValue();
    }
    assert.notEqual(value,String(latest.index));
    const selected=runs.find(r=>String(r.index)===value).run;
    assert.equal(await page.locator('#run-meta').textContent(),metadata(selected));
    for(const [i,v] of ['a','b','c'].entries()) assert.deepEqual(await page.locator('#observed tr').nth(i).locator('th,td').allTextContents(),cells(selected,v));
   }
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'table-wrap');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'observations.json');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.href),'https://github.com/edikkaweb/html-aria-agent-demo/blob/main/TESTING.md');
  } else assert.equal(await page.locator('#run').isEnabled(),false);
  for(const href of ['observations.json','https://github.com/edikkaweb/html-aria-agent-demo/blob/main/TESTING.md','https://github.com/edikkaweb/html-aria-agent-demo/blob/main/README.md','https://www.edikka.com/bibliotheque#instrument-professional-website-accessibility-foundation']) assert(await page.locator(`a[href="${href}"]`).count()>0,href);
  if(mode==='no-js') assert(await page.locator('noscript').isVisible());
  assert.deepEqual(errors,[]);
  await page.screenshot({path:fileURLToPath(new URL(`preview-${engine}-${width}-${mode}.png`,root)),fullPage:true});
  receipt.scenarios.push({width,mode,passed:true});await context.close();
 }
 assert.equal((await readFile(new URL('observations.json',root))).equals(originalArchive),true,'archive unchanged');
 receipt.checks.push('Archive comportementale inchangée','Génération cohérente','Date/configuration/statut et cellules fidèles','Clavier naturel, focus, liens et repli vérifiés');receipt.passed=true;
} catch(e) {receipt.error=e.stack;process.exitCode=1;}
finally {
 await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));
 await writeFile(new URL('presentation-check.json',root),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({browser:receipt.browser,version:receipt.browserVersion,scenarios:receipt.scenarios,passed:receipt.passed,limits:receipt.limits,error:receipt.error},null,2));
}
