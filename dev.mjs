// Servidor local: serve a página e roda api/cadastro.mjs com as variáveis do .env.
// Uso: node --env-file=.env dev.mjs   →   http://127.0.0.1:8765/?teste=1   (outra porta: PORT=8780 node ...)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { POST } from './api/cadastro.mjs';

const RAIZ = import.meta.dirname;
const PORTA = Number(process.env.PORT) || 8765;
const TIPOS = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.md':'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORTA}`);
  if (url.pathname === '/api/cadastro') {
    if (req.method !== 'POST') return res.writeHead(405).end();
    const partes = []; for await (const p of req) partes.push(p);
    const r = await POST(new Request(url, { method:'POST', headers:{ 'Content-Type':req.headers['content-type'] ?? '' }, body:Buffer.concat(partes) }));
    return res.writeHead(r.status, { 'Content-Type':r.headers.get('content-type') }).end(Buffer.from(await r.arrayBuffer()));
  }
  const relativo = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const caminho = normalize(join(RAIZ, relativo));
  // nada fora da pasta nem arquivo oculto (o .env não pode ser servido)
  if (!caminho.startsWith(RAIZ + sep) || relativo.split('/').some((s) => s.startsWith('.'))) return res.writeHead(404).end();
  try { const dados = await readFile(caminho); res.writeHead(200, { 'Content-Type':TIPOS[extname(caminho)] ?? 'application/octet-stream' }).end(dados); }
  catch { res.writeHead(404).end(); }
}).listen(PORTA, '127.0.0.1', () => console.log(`Roleta local: http://127.0.0.1:${PORTA}/?teste=1`));
