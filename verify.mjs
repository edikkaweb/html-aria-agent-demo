import { chromium, firefox, webkit } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import { renderObservations } from './render-observations.mjs';

const root = new URL('.', import.meta.url);
const require = createRequire(import.meta.url);
const engine = process.env.BROWSER || 'chromium';
const channel = process.env.CHANNEL || undefined;
const remote = process.env.BASE_URL;
const sourceFiles = ['a.html','b.html','c.html','experiment.js','styles.css','verify.mjs','serve.mjs','package.json','package-lock.json'];
const hashes = {};
for (const file of sourceFiles) hashes[file] = createHash('sha256').update(await readFile(new URL(file, root))).digest('hex');
const sourceRevision = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
// Fail before running rather than silently replacing an unreadable archive.
const archiveBefore = await readFile(new URL('observations.json',root),'utf8');
const observations = JSON.parse(archiveBefore);
if (!Array.isArray(observations.runs)) throw new Error('Archive invalide');
const run = {
  provenanceVersion: 2, scope: 'Comportement des variantes A/B/C ; présentation contrôlée séparément.',
  date: new Date().toISOString(), environment: remote ? 'publication' : 'serveur local sous un chemin de projet',
  browser: engine, channel: channel || 'bundled', browserVersion: 'Non testé',
  playwright: require('playwright/package.json').version, node: process.version,
  platform: `${os.platform()} ${os.release()} ${os.arch()}`,
  command: `${remote ? 'BASE_URL=<URL vérifiée> ' : ''}BROWSER=${engine}${channel ? ` CHANNEL=${channel}` : ''} npm test`,
  sourceRevision, sourceHashes: hashes, sourceRevisionMethod: 'SHA-256 du manifeste ordonné des pages expérimentales, dépendances et outillage ; index.html, observations.json et fichiers de présentation exclus. Les anciens relevés sans provenanceVersion gardent leur manifeste historique.',
  snapshotAPI: 'locator.ariaSnapshot(), options par défaut, capturé avant interaction, compteur à zéro',
  keyboardMethod: 'Contexte neuf par essai ; Tab depuis le document, aucun focus forcé ; keyboard.press pour Entrée/Espace.',
  viewport: { width: 1280, height: 900 }, checks: [], variants: [], pageErrors: [], networkErrors: [],
  screenReaders: 'Non testé', agents: 'Non testé', passed: false
};
const check = (name, actual, expected) => run.checks.push({ name, actual, expected, passed: JSON.stringify(actual) === JSON.stringify(expected) });
const active = page => page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, text: document.activeElement.textContent.trim().slice(0,100) }));
let server, browser;
try {
  if (!['chromium','firefox','webkit'].includes(engine)) throw new Error('BROWSER doit être chromium, firefox ou webkit');
  if (!remote) server = await serve({ port: 0 });
  const base = remote || `http://127.0.0.1:${server.address().port}/html-aria-agent-demo/`;
  if (!base.endsWith('/')) throw new Error('BASE_URL doit se terminer par /');
  run.baseURL = base;
  browser = await ({ chromium, firefox, webkit })[engine].launch({ headless: true, ...(channel ? { channel } : {}) });
  run.browserVersion = browser.version();
  if (remote) {
    const verificationContext = await browser.newContext();
    run.publishedSourceHashes = {};
    for (const file of sourceFiles) {
      const response = await verificationContext.request.get(new URL(file,base).href);
      check(`Source publiée ${file}: HTTP`,response.status(),200);
      run.publishedSourceHashes[file] = createHash('sha256').update(await response.body()).digest('hex');
      check(`Source publiée ${file}: contenu identique`,run.publishedSourceHashes[file],hashes[file]);
    }
    await verificationContext.close();
  }
  async function fresh(variant, options = {}) {
    const context = await browser.newContext({ viewport: run.viewport, locale: 'fr-FR', ...options });
    const page = await context.newPage();
    page.on('pageerror', error => run.pageErrors.push(error.message));
    page.on('response', response => { if(response.status() >= 400) run.networkErrors.push({url:response.url(),status:response.status()}); });
    await page.goto(`${base}${variant}.html`, { waitUntil: 'networkidle' });
    return { context, page };
  }
  const normalized = [];
  for (const variant of ['a','b','c']) {
    const source = await readFile(new URL(`${variant}.html`,root),'utf8');
    normalized.push(source.replace(/<(div|button) class="command" id="command"[^>]*>Ajouter au panier<\/(div|button)>/,'__COMMAND__'));
    const entry = { variant, initialCount: null, commandSnapshot: '', pageSnapshot: '', clickCounts: [], keyboard: {reached:false, enterDelta:null,spaceDelta:null,status:'Non testé'}, errors: [] };
    run.variants.push(entry);
    let session = await fresh(variant);
    entry.initialCount = Number(await session.page.locator('#count').innerText());
    check(`${variant}: compteur initial`,entry.initialCount,0);
    entry.pageSnapshot = await session.page.locator('body').ariaSnapshot();
    entry.commandSnapshot = await session.page.locator('#command').ariaSnapshot();
    entry.buttonRoleCount = await session.page.getByRole('button',{name:'Ajouter au panier',exact:true}).count();
    check(`${variant}: rôle bouton`,entry.buttonRoleCount,variant==='a'?0:1);
    entry.dom = await session.page.locator('#command').evaluate(element => {
      const box=element.getBoundingClientRect(), css=getComputedStyle(element);
      return { tag:element.tagName,role:element.getAttribute('role'),tabindex:element.getAttribute('tabindex'),type:element.getAttribute('type'),text:element.textContent,box:{x:box.x,y:box.y,width:box.width,height:box.height},style:{font:css.font,background:css.backgroundColor,color:css.color,padding:css.padding,border:css.border,borderRadius:css.borderRadius} };
    });
    entry.environmentText = await session.page.locator('body').innerText();
    entry.clickCounts.push(entry.initialCount);
    for(let i=1;i<=3;i++) { await session.page.locator('#command').click(); entry.clickCounts.push(Number(await session.page.locator('#count').innerText())); }
    check(`${variant}: clics successifs`,entry.clickCounts,[0,1,2,3]);
    await session.page.getByRole('button',{name:'Vider le panier'}).click();
    check(`${variant}: remise à zéro`,Number(await session.page.locator('#count').innerText()),0);
    await session.context.close();

    session=await fresh(variant);
    entry.keyboard.initialFocus=await active(session.page);
    entry.keyboard.forward=[];
    for(let i=0;i<5;i++) {
      await session.page.keyboard.press('Tab');
      const step=await active(session.page); entry.keyboard.forward.push(step);
      if(step.id==='command') entry.keyboard.reached=true;
      if(step.id==='reset') break;
    }
    check(`${variant}: parcours Tab jusqu’à reset`,entry.keyboard.forward.map(step=>step.id),variant==='c'?['start','command','reset']:['start','reset']);
    await session.page.keyboard.press('Shift+Tab');
    entry.keyboard.backward=await active(session.page);
    check(`${variant}: retour Maj+Tab`,entry.keyboard.backward.id,variant==='c'?'command':'start');
    await session.context.close();

    // Chaque activation est testée dans une session neuve, après tabulation seulement.
    for(const key of ['Enter','Space']) {
      session=await fresh(variant);
      const traversal=[];
      let reached=false;
      for(let i=0;i<5;i++) {
        await session.page.keyboard.press('Tab'); const step=await active(session.page); traversal.push(step);
        if(step.id==='command') {reached=true;break;}
        if(step.id==='reset') break;
      }
      if(reached) {
        const before=Number(await session.page.locator('#count').innerText());
        const focusStyle=await session.page.locator('#command').evaluate(el=>({visible:el.matches(':focus-visible'),outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}));
        check(`${variant}: focus visible ${key}`,focusStyle.visible && focusStyle.outline!=='none' && focusStyle.width!=='0px',true);
        await session.page.keyboard.press(key);
        const after=Number(await session.page.locator('#count').innerText());
        entry.keyboard[key==='Enter'?'enterDelta':'spaceDelta']=after-before;
        entry.keyboard[key]={traversal,before,after,focusStyle};
        check(`${variant}: activation ${key}`,after-before,1);
        entry.keyboard.status='Testé après tabulation naturelle';
      } else entry.keyboard[key]={traversal,status:'Non testé — commande non atteinte par Tab'};
      await session.context.close();
    }
  }
  check('Contexte HTML identique hors commande',normalized.every(html=>html===normalized[0]),true);
  check('Texte visible identique',run.variants.every(entry=>entry.environmentText===run.variants[0].environmentText),true);
  check('Position et dimensions identiques',run.variants.every(entry=>JSON.stringify(entry.dom.box)===JSON.stringify(run.variants[0].dom.box)),true);
  check('Style identique',run.variants.every(entry=>JSON.stringify(entry.dom.style)===JSON.stringify(run.variants[0].dom.style)),true);
  check('Libellé identique',run.variants.every(entry=>entry.dom.text==='Ajouter au panier'),true);
  check('Aucun tabindex ajouté',run.variants.every(entry=>entry.dom.tabindex===null),true);
  const sharedScript=await readFile(new URL('experiment.js',root),'utf8');
  check('Un gestionnaire click commun sur command',/command\.addEventListener\('click', addOne\)/.test(sharedScript),true);
  check('Aucun gestionnaire clavier ou focus()',/addEventListener\(['"]key|\.focus\(/.test(sharedScript),false);

  const withoutJS=await fresh('c',{javaScriptEnabled:false});
  check('Avertissement sans JavaScript visible',await withoutJS.page.locator('noscript').isVisible(),true);
  await withoutJS.context.close();
  check('Aucune erreur JavaScript',run.pageErrors,[]);
  check('Aucune réponse HTTP en erreur',run.networkErrors,[]);
  run.passed=run.checks.every(check=>check.passed);
} catch(error) { run.fatal=error.message; }
finally {
  if(browser) await browser.close();
  if(server) await new Promise(resolve=>server.close(resolve));
  if (await readFile(new URL('observations.json',root),'utf8') !== archiveBefore) throw new Error('Archive modifiée pendant les essais ; aucune écriture concurrente permise');
  observations.runs.push(run);
  await writeFile(new URL('observations.json',root),JSON.stringify(observations,null,2)+'\n');
  await renderObservations();
  console.log(JSON.stringify({date:run.date,browser:run.browser,version:run.browserVersion,passed:run.passed,checks:run.checks.length,failures:run.checks.filter(check=>!check.passed),fatal:run.fatal,sourceRevision},null,2));
  if(!run.passed) process.exitCode=1;
}
