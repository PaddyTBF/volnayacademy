import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
createServer(async (req, res) => {
  let path = new URL(req.url, 'http://localhost').pathname;
  // Match GitHub Pages' repository path in local previews.
  path = path.replace(/^\/volnayacademy\/?/, '/');
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(root, '.' + path);
  if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try {
    res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer'});
    res.end(await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4173/volnayacademy/ (production tracking disabled on localhost)'));

