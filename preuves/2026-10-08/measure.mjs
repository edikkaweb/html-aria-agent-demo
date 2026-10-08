import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {chromium} from '@playwright/test';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
const require=createRequire(import.meta.url);
const root=path.dirname(fileURLToPath(import.meta.url));
const results=path.resolve(root,process.env.MEASURE_OUTPUT || path.join('runs',new Date().toISOString().replaceAll(':','-'))); fs.mkdirSync(results,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const save=(name,data)=>fs.writeFileSync(path.join(results,name),JSON.stringify(data,null,2)+'\n');
const readVersion=p=>require(p+'/package.json').version;
const chromePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const manifest={date:new Date().toISOString(),node:process.version,os:{platform:os.platform(),release:os.release(),arch:os.arch()},versions:{playwright:readVersion('@playwright/test'),mcp:readVersion('@playwright/mcp'),mcpPlaywright:createRequire(require.resolve('@playwright/mcp/package.json'))('playwright/package.json').version,lighthouse:readVersion('lighthouse')},sources:{},mcp:[],keyboard:[],lighthouse:[],direct:[]};
for(const dataset of ['original','contrast','no-pointer']){
  fs.mkdirSync(path.join(root,dataset),{recursive:true});
  manifest.sources[dataset]={};
  for(const file of ['a.html','b.html','c.html','styles.css','experiment.js']){
    let bytes=fs.readFileSync(path.join(root,'original',file));
    if(file==='styles.css' && dataset==='contrast')bytes=Buffer.from(bytes.toString().replace('background:#687b40','background:#647640'));
    if(file==='styles.css' && dataset==='no-pointer')bytes=Buffer.from(bytes.toString()+'\n/* Contre-essai : seule cette propriété change. */\n.command { cursor: default; }\n');
    if(dataset!=='original')fs.writeFileSync(path.join(root,dataset,file),bytes);
    manifest.sources[dataset][file]=hash(bytes);
  }
}
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(original|contrast|no-pointer)\/[a-z.-]+$/.test(pathname)){res.writeHead(404);res.end();return;}
  const file=path.join(root,pathname); if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(fs.readFileSync(file));
});
const textOf=r=>r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
let browser;
try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({channel:'chrome',headless:true});
  manifest.chrome=browser.version();
  for(const dataset of ['original','contrast'])for(const variant of ['a','b','c']){
    const context=await browser.newContext({viewport:{width:1280,height:900},locale:'fr-FR'});
    const page=await context.newPage();await page.goto(`${base}/${dataset}/${variant}.html`);
    const entry={dataset,variant,snapshot:await page.locator('#command').ariaSnapshot(),tab:[]};
    for(let i=0;i<3;i++){await page.keyboard.press('Tab');entry.tab.push(await page.evaluate(()=>document.activeElement.id));}
    entry.dom=await page.locator('#command').evaluate(el=>({tag:el.tagName,tabIndex:el.tabIndex,role:el.getAttribute('role'),cursor:getComputedStyle(el).cursor}));
    manifest.direct.push(entry);
    await context.close();
  }
  await browser.close();browser=null;
  // Appels effectifs du protocole MCP ; aucune sélection par un modèle autonome.
  for(const dataset of ['original','no-pointer'])for(const variant of ['a','b','c']){
    const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/@playwright/mcp/cli.js'),'--browser','chrome','--headless','--isolated','--viewport-size','1280,900','--output-dir',path.join(results,'mcp-output')],stderr:'pipe'});
    let stderr='';transport.stderr?.on('data',d=>{stderr+=d.toString()});
    const client=new Client({name:'article-alsacreations-reproduction',version:'2.0.0'});
    const record={dataset,variant,calls:[]};
    const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args});record.calls.push({name,arguments:args,result});if(result.isError)throw new Error(textOf(result));return result;};
    try{
      await client.connect(transport);
      await call('browser_navigate',{url:`${base}/${dataset}/${variant}.html`});
      const snapshot=textOf(await call('browser_snapshot'));
      const line=snapshot.split('\n').find(l=>l.includes('Ajouter au panier')&&l.includes('[ref='));
      if(!line)throw new Error('Référence introuvable');
      record.line=line.trim();record.ref=line.match(/\[ref=([^\]]+)\]/)[1];
      await call('browser_evaluate',{function:'() => ({count:document.querySelector("#count").textContent,tabIndex:document.querySelector("#command").tabIndex,userAgent:navigator.userAgent})'});
      await call('browser_click',{element:'Ajouter au panier',ref:record.ref});
      const after=textOf(await call('browser_evaluate',{function:'() => ({count:document.querySelector("#count").textContent,tabIndex:document.querySelector("#command").tabIndex})'}));
      const resultSection=after.match(/### Result\s*([\s\S]*?)(?=\n###|$)/)?.[1];
      record.after=resultSection?JSON.parse(resultSection):after;
      record.stderr=stderr;save(`mcp-${dataset}-${variant}.json`,record);
      manifest.mcp.push({dataset,variant,line:record.line,after:record.after});
      console.log(JSON.stringify({mcp:dataset,variant,line:record.line,after:record.after}));
    }finally{await client.close();}
  }
  for(const dataset of ['original','contrast'])for(const variant of ['a','b','c']){
    const out=path.join(results,`keyboard-${dataset}-${variant}.json`);
    const child=spawn(process.execPath,[path.join(root,'node_modules/@playwright/test/cli.js'),'test','--config',path.join(root,'playwright.config.cjs')],{cwd:root,env:{...process.env,DEMO_BASE_URL:`${base}/${dataset}/`,VARIANT:variant,KEYBOARD_REPORT:out},stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
    const exit=await new Promise(resolve=>child.on('close',resolve));
    const report=JSON.parse(fs.readFileSync(out));
    const entry={dataset,variant,exit,stats:report.stats,stderr};manifest.keyboard.push(entry);
    console.log(JSON.stringify({keyboard:dataset,variant,exit,stats:report.stats}));
  }
  // Chrome neuf et audits séquentiels pour éviter une contention du navigateur.
  for(const dataset of ['original','contrast'])for(const variant of ['a','b','c']){
    const chrome=await chromeLauncher.launch({chromePath,chromeFlags:['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check']});
    try{
      const result=await lighthouse(`${base}/${dataset}/${variant}.html`,{port:chrome.port,onlyCategories:['accessibility','agentic-browsing'],output:['json','html'],logLevel:'error',formFactor:'desktop',screenEmulation:{mobile:false,width:1280,height:900,deviceScaleFactor:1,disabled:false}});
      save(`lighthouse-${dataset}-${variant}.json`,result.lhr);
      fs.writeFileSync(path.join(results,`lighthouse-${dataset}-${variant}.html`),result.report[1]);
      const refs=result.lhr.categories.accessibility.auditRefs;
      const failures=refs.map(r=>({...r,...result.lhr.audits[r.id]})).filter(a=>a.score!==null && a.score<1);
      const entry={dataset,variant,score:result.lhr.categories.accessibility.score,agentTree:result.lhr.audits['agent-accessibility-tree'],failures:failures.map(a=>({id:a.id,score:a.score,weight:a.weight,details:a.details})),environment:result.lhr.environment,settings:result.lhr.configSettings};
      manifest.lighthouse.push(entry);
      console.log(JSON.stringify({lighthouse:dataset,variant,score:entry.score,agentTree:entry.agentTree?.score,failures:entry.failures.map(f=>f.id)}));
    }finally{await chrome.kill();}
  }
}catch(e){manifest.error=e.stack;process.exitCode=1;console.error(e);}finally{
  if(browser)await browser.close();await new Promise(r=>server.close(r));save('measurements.json',manifest);
}
