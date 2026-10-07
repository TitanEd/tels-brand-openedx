#!/usr/bin/env node
/*
 * Builds a site template: a layer under paragon/templates/<id>/ on top of the default brand build.
 *
 *   node scripts/build-template.js <id>      one template
 *   node scripts/build-template.js           every template folder with a template.json (and the manifest)
 *
 * paragon/templates/<id>/
 *   template.json   id, name, description, "default": true on the template used until an administrator picks one
 *                   (the marketing MFE of a template is the app with the same id, served at /<id>)
 *   tokens/         design-token JSON, same layout as paragon/tokens/src/; deep-merged over the base files
 *                   (a template value wins, base-only tokens stay), so a template only lists what it changes
 *   _template.scss  SCSS entry, compiled after paragon/_overrides.scss (its rules win over the default template)
 *   fonts/, assets/ copied next to the built CSS (url("./fonts/…") in the template SCSS)
 *
 * Output: dist/templates/<id>/{core,light,dark}(.min).css, theme-urls.json, fonts/, assets/ — dist/ itself is
 * the shared base (tokens, Paragon overrides, per-MFE fixes, dark mode) without any template's chrome, so the
 * stylesheets of two templates never meet — and dist/templates/index.json, the manifest control-panel's theme
 * configuration page lists; the selected template's CSS is what every MFE loads (control-panel in live mode,
 * SiteTemplate.jsx in development mode).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES = path.join(ROOT, 'paragon/templates');
const TOKENS_SRC = path.join(ROOT, 'paragon/tokens/src');
const DIST = path.join(ROOT, 'dist');

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
// Deep merge of two token trees: the template's values win, base-only tokens stay. A token the template
// gives a "$value" to also loses the base token's "modify" (Paragon colour mixes such as
// {"type": "mix", "otherColor": "{color.bg.base}"}): style-dictionary transforms a literal value before
// references are resolved, so a kept mix would see the reference string and fail. The template can
// still set its own "modify".
function deepMerge(base, overlay) {
  const out = { ...base };
  if (isObject(overlay) && '$value' in overlay && !('modify' in overlay)) {
    delete out.modify;
  }
  Object.keys(overlay).forEach((key) => {
    out[key] = isObject(base[key]) && isObject(overlay[key]) ? deepMerge(base[key], overlay[key]) : overlay[key];
  });
  return out;
}

function walk(dir, rel = '') {
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relPath = path.join(rel, entry.name);
    return entry.isDirectory() ? walk(path.join(dir, entry.name), relPath) : [relPath];
  });
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) { return; }
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function readManifest(id) {
  const file = path.join(TEMPLATES, id, 'template.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (manifest.id !== id) { throw new Error(`${file}: "id" must be "${id}"`); }
  return { path: `templates/${id}`, default: false, ...manifest };
}

function buildTokens(id, buildDir) {
  const src = path.join(buildDir, 'tokens-src');
  fs.rmSync(src, { recursive: true, force: true });
  fs.cpSync(TOKENS_SRC, src, { recursive: true });
  const overlayDir = path.join(TEMPLATES, id, 'tokens');
  let merged = 0;
  walk(overlayDir).forEach((rel) => {
    const target = path.join(src, rel);
    const overlay = JSON.parse(fs.readFileSync(path.join(overlayDir, rel), 'utf8'));
    let result = overlay;
    if (fs.existsSync(target)) {
      result = deepMerge(JSON.parse(fs.readFileSync(target, 'utf8')), overlay);
      merged += 1;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  });
  console.log(`[${id}] tokens: ${merged} base files merged with the template's values`);
  const out = path.join(buildDir, 'build');
  fs.rmSync(out, { recursive: true, force: true });
  run(`npx paragon build-tokens --source ${src}/ --build-dir ${out} -t light`);
  run(`npx paragon build-tokens --source ${src}/ --build-dir ${out} -t dark --base-paragon-theme light`);
  return out;
}

function writeCoreScss(id, buildDir, tokenBuild) {
  // paragon/core.scss with its relative imports made absolute, plus the template layer last.
  const base = fs.readFileSync(path.join(ROOT, 'paragon/core.scss'), 'utf8')
    .replace("'./build/core/index.css'", `'${path.join(tokenBuild, 'core/index.css')}'`)
    .replace(/@import "\.\/(variables|fonts|overrides)";/g, (m, name) => `@import "${path.join(ROOT, 'paragon', name)}";`);
  const entry = `${base}\n// Site template layer (paragon/templates/${id}/_template.scss)\n`
    + `@import "${path.join(TEMPLATES, id, 'template')}";\n`;
  const file = path.join(buildDir, 'core.scss');
  fs.writeFileSync(file, entry);
  return file;
}

function buildTemplate(id) {
  const manifest = readManifest(id);
  const buildDir = path.join(ROOT, 'paragon/build/templates', id);
  const outDir = path.join(DIST, 'templates', id);
  fs.mkdirSync(buildDir, { recursive: true });
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const tokenBuild = buildTokens(id, buildDir);
  const coreScss = writeCoreScss(id, buildDir, tokenBuild);
  run(`npx paragon build-scss --corePath ${coreScss} --themesPath ${path.join(tokenBuild, 'themes')} --outDir ${outDir}`);
  run(`python3 scripts/append-overrides-to-themes.py ${outDir}`);

  // Fonts and assets next to the CSS (url("./fonts/…")), the template's fonts also in dist/fonts/ for
  // deployments that serve one fonts folder (control-panel's theme font view).
  copyDir(path.join(ROOT, 'paragon/fonts'), path.join(outDir, 'fonts'));
  copyDir(path.join(TEMPLATES, id, 'fonts'), path.join(outDir, 'fonts'));
  copyDir(path.join(TEMPLATES, id, 'fonts'), path.join(DIST, 'fonts'));
  copyDir(path.join(TEMPLATES, id, 'assets'), path.join(outDir, 'assets'));
  console.log(`[${id}] built → dist/templates/${id}/`);
  return manifest;
}

function writeManifest(manifests) {
  if (!manifests.some((m) => m.default)) {
    throw new Error('one template.json must set "default": true');
  }
  const file = path.join(DIST, 'templates', 'index.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ templates: manifests }, null, 2)}\n`);
  console.log(`manifest → dist/templates/index.json (${manifests.map((m) => m.id).join(', ')})`);
}

const ids = process.argv.slice(2);
const all = fs.readdirSync(TEMPLATES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(TEMPLATES, e.name, 'template.json')))
  .map((e) => e.name)
  .sort();
if (!fs.existsSync(path.join(DIST, 'core.css'))) {
  console.error('dist/ is empty: run "make build" first (the default template is the base of every other one).');
  process.exit(1);
}
(ids.length ? ids : all).forEach(buildTemplate);
writeManifest(all.map(readManifest));
