import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const output=path.resolve(root,process.env.MEASURE_OUTPUT || `runs/${new Date().toISOString().replaceAll(':','-')}`);
assert(!fs.existsSync(output),'Use a new output directory; recorded evidence is never overwritten.');
fs.mkdirSync(output,{recursive:true});
const save=(name,data)=>fs.writeFileSync(path.join(output,name),JSON.stringify(data,null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mcpRequire=createRequire(require.resolve('@playwright/mcp/package.json'));
const report={startedAt:new Date().toISOString(),os:{platform:os.platform(),release:os.release(),arch:os.arch()},node:process.version,versions:{mcp:require('@playwright/mcp/package.json').version,mcpPlaywright:mcpRequire('playwright/package.json').version,playwright:require('@playwright/test/package.json').version},sourceCommit:'ae880251a7e8b40ceaed41e4eca2b7b82137d762',sources:{},mcp:[],keyboard:[],representations:[],activation:[],checks:[],passed:false};
const check=(name,actual,expected)=>{report.checks.push({name,actual,expected});assert.deepEqual(actual,expected,name);};
for(const dataset of ['original','no-pointer']){
 report.sources[dataset]={};
 for(const f of ['a.html','b.html','c.html','styles.css','experiment.js'])report.sources[dataset][f]=sha(fs.readFileSync(path.join(root,dataset,f)));
}
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!/^\/(original|no-pointer)\/(a\.html|b\.html|c\.html|styles\.css|experiment\.js)$/.test(pathname)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',pathname.endsWith('.css')?'text/css':pathname.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
 res.end(fs.readFileSync(path.join(root,pathname)));
});
const textOf=r=>r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
const yamlOf=s=>s.match(/```yaml\n([\s\S]*?)\n```/)?.[1];
let browser;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({channel:'chrome',headless:true});report.chrome=browser.version();
 for(const variant of ['a','b','c']){
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'fr-FR'});
  const page=await context.newPage();await page.goto(`${base}/original/${variant}.html`);
  const targeted=await page.locator('#command').ariaSnapshot();
  const body=await page.locator('body').ariaSnapshot();
  const cdp=await context.newCDPSession(page);const ax=await cdp.send('Accessibility.getFullAXTree');
  const exposedNotes=ax.nodes.filter(n=>!n.ignored&&n.name?.value==='NOTES');
  save(`representations-${variant}.json`,{variant,targeted,body,ax,notesInDefaultSnapshot:body.includes('NOTES'),exposedNotes});
  report.representations.push({variant,targeted,notesInDefaultSnapshot:body.includes('NOTES'),exposedNotesCount:exposedNotes.length});
  check(`NOTES absent default snapshot ${variant}`,body.includes('NOTES'),false);
  check(`NOTES absent exposed AX nodes ${variant}`,exposedNotes.length,0);
  await context.close();
 }
 // Each method starts in a fresh context. The -1 variant is an explicit extra case.
 for(const variant of ['b','c','c-tabindex-minus-one'])for(const method of ['click','press','tab']){
  const context=await browser.newContext({viewport:{width:1280,height:900},locale:'fr-FR'});
  const page=await context.newPage();await page.goto(`${base}/original/${variant==='b'?'b':'c'}.html`);
  if(variant==='c-tabindex-minus-one')await page.locator('#command').evaluate(el=>el.setAttribute('tabindex','-1'));
  let beforeActivation=null;
  const locator=page.getByRole('button',{name:'Ajouter au panier',exact:true});
  if(method==='click')await locator.click();
  if(method==='press')await locator.press('Enter');
  if(method==='tab'){await page.keyboard.press('Tab');await page.keyboard.press('Tab');beforeActivation=await page.evaluate(()=>({id:document.activeElement.id,text:document.activeElement.textContent}));await page.keyboard.press('Enter');}
  const result=await page.evaluate(()=>({count:document.querySelector('#count').textContent,focused:document.activeElement.id,tabIndex:document.querySelector('#command').tabIndex}));
  report.activation.push({variant,method,beforeActivation,...result});
  check(`${variant} ${method}`,result.count,method==='click'||(variant==='c')||(method==='press'&&variant==='c-tabindex-minus-one')?'1':'0');
  await context.close();
 }
 await browser.close();browser=null;
 for(const dataset of ['original','no-pointer'])for(const variant of ['a','b','c']){
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'node_modules/@playwright/mcp/cli.js'),'--browser','chrome','--headless','--isolated','--viewport-size','1280,900','--output-dir',path.join(output,'mcp-output')],stderr:'pipe'});
  let stderr='';transport.stderr?.on('data',d=>stderr+=d);
  const client=new Client({name:'article-alsacreations-complement',version:'2.1.0'});
  const record={dataset,variant,calls:[]};
  const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args});record.calls.push({name,arguments:args,result});if(result.isError)throw new Error(textOf(result));return result;};
  try{
   await client.connect(transport);
   if(dataset==='original'&&variant==='a'){const tools=await client.listTools();save('mcp-tools.json',tools);check('browser_click target supported',!!tools.tools.find(t=>t.name==='browser_click').inputSchema.properties.target,true);}
   await call('browser_navigate',{url:`${base}/${dataset}/${variant}.html`});
   const snapshot=textOf(await call('browser_snapshot'));record.yaml=yamlOf(snapshot);assert(record.yaml,'YAML snapshot missing');
   record.line=record.yaml.split('\n').find(l=>l.includes('Ajouter au panier')&&l.includes('[ref=')).trim();
   record.ref=record.line.match(/\[ref=([^\]]+)\]/)[1];
   await call('browser_evaluate',{function:'() => ({count:document.querySelector("#count").textContent,tabIndex:document.querySelector("#command").tabIndex,userAgent:navigator.userAgent})'});
   await call('browser_click',{target:record.ref});
   const after=textOf(await call('browser_evaluate',{function:'() => ({count:document.querySelector("#count").textContent,tabIndex:document.querySelector("#command").tabIndex})'}));
   record.after=JSON.parse(after.match(/### Result\s*([\s\S]*?)(?=\n###|$)/)[1]);record.stderr=stderr;
   save(`mcp-${dataset}-${variant}.json`,record);
   report.mcp.push({dataset,variant,line:record.line,after:record.after,yaml:record.yaml});
   check(`MCP count ${dataset}/${variant}`,record.after.count,'1');
   check(`MCP cursor ${dataset}/${variant}`,record.line.includes('[cursor=pointer]'),dataset==='original');
   check(`MCP NOTES ${dataset}/${variant}`,record.yaml.includes('NOTES'),true);
   console.log(JSON.stringify({dataset,variant,line:record.line,after:record.after}));
  }finally{await client.close();}
 }
 for(const dataset of ['original','no-pointer'])check(`MCP complete YAML B/C ${dataset}`,report.mcp.find(x=>x.dataset===dataset&&x.variant==='b').yaml,report.mcp.find(x=>x.dataset===dataset&&x.variant==='c').yaml);
 for(const variant of ['a','b','c']){
  const file=path.join(output,`keyboard-original-${variant}.json`);
  const child=spawn(process.execPath,[path.join(root,'node_modules/@playwright/test/cli.js'),'test','--config',path.join(root,'playwright.config.cjs')],{cwd:root,env:{...process.env,DEMO_BASE_URL:`${base}/original/`,VARIANT:variant,KEYBOARD_REPORT:file},stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
  const exit=await new Promise(resolve=>child.on('close',resolve));const result=JSON.parse(fs.readFileSync(file));
  report.keyboard.push({variant,exit,stats:result.stats,stderr});
  check(`Keyboard ${variant}`,{exit,passed:result.stats.expected,failed:result.stats.unexpected},variant==='c'?{exit:0,passed:2,failed:0}:{exit:1,passed:0,failed:2});
 }
 report.passed=true;
}catch(e){report.error=e.stack;process.exitCode=1;console.error(e);}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));report.completedAt=new Date().toISOString();save('measurements.json',report);console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,versions:report.versions,chrome:report.chrome,error:report.error}));
}
