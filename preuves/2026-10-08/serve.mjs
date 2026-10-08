import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT || 8765);
http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/' || /^\/(original|contrast|no-pointer)\/index.html$/.test(pathname)){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end('<!doctype html><html lang="fr"><meta charset="utf-8"><title>Copies de la démonstration</title><h1>Copies de la démonstration</h1><p>Index local de reproduction. Les trois séries sont séparées.</p>'+['original','contrast','no-pointer'].map(d=>'<h2>'+d+'</h2><ul>'+['a','b','c'].map(v=>`<li><a href="/${d}/${v}.html">Variante ${v.toUpperCase()}</a></li>`).join('')+'</ul>').join('')+'</html>');return;
  }
  if(!/^\/(original|contrast|no-pointer)\/[a-z.-]+$/.test(pathname)){res.writeHead(404);res.end();return;}
  const file=path.join(root,pathname);if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(fs.readFileSync(file));
}).listen(port,'127.0.0.1',()=>console.log(`Démonstration : http://127.0.0.1:${port}/`));
