#!/usr/bin/env node
/*
 * Local preview of the built design tokens on the real Paragon React components: global tokens (step 1),
 * one section per component (step 2) with an Edit form, and a list of every --pgn-* design token.
 *   npm run preview            -> http://127.0.0.1:8765/light.html and /dark.html
 *   PREVIEW_PORT=9000 npm run preview
 * Serves preview/index.html, preview/app.jsx bundled by esbuild (as /app.js), dist/ (as /brand) and
 * Paragon's own CSS (as /paragon), and /token-meta.json (which paragon/tokens/src file sets each --pgn-*
 * name). Reads files on every request, so after "make build" a
 * browser refresh shows the new CSS.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PREVIEW_PORT) || 8765;
const HOST = process.env.PREVIEW_HOST || '127.0.0.1';
const ROUTES = {
  '/brand/': path.join(ROOT, 'dist'),
  '/paragon/': path.join(ROOT, 'node_modules/@openedx/paragon/dist'),
};
const PAGE = path.join(ROOT, 'preview/index.html');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
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

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (urlPath === '/app.js') { serveApp(res); return; }
  if (urlPath === '/token-meta.json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(tokenCatalog()));
    return;
  }
  const file = resolveFile(urlPath);
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
