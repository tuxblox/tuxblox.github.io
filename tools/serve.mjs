// Serves _site/ locally the way GitHub Pages resolves URLs, which a plain
// static server does not: /releases is releases.html, /docs redirects to
// /docs/ and serves its index.html, and anything missing gets 404.html.
//
//   node tools/serve.mjs [dir] [port]      defaults: _site 8000
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.sh': 'application/x-sh',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

function isFile(p) {
    try { return fs.statSync(p).isFile(); } catch { return false; }
}

function isDir(p) {
    try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

// -> { status: 200|404, file } or { status: 301, location }
export function resolvePath(root, urlPath) {
    const notFound = { status: 404, file: path.join(root, '404.html') };

    let decoded;
    try { decoded = decodeURIComponent(urlPath); } catch { return notFound; }

    const full = path.join(root, decoded);
    if (full !== root && !full.startsWith(root + path.sep)) return notFound;

    if (decoded.endsWith('/')) {
        const index = path.join(full, 'index.html');
        return isFile(index) ? { status: 200, file: index } : notFound;
    }
    if (isFile(full)) return { status: 200, file: full };
    if (isDir(full)) return { status: 301, location: `${decoded}/` };
    if (isFile(`${full}.html`)) return { status: 200, file: `${full}.html` };
    return notFound;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const root = path.resolve(process.argv[2] || '_site');
    const port = Number(process.argv[3] || 8000);

    http.createServer((req, res) => {
        const result = resolvePath(root, new URL(req.url, 'http://localhost').pathname);
        if (result.status === 301) {
            res.writeHead(301, { Location: result.location });
            res.end();
            return;
        }
        if (!isFile(result.file)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        res.writeHead(result.status, { 'Content-Type': MIME_TYPES[path.extname(result.file)] || 'application/octet-stream' });
        fs.createReadStream(result.file).pipe(res);
    }).listen(port, '127.0.0.1', () => {
        console.log(`Serving ${root} at http://127.0.0.1:${port}/`);
    });
}
