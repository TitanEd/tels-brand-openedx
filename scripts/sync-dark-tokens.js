#!/usr/bin/env node
/*
 * Give every light design token a dark twin, so the dark stylesheet is complete.
 *
 * Why: Paragon builds `dist/dark.css` from the tokens defined under `paragon/tokens/src/themes/dark/` only
 * (plus the tokens they reference). When an MFE shows the dark variant, the light stylesheet is switched off
 * ("alternate stylesheet"), so a token that exists only in light has NO value in dark mode: disabled buttons
 * keep full opacity, checked checkboxes lose their check mark, validation colors, focus rings, tints and
 * shadows vanish, and text set to such a token falls back to the browser default (black on a dark page).
 *
 * What it does: for each token of the light theme (TitanEd's `themes/light/**` and, underneath it, Paragon's
 * own light tokens in node_modules/@openedx/paragon/tokens/src/themes/light/**) that `themes/dark/**` does
 * not define, it adds the token to the dark theme with the light definition adapted for dark surfaces:
 *   - `{color.white}` (text, border or icon on a colored background in light) -> `{color.text.inverse}`, the
 *     token that stays white in both modes, because in dark mode `color.white` is the surface color (see
 *     themes/dark/global/color.json);
 *   - a `mix` with "white" of 70% or more (the pale -100/-200 tints used as backgrounds in light) mixes
 *     with the page background `{color.bg.base}` instead, so it is a subtle dark tinted surface; lighter
 *     mixes (-300/-400, icons and text on dark) and darker mixes (hover/active shades) are kept;
 *   - everything else (references, sizes, opacities, icons, shadows) is copied as it is: references resolve
 *     to the dark values of the tokens they point to.
 * A TitanEd light token goes to the dark file with the same relative path (created when needed); a token
 * TitanEd never customised goes to `themes/dark/paragon-defaults/<same path as in Paragon>`, with the
 * description `Paragon default → --pgn-…` like the light defaults have (CONTROLS.md).
 * Tokens the dark files already define are never changed, so the designed dark values always win. The
 * generated entries carry `"$extensions": { "tels": { "syncedFromLight": true } }`; edit a value in place to
 * tune it (the marker is kept, the value is yours).
 *
 *   node scripts/sync-dark-tokens.js            # write the dark twins
 *   node scripts/sync-dark-tokens.js --dry-run  # only report what would be added
 *   node scripts/sync-dark-tokens.js --check    # exit 1 when a light token has no dark twin (make validate)
 *   node scripts/sync-dark-tokens.js --reset    # drop the generated twins first (after changing the rules above)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'paragon/tokens/src/themes');
const LIGHT = path.join(SRC, 'light');
const DARK = path.join(SRC, 'dark');
const PARAGON_LIGHT = path.join(ROOT, 'node_modules/@openedx/paragon/tokens/src/themes/light');
const PARAGON_DEFAULTS = 'paragon-defaults';
const MARKER = 'syncedFromLight';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const check = args.has('--check');
const reset = args.has('--reset');

// Remove every generated token (marker) from the dark files; delete files left without tokens.
function resetGenerated() {
  let removed = 0;
  listJson(DARK).forEach((file) => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let tokensLeft = 0;
    const prune = (node) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) { return false; }
      if (isToken(node)) {
        if (node.$extensions && node.$extensions.tels && node.$extensions.tels[MARKER]) { removed += 1; return true; }
        tokensLeft += 1;
        return false;
      }
      Object.keys(node).forEach((key) => {
        if (key.startsWith('$')) { return; }
        if (prune(node[key]) || (typeof node[key] === 'object' && !Array.isArray(node[key]) && !isToken(node[key])
          && !Object.keys(node[key]).some((k) => !k.startsWith('$')))) { delete node[key]; }
      });
      return false;
    };
    prune(data);
    if (tokensLeft) { fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`); } else { fs.unlinkSync(file); }
  });
  // Drop folders left empty.
  const dropEmpty = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { if (e.isDirectory()) { dropEmpty(path.join(dir, e.name)); } });
    if (dir !== DARK && !fs.readdirSync(dir).length) { fs.rmdirSync(dir); }
  };
  dropEmpty(DARK);
  console.log(`Removed ${removed} generated dark tokens.`);
}

function listJson(dir) {
  const out = [];
  const walk = (d) => {
    fs.readdirSync(d, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) { walk(full); } else if (entry.name.endsWith('.json')) { out.push(full); }
    });
  };
  if (fs.existsSync(dir)) { walk(dir); }
  return out.sort();
}

const isToken = (node) => node && typeof node === 'object' && !Array.isArray(node)
  && (Object.prototype.hasOwnProperty.call(node, '$value') || Object.prototype.hasOwnProperty.call(node, 'modify'));

// { 'color.btn.bg.primary': { node, file } } for every token in a theme folder (file: relative path).
function collect(dir) {
  const tokens = new Map();
  listJson(dir).forEach((file) => {
    const rel = path.relative(dir, file);
    const walk = (node, keyPath) => {
      if (isToken(node)) { tokens.set(keyPath.join('.'), { node, file: rel }); return; }
      if (!node || typeof node !== 'object') { return; }
      Object.entries(node).forEach(([key, value]) => {
        if (!key.startsWith('$')) { walk(value, keyPath.concat(key)); }
      });
    };
    walk(JSON.parse(fs.readFileSync(file, 'utf8')), []);
  });
  return tokens;
}

const cssName = (keyPath) => `--pgn-${keyPath.join('-')}`;

// A light token definition adapted for dark surfaces.
function adapt(keyPath, node, { paragonDefault }) {
  const out = JSON.parse(JSON.stringify(node));
  if (out.$value === '{color.white}') { out.$value = '{color.text.inverse}'; }
  if (Array.isArray(out.modify)) {
    out.modify = out.modify.map((step) => {
      if (step && step.type === 'mix' && step.otherColor === 'white' && Number(step.amount) >= 0.7) {
        return { ...step, otherColor: '{color.bg.base}' };
      }
      return step;
    });
  }
  const description = typeof out.$description === 'string' ? out.$description : '';
  out.$description = paragonDefault
    ? `Paragon default → ${cssName(keyPath)} (dark twin of Paragon's light token; scripts/sync-dark-tokens.js). ${description}`.trim()
    : `Dark twin of the light token (scripts/sync-dark-tokens.js). ${description}`.trim();
  out.$extensions = { ...(out.$extensions || {}), tels: { ...((out.$extensions || {}).tels || {}), [MARKER]: true } };
  return out;
}

function setPath(obj, keyPath, value) {
  let node = obj;
  keyPath.slice(0, -1).forEach((key) => {
    if (!node[key] || typeof node[key] !== 'object' || Array.isArray(node[key])) { node[key] = {}; }
    node = node[key];
  });
  node[keyPath[keyPath.length - 1]] = value;
}

function main() {
  if (reset) { resetGenerated(); }
  const light = collect(LIGHT);
  const paragonLight = collect(PARAGON_LIGHT);
  const dark = collect(DARK);
  const missing = [];
  light.forEach((entry, key) => {
    if (!dark.has(key)) { missing.push({ key, node: entry.node, file: entry.file, paragonDefault: false }); }
  });
  paragonLight.forEach((entry, key) => {
    if (!dark.has(key) && !light.has(key)) {
      missing.push({ key, node: entry.node, file: path.join(PARAGON_DEFAULTS, entry.file), paragonDefault: true });
    }
  });
  if (!missing.length) {
    console.log('Every light token has a dark twin.');
    return;
  }
  const byFile = new Map();
  missing.forEach((entry) => {
    if (!byFile.has(entry.file)) { byFile.set(entry.file, []); }
    byFile.get(entry.file).push(entry);
  });
  const own = missing.filter((m) => !m.paragonDefault).length;
  console.log(`${missing.length} light tokens have no dark twin (${own} TitanEd, ${missing.length - own} Paragon defaults), in ${byFile.size} files:`);
  byFile.forEach((entries, file) => console.log(`  ${file}: ${entries.length}`));
  if (check) {
    console.log('Fix: node scripts/sync-dark-tokens.js (then make build)');
    process.exit(1);
  }
  if (dryRun) { return; }

  byFile.forEach((entries, file) => {
    const darkFile = path.join(DARK, file);
    const { paragonDefault } = entries[0];
    let data = {};
    if (fs.existsSync(darkFile)) {
      data = JSON.parse(fs.readFileSync(darkFile, 'utf8'));
    } else {
      const source = paragonDefault
        ? path.join(PARAGON_LIGHT, path.relative(PARAGON_DEFAULTS, file))
        : path.join(LIGHT, file);
      const lightData = JSON.parse(fs.readFileSync(source, 'utf8'));
      Object.entries(lightData).forEach(([key, value]) => {
        if (key.startsWith('$')) { data[key] = value; }
      });
      const origin = paragonDefault ? `Paragon's themes/light/${path.relative(PARAGON_DEFAULTS, file)}` : `themes/light/${file}`;
      data.$description = `Dark twin of ${origin} (scripts/sync-dark-tokens.js). ${typeof data.$description === 'string' ? data.$description : ''}`.trim();
    }
    entries.forEach(({ key, node }) => setPath(data, key.split('.'), adapt(key.split('.'), node, { paragonDefault })));
    fs.mkdirSync(path.dirname(darkFile), { recursive: true });
    fs.writeFileSync(darkFile, `${JSON.stringify(data, null, 2)}\n`);
  });
  console.log(`Added ${missing.length} dark tokens. Now: make build`);
}

main();
