import {test} from 'node:test';
import assert from 'node:assert/strict';
import {orderedRuns, cells, staticHTML, metadata} from './observations-view.js';
import {readFile} from 'node:fs/promises';
const make = (date,passed=true) => ({date,passed,browser:'fixture',variants:[]});
test('latest by date, not append order or success; deterministic tie',()=>{
 const a=make('2026-10-01T01:00:00Z'),b=make('2026-10-01T02:00:00Z',false),c={...b,fatal:'Interrompu'};
 assert.deepEqual(orderedRuns({runs:[b,c,a]}).map(x=>x.index),[1,0,2]);
 assert.match(staticHTML({runs:[a,b]}),/Échec des contrôles/);
 assert.match(metadata(c),/Interrompu — échec/);
});
test('invalid archive refuses generation; empty is explicitly untested',()=>{
 assert.throws(()=>orderedRuns({runs:[{}]}));assert.throws(()=>orderedRuns({}));
 assert.match(staticHTML({runs:[]}),/Aucune exécution archivée/);
});
test('interrupted, absent, not reached and measured zero stay distinct',()=>{
 const run={variants:[{variant:'a',clickCounts:[0],keyboard:{reached:false,enterDelta:null,spaceDelta:null},commandSnapshot:''}]};
 assert.match(cells(run,'a')[1],/0 \(relevé partiel\)/);assert.match(cells(run,'a')[2],/Non testé/);
 run.variants[0].keyboard.forward=[{id:'start'},{id:'reset'}];
 assert.match(cells(run,'a')[2],/Non atteinte par Tab/);
 run.variants[0].keyboard.enterDelta=0;assert.match(cells(run,'a')[3],/Entrée : \+0/);
 assert.match(cells(run,'b')[1],/relevé absent/);
});
test('archive strings are escaped in generated markup',()=>{
 const run={...make('2026-10-01T01:00:00Z'),fatal:'<img src=x onerror=alert(1)>'};
 const html=staticHTML({runs:[run]});assert(!html.includes('<img'));assert(html.includes('&lt;img'));
});
test('published data renders observed values and non-tested activation honestly',async()=>{
 const data=JSON.parse(await readFile(new URL('observations.json',import.meta.url)));const run=data.runs.find(r=>r.date==='2026-10-01T03:53:29.136Z');assert(run);
 assert.equal(cells(run,'a')[1],'0 → 1 → 2 → 3');assert.match(cells(run,'b')[3],/Non testé/);
 assert.match(cells(run,'c')[3],/Entrée : \+1 ; Espace : \+1/);
});
