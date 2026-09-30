#!/usr/bin/env node
/*
 * Local preview of the built design tokens on the real Paragon React components: global tokens (step 1),
 * one section per component (step 2) with an Edit form, and a list of every --pgn-* design token.
 *   npm run preview            -> http://127.0.0.1:8765/light.html and /dark.html
 *   PREVIEW_PORT=9000 npm run preview
 * Serves preview/index.html, preview/app.jsx bundled by esbuild (as /app.js), dist/ (as /brand) and
 * Paragon's own CSS (as /paragon), and /token-meta.json (which paragon/tokens/src file sets each --pgn-*
 * name, and which colors the build works out from another one: scripts/derived-tokens.js). Reads files on every request, so after "make build" a
 * browser refresh shows the new CSS.
 *
 * Saved values: GET / PUT /api/design-tokens/<light|dark> with { tokens, history, preview } (scripts/saved-theme.js).
 * Every PUT also writes the theme stylesheets that "npm run serve" (scripts/theme-server.js) sends to the MFEs.
 * Theme templates: GET / PUT /api/themes with { themes, selected }. Fonts: GET /api/fonts (the list), POST
 * /api/fonts?family=&weight=&style= (a font file), and the files as /uploaded-fonts/<file>.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const {
  DIST, addFont, checkSaved, checkThemes, fontFile, readFonts, readSaved, readThemes, writeSaved, writeThemeList,
} = require('./saved-theme');
const { derivedTokens } = require('./derived-tokens');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PREVIEW_PORT) || 8765;
const HOST = process.env.PREVIEW_HOST || '127.0.0.1';
const ROUTES = {
  '/brand/': DIST,
  '/paragon/': path.join(ROOT, 'node_modules/@openedx/paragon/dist'),
};
const PAGE = path.join(ROOT, 'preview/index.html');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

function resolveFile(urlPath) {
  if (['/', '/index.html', '/light.html', '/dark.html'].includes(urlPath)) { return PAGE; }
  const prefix = Object.keys(ROUTES).find((p) => urlPath.startsWith(p));
  if (!prefix) { return null; }
  const file = path.normalize(path.join(ROUTES[prefix], urlPath.slice(prefix.length)));
  return file.startsWith(ROUTES[prefix]) ? file : null;
}

// Paragon's breakpoints.js imports this SCSS module for its $grid-breakpoints map.
const scssExportsPlugin = {
  name: 'paragon-scss-exports',
  setup(build) {
    build.onLoad({ filter: /_exports\.module\.scss$/ }, () => ({
      contents: JSON.stringify({ xs: '0', sm: '576px', md: '768px', lg: '992px', xl: '1200px', xxl: '1400px' }),
      loader: 'json',
    }));
    build.onLoad({ filter: /\.s?css$/ }, () => ({ contents: '', loader: 'js' }));
  },
};

const bundler = esbuild.context({
  entryPoints: [path.join(ROOT, 'preview/app.jsx')],
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  loader: { '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.gif': 'dataurl' },
  define: { 'process.env.NODE_ENV': '"development"', global: 'window' },
  logLevel: 'silent',
  plugins: [scssExportsPlugin],
});

async function serveApp(res) {
  try {
    const result = await (await bundler).rebuild();
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    res.end(result.outputFiles[0].contents);
  } catch (error) {
    const message = (error.errors || [error]).map((e) => e.text || e.message).join('\n');
    console.error(`preview/app.jsx failed to bundle:\n${message}`);
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    res.end(`document.getElementById('root').innerText = ${JSON.stringify(`preview/app.jsx failed to bundle:\n${message}`)};`);
  }
}

// sources: --pgn-* name -> the token files that set it: { core, light, dark } (paths relative to paragon/tokens/src).
const TOKENS_SRC = path.join(ROOT, 'paragon/tokens/src');
function tokenCatalog() {
  const sources = {};
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); return; }
    if (!entry.name.endsWith('.json')) { return; }
    const rel = path.relative(TOKENS_SRC, file);
    const layer = rel.startsWith('core') ? 'core' : rel.split(path.sep)[1];
    const visit = (node, keys) => {
      if (!node || typeof node !== 'object') { return; }
      if ('$value' in node) {
        const name = `--pgn-${keys.join('-').replace(/\./g, '-')}`;
        sources[name] = { ...sources[name], [layer]: rel };
        return;
      }
      Object.entries(node).forEach(([key, child]) => { if (!key.startsWith('$')) { visit(child, [...keys, key]); } });
    };
    try {
      visit(JSON.parse(fs.readFileSync(file, 'utf8')), []);
    } catch (e) { console.error(`${rel}: ${e.message}`); }
  });
  walk(TOKENS_SRC);
  return { sources };
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

const MAX_BODY = 5 * 1024 * 1024;
/**
 * Reads the body of a write request sent from this page with `type` (a Content-Type prefix), then calls
 * onBody(buffer). Such requests are never sent cross-site without a CORS preflight, which this server does not
 * answer; the Origin check covers browsers that send them anyway.
 */
function readBody(req, res, type, onBody) {
  if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) { sendJson(res, 403, { error: 'Wrong origin.' }); return; }
  if (!(req.headers['content-type'] || '').startsWith(type)) { sendJson(res, 415, { error: `Send ${type}.` }); return; }
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) { sendJson(res, 413, { error: 'Too large.' }); req.destroy(); return; }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (size > MAX_BODY) { return; }
    try {
      onBody(Buffer.concat(chunks));
    } catch (e) {
      console.error(e);
      sendJson(res, 500, { error: 'Could not save.' });
    }
  });
}

/** readBody for JSON: `check(data)` returns why it cannot be saved (or null), then `write(data)` is sent back. */
function readJsonBody(req, res, check, write) {
  readBody(req, res, 'application/json', (body) => {
    let data;
    try {
      data = JSON.parse(body.toString('utf8'));
    } catch (e) {
      sendJson(res, 400, { error: 'Invalid JSON.' });
      return;
    }
    const error = check(data);
    if (error) { sendJson(res, 400, { error }); return; }
    sendJson(res, 200, write(data));
  });
}

function serveSaved(req, res, mode) {
  if (req.method === 'GET') { sendJson(res, 200, readSaved(mode)); return; }
  if (req.method !== 'PUT') { sendJson(res, 405, { error: 'Use GET or PUT.' }); return; }
  readJsonBody(req, res, (data) => checkSaved(data, tokenCatalog().sources), (data) => writeSaved(mode, data));
}

function serveThemes(req, res) {
  if (req.method === 'GET') { sendJson(res, 200, readThemes()); return; }
  if (req.method !== 'PUT') { sendJson(res, 405, { error: 'Use GET or PUT.' }); return; }
  readJsonBody(req, res, checkThemes, writeThemeList);
}

// POST /api/fonts?family=…&weight=400&style=normal with the font file as the body.
function serveFonts(req, res, query) {
  if (req.method === 'GET') { sendJson(res, 200, readFonts()); return; }
  if (req.method !== 'POST') { sendJson(res, 405, { error: 'Use GET or POST.' }); return; }
  readBody(req, res, 'application/octet-stream', (body) => {
    const { font, error } = addFont(body, {
      family: query.get('family'), weight: query.get('weight'), style: query.get('style'),
    });
    sendJson(res, error ? 400 : 200, error ? { error } : font);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const urlPath = decodeURIComponent(url.pathname);
  if (urlPath === '/app.js') { serveApp(res); return; }
  if (urlPath === '/token-meta.json') {
    sendJson(res, 200, { ...tokenCatalog(), derived: derivedTokens() });
    return;
  }
  const api = /^\/api\/design-tokens\/(light|dark)$/.exec(urlPath);
  if (api) { serveSaved(req, res, api[1]); return; }
  if (urlPath === '/api/themes') { serveThemes(req, res); return; }
  if (urlPath === '/api/fonts') { serveFonts(req, res, url.searchParams); return; }
  const file = urlPath.startsWith('/uploaded-fonts/') ? fontFile(urlPath.slice('/uploaded-fonts/'.length)) : resolveFile(urlPath);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(file && urlPath.startsWith('/brand/') ? `Not found: ${urlPath} (run "make build" first)` : `Not found: ${urlPath}`);
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => {
  if (!fs.existsSync(path.join(ROOT, 'dist/light.css'))) { console.warn('dist/ is empty: run "make build" first.'); }
  console.log(`Design token preview:\n  light: http://${HOST}:${PORT}/light.html\n  dark:  http://${HOST}:${PORT}/dark.html\nCtrl+C to stop.`);
});
