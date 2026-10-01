import {readFile, writeFile, rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {staticHTML} from './observations-view.js';
const root = new URL('.', import.meta.url);
export async function renderObservations({check=false}={}) {
  const template = await readFile(new URL('index.template.html',root),'utf8');
  if (template.split('<!-- OBSERVATIONS -->').length!==2) throw new Error('Un seul emplacement OBSERVATIONS requis');
  const data = JSON.parse(await readFile(new URL('observations.json',root),'utf8'));
  const html = template.replace('<!-- OBSERVATIONS -->',staticHTML(data));
  const files = ['index.template.html','observations.json','observations-view.js','results.js','presentation.css','render-observations.mjs','index.html'];
  const hashes = {};
  for (const file of files) hashes[file] = createHash('sha256').update(file==='index.html'?html:await readFile(new URL(file,root))).digest('hex');
  const manifest = JSON.stringify({scope:'Présentation générée uniquement ; ne valide pas les variantes et ne modifie aucun relevé.',method:'SHA-256 des octets ; manifeste exclu de lui-même.',source:'observations.json',selection:'date UTC décroissante, puis index décroissant, sans filtrage de statut',hashes},null,2)+'\n';
  for(const [file,content] of [['index.html',html],['presentation-manifest.json',manifest]]) {
    if(check) {if(await readFile(new URL(file,root),'utf8')!==content) throw new Error(`${file} doit être régénéré`);}
    else {await writeFile(new URL(file+'.tmp',root),content);await rename(new URL(file+'.tmp',root),new URL(file,root));}
  }
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  await renderObservations({check:process.argv.includes('--check')});
  console.log('Présentation statique et manifeste : cohérents.');
}
