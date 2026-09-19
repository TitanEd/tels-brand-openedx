#!/usr/bin/env node
/**
 * Local brand CDN for development.
 *
 * Paragon's `serve-theme-css` only allows *.css + theme-urls.json, so @font-face
 * urls like ./fonts/Merriweather-Light.woff return 403 and the browser falls
 * back to a system serif (wrong weight + glyph width vs PLL).
 *
 * This server serves the whole dist/ tree with CORS (CSS, fonts, assets).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ROOT = path.resolve(__dirname, '..', 'dist');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, status, body, type = 'text/plain') {
  setCors(res);
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.end(body);
}

if (!fs.existsSync(ROOT)) {
  console.error(`Missing ${ROOT}. Run \`make build\` first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  } catch {
    send(res, 400, 'Bad request');
    return;
  }

  if (pathname === '/') {
    pathname = '/theme-urls.json';
  }

  const fullPath = path.normalize(path.join(ROOT, pathname));
  if (!fullPath.startsWith(ROOT + path.sep) && fullPath !== ROOT) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      send(res, 404, 'File not found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    setCors(res);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    fs.createReadStream(fullPath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Tels brand CDN at http://${HOST}:${PORT}`);
  console.log(`  CSS:   http://127.0.0.1:${PORT}/core.min.css`);
  console.log(`  Fonts: http://127.0.0.1:${PORT}/fonts/Merriweather-Light.woff`);
});
