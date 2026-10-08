import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export function serve({ port = 4173, root = fileURLToPath(new URL('.', import.meta.url)), prefix = '/html-aria-agent-demo/' } = {}) {
  const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', json: 'application/json; charset=utf-8', md: 'text/plain; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', yml: 'text/plain; charset=utf-8' };
  const server = http.createServer(async (request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/' || path === prefix.slice(0, -1)) { response.writeHead(302, { Location: prefix }); response.end(); return; }
    const relative = path.startsWith(prefix) ? decodeURIComponent(path.slice(prefix.length)) : '';
    const name = relative || 'index.html';
    if (!path.startsWith(prefix) || basename(name) !== name || name.startsWith('.')) { response.writeHead(404); response.end('Not found'); return; }
    try { const bytes = await readFile(resolve(root, name)); response.writeHead(200, { 'Content-Type': types[name.split('.').pop()] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(bytes); }
    catch { response.writeHead(404); response.end('Not found'); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  await serve({ port });
  console.log(`Démonstration : http://127.0.0.1:${port}/html-aria-agent-demo/`);
}
