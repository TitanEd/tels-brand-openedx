#!/usr/bin/env node
/*
 * npm run serve: the theme CSS that MFEs load through PARAGON_THEME_URLS brandOverride (Tutor plugin
 * BRAND_THEME_SOURCE = "development" -> http://localhost:3000). Serves dist/ (core, fonts, theme-urls.json), except
 * light(.min).css and dark(.min).css, which carry the values saved on the preview page (npm run preview), or the
 * values being previewed while a preview is on (scripts/saved-theme.js), and the fonts uploaded on the preview page
 * (uploaded-fonts/<file>, which those stylesheets load with @font-face). Nothing is cached, so a reload of an MFE
 * page shows the latest values.
 *   THEME_PORT=3001 THEME_HOST=127.0.0.1 npm run serve
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DIST, MODES, themeFile } = require('./saved-theme');

const PORT = Number(process.env.THEME_PORT) || 3000;
const HOST = process.env.THEME_HOST || '0.0.0.0';
const TYPES = {
  '.css': 'text/css', '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

http.createServer((req, res) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
  let file = null;
  try {
    file = themeFile(decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, ''));
  } catch (e) {
    console.error(e);
  }
  if (!['GET', 'HEAD'].includes(req.method) || !file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/plain' });
    res.end(`Not found: ${req.url}`);
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => {
  if (!fs.existsSync(path.join(DIST, 'light.css'))) { console.warn('dist/ is empty: run "make build" first.'); }
  const base = `http://${HOST}:${PORT}`;
  console.log(`Theme CSS for PARAGON_THEME_URLS brandOverride: ${base}`);
  console.log(`  core: ${base}/core.min.css`);
  MODES.forEach((mode) => console.log(`  ${mode}: ${base}/${mode}.min.css (with the values saved or previewed on the preview page)`));
  console.log('Ctrl+C to stop.');
});
