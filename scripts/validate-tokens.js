#!/usr/bin/env node
/**
 * TitanEd design token validation.
 *
 * Checks the token sources (paragon/tokens/src), the brand SCSS (paragon/) and the built CSS (dist/)
 * against the design-token checkpoints of the "UI Development Standards & Validation Checklist".
 * No brand value (font, color, width) is fixed here: checks are about tokens being defined, used
 * consistently and accessible. Thresholds live in validation/settings.json.
 * Level 3 files (paragon/_<mfe>.scss, _header, _footer) may hold component-specific values, so the
 * hardcoded-value checks (#1, #2, #17, #18) only scan Level 1/2 SCSS.
 *
 * Usage: node scripts/validate-tokens.js [--strict] [--verbose] [--json] [--update-baseline]
 *   --strict           warnings (including known issues) also fail the run
 *   --verbose          list every passed check and every finding (no truncation)
 *   --json             print the report as JSON (for CI or the control panel)
 *   --update-baseline  record every current failure in validation/baseline.json as a known issue
 *
 * Known issues (validation/baseline.json) and design-approved exceptions (settings.json "exceptions")
 * are reported as warnings instead of failures. Anything new still fails.
 *
 * Exit code: 0 = passed, 1 = at least one FAIL (or WARN with --strict).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'paragon/tokens/src');
const DIST_DIR = path.join(ROOT, 'dist');
const SCSS_DIRS = [path.join(ROOT, 'paragon'), path.join(ROOT, 'paragon/overrides')];
const PARAGON_DIR = path.join(ROOT, 'node_modules/@openedx/paragon');
const PARAGON_CSS = path.join(PARAGON_DIR, 'styles/css');
const PARAGON_TOKENS = path.join(PARAGON_DIR, 'tokens/src');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const VERBOSE = args.includes('--verbose');
const JSON_OUT = args.includes('--json');
const UPDATE_BASELINE = args.includes('--update-baseline');
const MAX_LINES = 15;

const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'validation/settings.json'), 'utf8'));
const BASELINE_FILE = path.join(ROOT, 'validation/baseline.json');
const baseline = !UPDATE_BASELINE && fs.existsSync(BASELINE_FILE)
  ? new Set(JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')).knownIssues.map((i) => i.key))
  : new Set();

// ---------------------------------------------------------------------------
// Checkpoints and result collection
// ---------------------------------------------------------------------------

const CHECKPOINTS = [
  [0, 'Base', 'Build output exists, every token key has a value, references and modifiers are valid for Paragon'],
  [1, 'Typography', 'Approved font family is used throughout'],
  [2, 'Typography', 'Font sizes and font weights are consistent'],
  [3, 'Typography', 'Body text styles are consistent'],
  [4, 'Buttons', 'Button styling follows the approved design system and is consistent'],
  [5, 'Buttons', 'Button size and padding are consistent'],
  [6, 'Buttons', 'Hover state is implemented consistently'],
  [7, 'Buttons', 'Active/pressed state is implemented consistently'],
  [8, 'Buttons', 'Disabled state is implemented consistently'],
  [9, 'Buttons', 'Focus state is visible and accessible'],
  [10, 'Links', 'Link hover/focus states are clearly distinguishable'],
  [11, 'Accessibility', 'Text and interactive elements have sufficient visual contrast'],
  [12, 'Accessibility', 'Keyboard focus is clearly visible'],
  [13, 'Forms', 'Error states are visually distinguishable'],
  [14, 'Navigation', 'Active navigation state is clearly indicated'],
  [15, 'Layout', 'Page uses the approved layout/container structure'],
  [16, 'Layout', 'Content does not become excessively stretched on large screens'],
  [17, 'Layout', 'Consistent padding and margins are maintained'],
  [18, 'Responsive', 'Responsive breakpoints follow the approved design system'],
  [19, 'RTL', 'Margins and padding do not break in RTL'],
  [20, 'Dark/Light', 'Everything works correctly in Dark/Light mode'],
  [21, 'Technical', 'No broken asset requests are present'],
  [22, 'Technical', 'Unnecessary CSS is not introduced'],
];

const results = new Map(CHECKPOINTS.map(([id]) => [id, { pass: [], warn: [], known: [], fail: [] }]));
const failureKeys = [];

function pass(id, msg) { results.get(id).pass.push(msg); }
function warn(id, msg) { results.get(id).warn.push(msg); }
/** key identifies the problem without its current values, so a known issue stays known when a color changes. */
function fail(id, msg, key = msg) {
  const fullKey = `#${id} ${key}`;
  const exception = (settings.exceptions || []).find((e) => e.checkpoint === id && msg.includes(e.match));
  if (exception) {
    warn(id, `${msg}  [approved exception: ${exception.reason}]`);
  } else if (baseline.has(fullKey)) {
    results.get(id).known.push(msg);
  } else {
    results.get(id).fail.push(msg);
    failureKeys.push({ key: fullKey, message: msg });
  }
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) { return []; }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { return listFiles(full, ext); }
    return entry.name.endsWith(ext) ? [full] : [];
  });
}

// ---------------------------------------------------------------------------
// Tokens: path -> { value, hasModify, file } per layer (core / light / dark)
// ---------------------------------------------------------------------------

/** Only presence is checked: any non-empty value is accepted. */
function isEmptyValue(value) {
  if (value === undefined || value === null) { return true; }
  if (typeof value === 'string') { return value.trim() === ''; }
  if (Array.isArray(value)) { return value.length === 0 || value.every(isEmptyValue); }
  if (typeof value === 'object') {
    const entries = Object.values(value);
    return entries.length === 0 || entries.every(isEmptyValue);
  }
  return false;
}

const emptyTokens = [];

function loadTokens(subdir) {
  const tokens = new Map();
  const duplicates = [];
  for (const file of listFiles(path.join(TOKENS_DIR, subdir), '.json')) {
    let data;
    try {
      data = JSON.parse(read(file));
    } catch (e) {
      fail(0, `${rel(file)} is not valid JSON: ${e.message}`);
      continue;
    }
    const walk = (node, keys) => {
      const tokenPath = keys.join('.') || '(file root)';
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        emptyTokens.push({ file, tokenPath, reason: 'has no "$value" (plain value instead of { "$value": ... })' });
        return;
      }
      if ('$value' in node) {
        if (isEmptyValue(node.$value)) {
          emptyTokens.push({ file, tokenPath, reason: '"$value" is empty' });
        }
        if (tokens.has(tokenPath) && tokens.get(tokenPath).file !== file) {
          duplicates.push({ tokenPath, files: [tokens.get(tokenPath).file, file] });
        }
        tokens.set(tokenPath, { value: node.$value, hasModify: 'modify' in node, modify: node.modify, file });
        return;
      }
      const children = Object.keys(node).filter((key) => !key.startsWith('$'));
      if (keys.length && children.length === 0) {
        emptyTokens.push({ file, tokenPath, reason: 'has no "$value"' });
        return;
      }
      for (const key of children) { walk(node[key], [...keys, key]); }
    };
    walk(data, []);
  }
  return { tokens, duplicates };
}

const core = loadTokens('core');
const light = loadTokens('themes/light');
const dark = loadTokens('themes/dark');
const tokenValue = (layer, tokenPath) => layer.tokens.get(tokenPath)?.value;

// ---------------------------------------------------------------------------
// Built CSS variables and effective values per mode
// ---------------------------------------------------------------------------

function parseRootVars(file) {
  const vars = {};
  const duplicates = [];
  const empty = [];
  if (!fs.existsSync(file)) { return { vars, duplicates, empty, missing: true }; }
  for (const block of read(file).matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const decl of block[1].matchAll(/(--[\w-]+)\s*:([^;]*);/g)) {
      const [, name, raw] = decl;
      const value = raw.trim();
      if (!value) { empty.push(name); }
      if (name in vars && vars[name] !== value) { duplicates.push({ name, first: vars[name], second: value }); }
      vars[name] = value;
    }
  }
  return { vars, duplicates, empty, missing: false };
}

const css = {
  core: parseRootVars(path.join(DIST_DIR, 'core.css')),
  light: parseRootVars(path.join(DIST_DIR, 'light.css')),
  dark: parseRootVars(path.join(DIST_DIR, 'dark.css')),
  paragonCore: parseRootVars(path.join(PARAGON_CSS, 'core/variables.css')),
  paragonLight: parseRootVars(path.join(PARAGON_CSS, 'themes/light/variables.css')),
};

// At runtime our CSS is loaded on top of Paragon's; the dark build uses Paragon light as its base.
const modes = {
  light: { ...css.paragonCore.vars, ...css.paragonLight.vars, ...css.core.vars, ...css.light.vars },
  dark: { ...css.paragonCore.vars, ...css.paragonLight.vars, ...css.core.vars, ...css.dark.vars },
};

function resolve(vars, value, seen = new Set()) {
  if (value == null) { return null; }
  const text = String(value).trim();
  const match = text.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
  if (!match) { return text; }
  const [, name, fallback] = match;
  if (seen.has(name)) { return null; }
  if (name in vars) { return resolve(vars, vars[name], new Set([...seen, name])); }
  return fallback !== undefined ? resolve(vars, fallback, seen) : null;
}
const resolveVar = (mode, name) => resolve(modes[mode], `var(${name})`);

// ---------------------------------------------------------------------------
// Colors and WCAG contrast
// ---------------------------------------------------------------------------

function parseColor(value) {
  if (!value) { return null; }
  const v = value.trim().toLowerCase();
  if (v === 'transparent') { return { r: 0, g: 0, b: 0, a: 0 }; }
  if (v === 'white') { return { r: 255, g: 255, b: 255, a: 1 }; }
  if (v === 'black') { return { r: 0, g: 0, b: 0, a: 1 }; }
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) { h = h.split('').map((c) => c + c).join(''); }
    if (h.length === 6) { h += 'ff'; }
    if (h.length !== 8) { return null; }
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: n(6) / 255 };
  }
  m = v.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const alpha = parts[3] === undefined ? 1
      : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: +parts[0], g: +parts[1], b: +parts[2], a: alpha };
  }
  return null;
}

const colorOf = (mode, name) => parseColor(resolveVar(mode, name));
const over = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});
const hex = (c) => `#${[c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

function luminance(c) {
  const channel = (x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function distinct(a, b) {
  const distance = Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
  return contrast(a, b) >= settings.contrast.stateDifference || distance >= 40;
}

const PAGE_BG = '--pgn-color-bg-base';
const WHITE = { r: 255, g: 255, b: 255, a: 1 };

/** name -> { mode, usedBy } for variables that have a value in one mode only (reported under #20). */
const noValueInMode = new Map();
const otherMode = (mode) => (mode === 'light' ? 'dark' : 'light');
function noteNoValue(mode, name, usedBy) {
  if (resolveVar(mode, name) !== null || resolveVar(otherMode(mode), name) === null) { return false; }
  const entry = noValueInMode.get(`${mode} ${name}`) || { mode, name, usedBy: new Set() };
  if (usedBy) { entry.usedBy.add(usedBy); }
  noValueInMode.set(`${mode} ${name}`, entry);
  return true;
}

/** Contrast of fgVar on bgVar (bgVar drawn over backdropVar, which is drawn over the page). */
function checkContrast(id, mode, label, fgVar, bgVar, min, backdropVar = PAGE_BG) {
  const missingFg = noteNoValue(mode, fgVar, label);
  const missingBg = noteNoValue(mode, bgVar, label);
  if (missingFg || missingBg) { return; }
  const page = colorOf(mode, PAGE_BG) || WHITE;
  const backdrop = over(colorOf(mode, backdropVar) || page, page);
  const bgRaw = colorOf(mode, bgVar);
  const fgRaw = colorOf(mode, fgVar);
  if (!fgRaw) { return; } // e.g. "inherit": the color comes from the parent, nothing to measure
  const bg = bgRaw ? over(bgRaw, backdrop) : backdrop;
  const fg = over(fgRaw, bg);
  const ratio = contrast(fg, bg);
  const msg = `${mode}: ${label} — ${hex(fg)} on ${hex(bg)} = ${ratio.toFixed(2)}:1 (needs ${min}:1)`;
  if (ratio + 1e-9 >= min) { pass(id, msg); } else { fail(id, msg, `${mode}: ${label} contrast`); }
}

// ---------------------------------------------------------------------------
// SCSS scanning (comments stripped, line numbers kept)
// ---------------------------------------------------------------------------

const scssFiles = SCSS_DIRS.flatMap((dir) => (fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith('.scss')).map((f) => path.join(dir, f))
  : []));

function scssLines(file) {
  const noBlockComments = read(file).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''));
  return noBlockComments.split('\n').map((line) => line.replace(/(^|\s)\/\/.*$/, ''));
}
const scss = scssFiles.map((file) => ({ file, lines: scssLines(file) }));

// Level 3 = per-MFE and header/footer files (paragon/_<mfe>.scss). Component-specific values written
// directly there are allowed, so the "hardcoded value" checks only look at Level 1/2 SCSS (paragon/overrides/).
const SHARED_SCSS = new Set(['core.scss', '_overrides.scss', '_variables.scss', '_fonts.scss']);
const isLevel3 = (file) => path.dirname(file) === path.join(ROOT, 'paragon') && !SHARED_SCSS.has(path.basename(file));
const level3Files = scssFiles.filter(isLevel3);

/** Rule blocks with their own declarations: [{ decls: [{ prop, value, line }] }] (nested blocks are separate). */
function ruleBlocks(lines) {
  const text = lines.join('\n');
  const blocks = [];
  const stack = [];
  let buffer = '';
  let line = 1;
  let bufferLine = 1;
  const flush = () => {
    const m = buffer.trim().match(/^([a-z-]+)\s*:\s*([\s\S]+)$/i);
    if (m && stack.length) {
      stack[stack.length - 1].decls.push({ prop: m[1].toLowerCase(), value: m[2].trim(), line: bufferLine });
    }
    buffer = '';
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '#' && text[i + 1] === '{') {
      const end = text.indexOf('}', i);
      buffer += text.slice(i, end + 1);
      i = end === -1 ? text.length : end;
    } else if (ch === '{') {
      const block = { decls: [] };
      blocks.push(block);
      stack.push(block);
      buffer = '';
    } else if (ch === ';') {
      flush();
    } else if (ch === '}') {
      flush();
      stack.pop();
    } else {
      if (!buffer.trim()) { bufferLine = line; }
      buffer += ch;
    }
    if (ch === '\n') { line += 1; }
  }
  return blocks;
}

/** Marks the lines that sit inside an @font-face block (where a literal font name is required). */
function fontFaceLines(lines) {
  let depth = 0;
  let inside = false;
  return lines.map((line) => {
    if (/@font-face/.test(line)) { inside = true; depth = 0; }
    const flag = inside;
    if (inside) {
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (depth <= 0 && /\}/.test(line)) { inside = false; }
    }
    return flag;
  });
}

function eachDeclaration(regex, callback, { skipLevel3 = false } = {}) {
  for (const { file, lines } of scss) {
    if (skipLevel3 && isLevel3(file)) { continue; }
    const inFontFace = fontFaceLines(lines);
    lines.forEach((line, i) => {
      const m = line.match(regex);
      if (m) { callback(m, `${rel(file)}:${i + 1}`, line.trim(), file, inFontFace[i]); }
    });
  }
}
/** Hardcoded-value checks: Level 1/2 SCSS only. */
const eachSharedDeclaration = (regex, callback) => eachDeclaration(regex, callback, { skipLevel3: true });
const level3Note = (id, what) => {
  if (level3Files.length) {
    pass(id, `${level3Files.length} Level 3 (per-MFE) files may set their own ${what}; only Level 1/2 SCSS is checked`);
  }
};

// ---------------------------------------------------------------------------
// Button types (from our light button token files)
// ---------------------------------------------------------------------------

const buttonTypes = [...new Set([...light.tokens.keys()]
  .map((p) => p.match(/^color\.btn\.bg\.([\w-]+)$/)?.[1])
  .filter(Boolean))].sort();
const isInverse = (type) => type.startsWith('inverse');
// settings.inverseBackdrop: the chrome inverse buttons sit on, one variable or { light, dark } (one per mode).
const inverseBackdrop = (mode) => (typeof settings.inverseBackdrop === 'object' && settings.inverseBackdrop
  ? settings.inverseBackdrop[mode] : settings.inverseBackdrop);
const backdropFor = (type, mode) => (isInverse(type) ? inverseBackdrop(mode) : PAGE_BG);
const BTN_PROPS = ['bg', 'text', 'border'];
const BTN_STATES = ['', 'hover', 'active', 'disabled'];
const btnTokenPath = (state, prop, type) => ['color', 'btn', state, prop, type].filter(Boolean).join('.');
const btnVar = (state, prop, type) => `--pgn-color-btn-${state ? `${state}-` : ''}${prop}-${type}`;

// ===========================================================================
// #0 Base: build output + required values + references
// ===========================================================================

for (const { file, tokenPath, reason } of emptyTokens) {
  fail(0, `${rel(file)}: ${tokenPath} ${reason} — every token key needs a value`, `${rel(file)}: ${tokenPath} value required`);
}
const tokenCount = core.tokens.size + light.tokens.size + dark.tokens.size;
if (emptyTokens.length === 0) {
  pass(0, `All ${tokenCount} token keys (core, light, dark) have a non-empty value`);
}

// Same checks the Paragon build (Style Dictionary) makes, reported up front with the file and token name.
function paragonTokenPaths(subdir) {
  const paths = new Set();
  const walk = (node, keys) => {
    if (!node || typeof node !== 'object') { return; }
    if ('$value' in node) { paths.add(keys.join('.')); return; }
    Object.entries(node).forEach(([key, child]) => { if (!key.startsWith('$')) { walk(child, [...keys, key]); } });
  };
  for (const file of listFiles(path.join(PARAGON_TOKENS, subdir), '.json')) {
    try { walk(JSON.parse(read(file)), []); } catch (e) { /* Paragon's own files */ }
  }
  return paths;
}
const paragonTokens = new Set([...paragonTokenPaths('core'), ...paragonTokenPaths('themes/light')]);
const layerNames = (...layers) => new Set([...paragonTokens, ...layers.flatMap((l) => [...l.tokens.keys()])]);
// The dark build uses Paragon light as its base theme, so dark tokens can reference those too.
const referenceScopes = [['core', core, layerNames(core, light)], ['light', light, layerNames(core, light)],
  ['dark', dark, layerNames(core, dark)]];
const referencesIn = (value) => [...JSON.stringify(value ?? '').matchAll(/\{([\w.-]+)\}/g)].map((m) => m[1]);
let referenceCount = 0;
let brokenReferences = 0;
for (const [, layer, known] of referenceScopes) {
  for (const [tokenPath, entry] of layer.tokens) {
    for (const ref of [...referencesIn(entry.value), ...referencesIn(entry.modify)]) {
      referenceCount += 1;
      if (!known.has(ref)) {
        brokenReferences += 1;
        fail(0, `${rel(entry.file)}: ${tokenPath} references {${ref}}, which does not exist — the Paragon build stops on this`,
          `${rel(entry.file)}: ${tokenPath} broken reference {${ref}}`);
      }
    }
  }
}
if (!paragonTokens.size) {
  fail(0, 'Paragon token sources not found in node_modules — run "npm install"');
} else if (brokenReferences === 0) {
  pass(0, `All ${referenceCount} token references ({…}) point to existing tokens`);
}

let chroma = null;
try {
  chroma = require(require.resolve('chroma-js', { paths: [PARAGON_DIR, ROOT] }));
  chroma = chroma.default || chroma;
} catch (e) { /* checked below */ }
const PARAGON_MODIFIERS = ['mix', 'color-yiq', 'darken', 'lighten', 'str-replace'];
const isModifier = (type) => PARAGON_MODIFIERS.includes(type) || (chroma && typeof chroma('#000')[type] === 'function');
let modifierCount = 0;
let badModifiers = 0;
for (const [, layer] of referenceScopes) {
  for (const [tokenPath, entry] of layer.tokens) {
    if (!entry.hasModify || entry.modify === null) { continue; }
    const where = `${rel(entry.file)}: ${tokenPath}`;
    if (!Array.isArray(entry.modify)) {
      badModifiers += 1;
      fail(0, `${where} "modify" must be a list [ … ] or null — the Paragon build ignores it otherwise`, `${where} modify not a list`);
      continue;
    }
    for (const modifier of entry.modify) {
      modifierCount += 1;
      const type = modifier?.type;
      if (typeof type !== 'string' || !type.trim()) {
        badModifiers += 1;
        fail(0, `${where} has a "modify" entry without a "type"`, `${where} modify without type`);
      } else if (chroma === null && !PARAGON_MODIFIERS.includes(type)) {
        warn(0, `${where} modify type "${type}" not checked (chroma-js not found — run "npm install")`);
      } else if (!isModifier(type)) {
        badModifiers += 1;
        fail(0, `${where} modify type "${type}" is not a Paragon modifier — the build ignores it`, `${where} invalid modify "${type}"`);
      }
    }
  }
}
if (badModifiers === 0) { pass(0, `All ${modifierCount} "modify" rules use modifiers the Paragon build supports`); }

for (const name of ['core.css', 'light.css', 'dark.css']) {
  const built = css[name.replace('.css', '')];
  if (built.missing) { fail(0, `dist/${name} is missing — run "make build"`); }
  for (const varName of built.empty) {
    fail(0, `dist/${name}: ${varName} is built with an empty value`, `dist/${name}: ${varName} value required`);
  }
}
if (css.paragonLight.missing) {
  fail(0, 'Paragon CSS not found in node_modules — run "npm install"');
}
for (const [label, source] of [['core', css.core], ['light', css.light], ['dark', css.dark]]) {
  const mode = label === 'dark' ? 'dark' : 'light';
  let broken = 0;
  for (const [name, value] of Object.entries(source.vars)) {
    if (/var\(/.test(value) && resolve(modes[mode], value) === null) {
      broken += 1;
      fail(0, `dist/${label}.css: ${name} → ${value} does not resolve`);
    }
  }
  if (!source.missing && broken === 0) {
    pass(0, `dist/${label}.css: all ${Object.keys(source.vars).length} variables resolve`);
  }
}
const newestSource = Math.max(
  ...listFiles(TOKENS_DIR, '.json').map((f) => fs.statSync(f).mtimeMs),
  ...scssFiles.map((f) => fs.statSync(f).mtimeMs),
);
if (!css.light.missing && fs.statSync(path.join(DIST_DIR, 'light.css')).mtimeMs + 1000 < newestSource) {
  warn(0, 'Token or SCSS files are newer than dist/light.css — run "make build" so dist matches the sources');
}

// ===========================================================================
// #1 Font family
// ===========================================================================

// Whatever font is chosen, it must be set once in the token and used everywhere through it.
const sansSerif = tokenValue(core, 'typography.font.family.sans.serif');
if (typeof sansSerif === 'string' && sansSerif.trim()) {
  pass(1, `typography.font.family.sans.serif = "${sansSerif}"`);
} else {
  fail(1, 'typography.font.family.sans.serif is missing or empty');
}
const builtSansSerif = resolveVar('light', '--pgn-typography-font-family-sans-serif');
for (const name of ['--pgn-typography-font-family-base', '--pgn-typography-headings-font-family']) {
  const built = resolveVar('light', name);
  if (built && built === builtSansSerif) {
    pass(1, `${name} uses the font token ("${built}")`);
  } else {
    fail(1, `${name} resolves to "${built}", not to the font token typography.font.family.sans.serif ("${builtSansSerif}")`,
      `${name} not using the font token`);
  }
}
// Icon fonts must be named directly: they draw glyphs, they are not the text font.
const ICON_FONT = /icon|awesome|symbols|glyph/i;
eachSharedDeclaration(/font-family\s*:\s*([^;]+)/, (m, where, line, file, inFontFace) => {
  const value = m[1].trim();
  if (inFontFace) {
    pass(1, `${where} @font-face declares ${value}`);
  } else if (/^(var\(--pgn-typography|inherit|initial|unset)/.test(value)) {
    pass(1, `${where} ${value}`);
  } else if (ICON_FONT.test(value)) {
    pass(1, `${where} icon font ${value.split(',')[0]}`);
  } else {
    warn(1, `${where} font name written directly: font-family: ${value} (use a typography token)`);
  }
});
level3Note(1, 'fonts');

// ===========================================================================
// #2 Font sizes / weights  #3 Body text
// ===========================================================================

const requiredTypography = [
  'typography.font.size.base',
  ...[1, 2, 3, 4, 5, 6].map((n) => `typography.font.size.h${n}.base`),
  'typography.font.weight.base',
  'typography.font.weight.bold',
];
for (const tokenPath of requiredTypography) {
  if (tokenValue(core, tokenPath) !== undefined) { pass(2, `${tokenPath} is defined`); } else { fail(2, `${tokenPath} is missing`); }
}
const headingRem = [1, 2, 3, 4, 5, 6].map((n) => parseFloat(tokenValue(core, `typography.font.size.h${n}.base`)));
if (headingRem.every((size, i) => i === 0 || size <= headingRem[i - 1])) {
  pass(2, `Heading sizes go from large to small: ${headingRem.join(' > ')} rem`);
} else {
  warn(2, `Heading sizes are not in order h1 ≥ h2 ≥ … ≥ h6: ${headingRem.join(', ')} rem`);
}
eachSharedDeclaration(/font-size\s*:\s*([^;]+)/, (m, where) => {
  if (/^\s*(var\(|inherit|calc\(100%)/.test(m[1]) || !/\d/.test(m[1])) { return; }
  warn(2, `${where} hardcoded font-size: ${m[1].trim()} (use a typography token)`);
});
eachSharedDeclaration(/font-weight\s*:\s*([^;]+)/, (m, where, line, file, inFontFace) => {
  if (/^\s*(var\(|inherit|normal)/.test(m[1]) || inFontFace) { return; }
  warn(2, `${where} hardcoded font-weight: ${m[1].trim()} (use a typography token)`);
});
level3Note(2, 'font sizes and weights');

for (const tokenPath of ['typography.font.size.base', 'typography.font.weight.base',
  'typography.line-height.base', 'typography.letter-spacing.base']) {
  if (tokenValue(core, tokenPath) !== undefined) { pass(3, `${tokenPath} is defined`); } else { fail(3, `${tokenPath} is missing`); }
}
const bodyRules = fs.existsSync(path.join(DIST_DIR, 'core.css'))
  ? [...read(path.join(DIST_DIR, 'core.css')).matchAll(/(?:^|[}\s])body\s*\{([^}]*)\}/g)].map((m) => m[1]).join('\n')
  : '';
for (const [prop, token] of [
  ['font-family', '--pgn-typography-font-family-base'],
  ['font-size', '--pgn-typography-font-size-base'],
  ['font-weight', '--pgn-typography-font-weight-base'],
  ['line-height', '--pgn-typography-line-height-base'],
]) {
  if (new RegExp(`${prop}\\s*:\\s*var\\(${token}`).test(bodyRules)) {
    pass(3, `body ${prop} uses ${token}`);
  } else {
    fail(3, `body ${prop} does not use ${token} in dist/core.css`);
  }
}

// ===========================================================================
// #4–#9 Buttons
// ===========================================================================

for (const type of buttonTypes) {
  const missing = BTN_STATES.flatMap((state) => BTN_PROPS
    .map((prop) => btnTokenPath(state, prop, type))
    .filter((p) => !light.tokens.has(p)));
  const coreMissing = missing.filter((p) => !/\.disabled\./.test(p));
  if (coreMissing.length) {
    fail(4, `Button "${type}" is missing ${coreMissing.length} tokens: ${coreMissing.join(', ')}`);
  } else {
    pass(4, `Button "${type}" has all normal/hover/active tokens`);
  }

  // A label without its own "modify" inherits Paragon's color-yiq and can be rewritten at build time.
  // Light and dark are separate builds, so each layer's labels are compared with its own built CSS.
  for (const [mode, layer] of [['light', light], ['dark', dark]]) {
    const prefix = mode === 'dark' ? 'dark: ' : '';
    for (const state of BTN_STATES) {
      const token = layer.tokens.get(btnTokenPath(state, 'text', type));
      if (!token || typeof token.value !== 'string') { continue; }
      const label = `${prefix}Button "${type}" ${state || 'normal'} label`;
      if (token.hasModify && token.modify !== null) {
        pass(4, `${label} uses automatic readable text (color-yiq) on purpose`);
        continue;
      }
      const reference = token.value.match(/^\{(.+)\}$/);
      const wanted = parseColor(reference
        ? resolveVar(mode, `--pgn-${reference[1].replace(/\./g, '-')}`)
        : token.value);
      const built = colorOf(mode, btnVar(state, 'text', type));
      if (!wanted || !built) { continue; }
      if (hex(wanted) === hex(built)) {
        pass(4, `${label} is built as set (${token.value})`);
      } else {
        fail(4, `${label} is set to ${token.value} (${hex(wanted)}) but the build changed it to ${hex(built)} — add "modify": null (${rel(token.file)})`,
          `${label} rewritten by the build`);
      }
    }
  }

  // #6 hover / #7 active: exist and look different from normal, in both modes
  for (const mode of ['light', 'dark']) {
    const prefix = mode === 'dark' ? 'dark: ' : '';
    const look = (state) => BTN_PROPS.map((prop) => colorOf(mode, btnVar(state, prop, type)));
    const normal = look('');
    if (mode === 'dark' && normal.every((c) => !c)) {
      warn(20, `Button "${type}" has no colors in dark mode: its tokens are only in light.css (add themes/dark/components/button/${type}.json)`);
      continue;
    }
    for (const [id, state, word] of [[6, 'hover', 'Hover'], [7, 'active', 'Active']]) {
      const missingState = BTN_PROPS.filter((prop) => !light.tokens.has(btnTokenPath(state, prop, type)));
      if (missingState.length) {
        if (mode === 'light') { fail(id, `Button "${type}" has no ${state} token for: ${missingState.join(', ')}`); }
        continue;
      }
      const stateLook = look(state);
      const page = colorOf(mode, backdropFor(type, mode)) || WHITE;
      const changed = stateLook.some((c, i) => c && normal[i] && distinct(over(c, page), over(normal[i], page)));
      if (changed) {
        pass(id, `${prefix}Button "${type}" ${state} looks different from normal`);
      } else {
        fail(id, `${prefix}Button "${type}" ${word} state looks the same as normal (fill, label and border unchanged)`);
      }
    }
  }

  // #8 disabled
  const missingDisabled = BTN_PROPS.filter((prop) => !light.tokens.has(btnTokenPath('disabled', prop, type)));
  if (missingDisabled.length) {
    fail(8, `Button "${type}" has no disabled token for: ${missingDisabled.join(', ')}`);
  } else {
    pass(8, `Button "${type}" has disabled fill, label and border tokens`);
  }

  // #9 focus ring and #11 label contrast, both modes
  const focusVar = `--pgn-color-btn-focus-outline-${type}`;
  const focusValue = resolveVar('light', focusVar);
  if (!focusValue) {
    warn(9, `Button "${type}" has no focus ring token (${focusVar}), so its keyboard focus cannot be checked — add it to the button's token file`);
  } else if (/^(inherit|currentcolor)$/i.test(focusValue)) {
    pass(9, `Button "${type}" focus ring follows its text color (${focusValue})`);
  }
  for (const mode of ['light', 'dark']) {
    checkContrast(9, mode, `Button "${type}" focus ring`, focusVar,
      backdropFor(type, mode), settings.contrast.nonText, backdropFor(type, mode));
    for (const state of ['', 'hover', 'active']) {
      checkContrast(11, mode, `Button "${type}" ${state || 'normal'} label`,
        btnVar(state, 'text', type), btnVar(state, 'bg', type), settings.contrast.text, backdropFor(type, mode));
    }
  }
}

const sizePaths = [
  'size.btn.border.width',
  ...['sm', 'base', 'lg'].flatMap((s) => [
    `size.btn.border.radius.${s}`, `spacing.btn.padding.x.${s}`, `spacing.btn.padding.y.${s}`, `typography.btn.font.size.${s}`,
  ]),
  'typography.btn.font.weight',
];
for (const tokenPath of sizePaths) {
  if (tokenValue(core, tokenPath) === undefined) {
    fail(5, `${tokenPath} is missing`);
    continue;
  }
  const cssName = `--pgn-${tokenPath.replace(/\./g, '-')}`;
  const built = resolveVar('light', cssName);
  if (built) { pass(5, `${cssName} = ${built}`); } else { fail(5, `${cssName} is not in the built CSS`); }
}

// ===========================================================================
// #10 Links  #11 contrast pairs  #12 focus  #13 errors  #14 tabs
// ===========================================================================

const T = settings.contrast.text;
const N = settings.contrast.nonText;
const textPairs = [
  ['Body text', '--pgn-color-body-base', '--pgn-color-body-bg'],
  ['Headings', '--pgn-color-headings-base', PAGE_BG],
  ['Main text', '--pgn-color-text-base', PAGE_BG],
  ['Muted text', '--pgn-color-text-muted', PAGE_BG],
  ['Link', '--pgn-color-link-base', PAGE_BG],
  ['Link hover', '--pgn-color-link-hover', PAGE_BG],
  ['Inline link', '--pgn-color-link-inline-base', PAGE_BG],
  ['Form label', '--pgn-color-form-label-base', PAGE_BG],
  ['Input text', '--pgn-color-form-input-base', '--pgn-color-form-input-bg-base'],
  ['Input placeholder', '--pgn-color-form-input-placeholder', '--pgn-color-form-input-bg-base'],
  ...['success', 'info', 'danger', 'warning'].flatMap((t) => [
    [`Alert ${t} text`, '--pgn-color-alert-content', `--pgn-color-alert-bg-${t}`],
    [`Alert ${t} title`, '--pgn-color-alert-title', `--pgn-color-alert-bg-${t}`],
  ]),
  ...['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'light', 'dark']
    .map((t) => [`Badge ${t}`, `--pgn-color-badge-text-${t}`, `--pgn-color-badge-bg-${t}`]),
  ['Tab text', '--pgn-color-nav-link-text-base', PAGE_BG],
  ['Tab hover text', '--pgn-color-nav-tabs-base-link-hover-text', '--pgn-color-nav-tabs-base-link-hover-bg'],
  ['Tooltip', '--pgn-color-tooltip-text', '--pgn-color-tooltip-bg-base'],
  ['Tooltip (light)', '--pgn-color-tooltip-light', '--pgn-color-tooltip-bg-light'],
  ['Dropdown item', '--pgn-color-dropdown-item-text', '--pgn-color-dropdown-bg'],
  ['Dropdown item hover', '--pgn-color-dropdown-item-hover-text', '--pgn-color-dropdown-item-hover-bg'],
  ['Pagination number', '--pgn-color-pagination-text-base', '--pgn-color-pagination-bg-base'],
  ['Pagination hover', '--pgn-color-pagination-text-hover', '--pgn-color-pagination-bg-hover'],
  ['Pagination current page', '--pgn-color-pagination-text-active', '--pgn-color-pagination-bg-active'],
  ['Table cell', '--pgn-color-data-table-text', '--pgn-color-data-table-bg-base'],
  ['Table header', '--pgn-color-data-table-header-text', '--pgn-color-data-table-header-bg'],
  ['Table striped row', '--pgn-color-data-table-text', '--pgn-color-data-table-row-striped-bg'],
  ['Table selected row', '--pgn-color-data-table-text', '--pgn-color-data-table-row-selected-bg'],
  ['Toast', '--pgn-color-toast-header-text', '--pgn-color-toast-header-bg'],
  ['Breadcrumb link', '--pgn-color-breadcrumb-base', PAGE_BG],
  ['Breadcrumb current page', '--pgn-color-breadcrumb-active', PAGE_BG],
  ['List item', '--pgn-color-list-group-action-base', '--pgn-color-list-group-bg-base'],
  ['List item selected', '--pgn-color-list-group-active-base', '--pgn-color-list-group-active-bg'],
  ['Card title', '--pgn-color-card-header-title', '--pgn-color-card-bg-base'],
  ...['success', 'danger', 'warning']
    .map((t) => [`Card status ${t} text`, '--pgn-color-card-status-text', `--pgn-color-${t}-100`]),
  ['Popover title', '--pgn-color-popover-header-text', '--pgn-color-popover-header-bg'],
  ['Popover body', '--pgn-color-popover-body', '--pgn-color-popover-bg'],
  ...['success', 'warning', 'danger']
    .map((t) => [`Popover ${t} title`, '--pgn-color-popover-header-text', `--pgn-color-popover-${t}-bg`]),
  ['Menu item', '--pgn-color-menu-item-color', '--pgn-color-menu-bg'],
  ...['light', 'dark', 'warning']
    .map((t) => [`Page banner ${t}`, `--pgn-color-page-banner-text-${t}`, `--pgn-color-page-banner-bg-${t}`]),
  ['SelectableBox text', '--pgn-color-body-base', '--pgn-color-selectable-box-bg'],
];
const nonTextPairs = [
  ['Input border', '--pgn-color-form-input-border', '--pgn-color-form-input-bg-base'],
  ['Checkbox/radio border', '--pgn-color-form-control-indicator-border', PAGE_BG],
  ['Checked checkbox/radio', '--pgn-color-form-control-indicator-checked-bg-base', PAGE_BG],
];
const focusPairs = [
  ['Input focus border', '--pgn-color-form-input-focus-border', '--pgn-color-form-input-bg-base'],
  ['Tab focus ring', '--pgn-border-color-nav-tabs-link-border-focus', PAGE_BG],
  ['Card focus ring', '--pgn-color-card-border-focus-base', '--pgn-color-card-bg-base'],
  ['Pagination focus ring', '--pgn-color-pagination-focus-base', PAGE_BG],
];

for (const mode of ['light', 'dark']) {
  textPairs.forEach(([label, fg, bg]) => checkContrast(11, mode, label, fg, bg, T));
  nonTextPairs.forEach(([label, fg, bg]) => checkContrast(11, mode, label, fg, bg, N));
  focusPairs.forEach(([label, fg, bg]) => checkContrast(12, mode, label, fg, bg, N));

  // #10 link states differ from the normal link
  const linkBase = colorOf(mode, '--pgn-color-link-base');
  for (const state of ['hover', 'focus', 'active']) {
    const c = colorOf(mode, `--pgn-color-link-${state}`);
    if (!linkBase || !c) {
      fail(10, `${mode}: --pgn-color-link-${state} is not defined`);
    } else if (distinct(c, linkBase)) {
      pass(10, `${mode}: link ${state} ${hex(c)} differs from link ${hex(linkBase)}`);
    } else {
      fail(10, `${mode}: link ${state} ${hex(c)} looks the same as the normal link ${hex(linkBase)}`,
        `${mode}: link ${state} same as normal`);
    }
  }
  checkContrast(10, mode, 'Link focus', '--pgn-color-link-focus', PAGE_BG, T);

  // #13 error states
  checkContrast(13, mode, 'Error message text', '--pgn-color-form-feedback-invalid', PAGE_BG, T);
  checkContrast(13, mode, 'Error input border', '--pgn-color-danger-base', '--pgn-color-form-input-bg-base', N);
  const danger = colorOf(mode, '--pgn-color-danger-base');
  const border = colorOf(mode, '--pgn-color-form-input-border');
  if (danger && border && distinct(danger, border)) {
    pass(13, `${mode}: error border ${hex(danger)} differs from the normal input border ${hex(border)}`);
  } else if (danger && border) {
    fail(13, `${mode}: error border ${hex(danger)} looks the same as the normal input border ${hex(border)}`,
      `${mode}: error border same as normal border`);
  }

  // #14 active tab
  checkContrast(14, mode, 'Selected tab text', '--pgn-color-nav-tabs-base-link-active-text', PAGE_BG, T);
  checkContrast(14, mode, 'Selected tab underline', '--pgn-border-color-nav-tabs-link-border-active', PAGE_BG, N);
  checkContrast(14, mode, 'Selected tab underline (course tabs)', '--pgn-color-nav-tabs-base-link-active-border', PAGE_BG, N);
  const activeTab = colorOf(mode, '--pgn-color-nav-tabs-base-link-active-text');
  const inactiveTab = colorOf(mode, '--pgn-color-nav-link-text-base');
  if (activeTab && inactiveTab && distinct(activeTab, inactiveTab)) {
    pass(14, `${mode}: selected tab ${hex(activeTab)} differs from other tabs ${hex(inactiveTab)}`);
  } else if (activeTab && inactiveTab) {
    fail(14, `${mode}: selected tab ${hex(activeTab)} looks the same as other tabs ${hex(inactiveTab)}`,
      `${mode}: selected tab same as other tabs`);
  }
}

// ===========================================================================
// #15 #16 Container  #17 Spacing  #18 Breakpoints  #19 RTL
// ===========================================================================

// Container and gutter: any value is allowed, as long as it is a real length set in the token and built as set.
const LENGTH = /^\d+(\.\d+)?(px|rem)$/;
const layoutTokens = [
  ...['xs', 'sm', 'md', 'lg', 'xl'].map((s) => `size.container.max-width.${s}`),
  'spacing.grid.gutter-width',
];
for (const tokenPath of layoutTokens) {
  const value = tokenValue(core, tokenPath);
  const cssName = `--pgn-${tokenPath.replace(/\./g, '-')}`;
  const built = resolveVar('light', cssName);
  if (typeof value !== 'string' || !LENGTH.test(value.trim())) {
    fail(15, `${tokenPath} is "${value}" — it must be a fixed length such as 1200px or 1.5rem`, `${tokenPath} not a fixed length`);
  } else if (built !== value) {
    fail(15, `${cssName} is built as "${built}" but the token says "${value}"`, `${cssName} differs from token`);
  } else {
    pass(15, `${tokenPath} = ${value}`);
  }
}

const xl = tokenValue(core, 'size.container.max-width.xl');
const widths = ['xs', 'sm', 'md', 'lg', 'xl'].map((s) => [s, parseFloat(tokenValue(core, `size.container.max-width.${s}`))]);
if (typeof xl === 'string' && LENGTH.test(xl.trim())) {
  pass(16, `Content stops growing at ${xl} on large screens`);
} else {
  fail(16, `size.container.max-width.xl is "${xl}" — without a fixed maximum width content stretches across large screens`,
    'container xl has no fixed maximum');
}
if (widths.every(([, w], i) => !Number.isNaN(w) && (i === 0 || w > widths[i - 1][1]))) {
  pass(16, `Container widths grow with screen size: ${widths.map(([s, w]) => `${s} ${w}px`).join(', ')}`);
} else {
  fail(16, `Container widths must grow xs < sm < md < lg < xl: ${widths.map(([s, w]) => `${s} ${w}`).join(', ')}`);
}

if (tokenValue(core, 'spacing.spacer.base') !== undefined) { pass(17, 'spacing.spacer.base is defined'); } else {
  fail(17, 'spacing.spacer.base is missing');
}
eachSharedDeclaration(/\b(margin|padding|gap)(-[a-z-]+)?\s*:\s*([^;]+)/, (m, where) => {
  if (/\b([2-9]|\d{2,})px\b/.test(m[3].replace(/var\([^)]*\)/g, ''))) {
    warn(17, `${where} hardcoded ${m[1]}${m[2] || ''}: ${m[3].trim()} (use a spacing token)`);
  }
});
level3Note(17, 'margins and padding');

// Breakpoints come from the design system itself (Paragon's custom media), not from a list kept here.
const breakpointFile = path.join(PARAGON_CSS, 'core/custom-media-breakpoints.css');
const designBreakpoints = fs.existsSync(breakpointFile)
  ? [...new Set([...read(breakpointFile).matchAll(/width:\s*([\d.]+)px/g)].map((x) => parseFloat(x[1])).filter((v) => v > 0))]
    .sort((a, b) => a - b)
  : [];
if (!designBreakpoints.length) {
  fail(18, `Paragon breakpoints not found (${rel(breakpointFile)}) — run "npm install"`);
}
const allowedBreakpoints = designBreakpoints.flatMap((bp) => [bp, bp - 1, bp - 0.02, bp - 0.98]);
eachSharedDeclaration(/@media\s+([^{]+)/, (m, where) => {
  const query = m[1].trim();
  const pxValues = [...query.matchAll(/(?:min|max)-width\s*:\s*([\d.]+)px/g)].map((x) => parseFloat(x[1]));
  const bad = pxValues.filter((v) => !allowedBreakpoints.some((a) => Math.abs(a - v) < 0.001));
  if (bad.length) {
    fail(18, `${where} @media ${query} uses ${bad.join('px, ')}px — design system breakpoints: ${designBreakpoints.join(', ')}px (or use --pgn-size-breakpoint-*)`);
  } else {
    pass(18, `${where} @media ${query}`);
  }
});
level3Note(18, 'breakpoints');

// Only one-sided rules break in RTL: "padding-left: 1rem; padding-right: 1rem" in the same rule is symmetric and safe.
function physicalSide(prop, value) {
  const m = prop.match(/^(margin|padding|border)-(left|right)(-[a-z]+)?$/);
  if (m) { return { pairKey: `${m[1]}${m[3] || ''}`, side: m[2] }; }
  if (prop === 'left' || prop === 'right') { return { pairKey: 'inset', side: prop }; }
  if (['float', 'clear', 'text-align'].includes(prop) && /^(left|right)\b/.test(value)) { return { pairKey: null, side: value }; }
  return null;
}
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
for (const { file, lines } of scss) {
  const hasRtl = lines.some((l) => /\[dir=["']?rtl|:dir\(rtl\)/.test(l));
  const hits = [];
  for (const { decls } of ruleBlocks(lines)) {
    const physical = decls.map((d) => ({ ...d, ...physicalSide(d.prop, d.value) })).filter((d) => d.side);
    for (const d of physical) {
      const opposite = d.side === 'left' ? 'right' : 'left';
      const mirrored = d.pairKey && physical.some((o) => o.pairKey === d.pairKey && o.side === opposite
        && normalize(o.value) === normalize(d.value));
      if (!mirrored) { hits.push(d.line); }
    }
  }
  if (!hits.length) { continue; }
  hits.sort((a, b) => a - b);
  if (hasRtl) {
    pass(19, `${rel(file)} has one-sided left/right rules and a matching RTL rule`);
  } else {
    warn(19, `${rel(file)}: ${hits.length} one-sided left/right declarations and no [dir="rtl"] rule (lines ${hits.slice(0, 6).join(', ')}${hits.length > 6 ? ', …' : ''})`);
  }
}

// ===========================================================================
// #20 Dark / light
// ===========================================================================

for (const mode of ['light', 'dark']) {
  const file = path.join(DIST_DIR, `${mode}.css`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) { pass(20, `dist/${mode}.css is built`); } else {
    fail(20, `dist/${mode}.css is missing or empty`);
  }
}
const themeUrlsFile = path.join(DIST_DIR, 'theme-urls.json');
const themeUrls = fs.existsSync(themeUrlsFile) ? JSON.parse(read(themeUrlsFile)).themeUrls : null;
for (const mode of ['light', 'dark']) {
  if (themeUrls?.variants?.[mode]) { pass(20, `theme-urls.json lists the ${mode} variant`); } else {
    fail(20, `dist/theme-urls.json does not list the ${mode} variant`);
  }
}
for (const tokenPath of ['color.primary.base', 'color.secondary.base', 'color.brand.base', 'color.bg.base',
  'color.text.base', 'color.surface.base', 'color.body.base', 'color.link.base']) {
  if (dark.tokens.has(tokenPath)) { pass(20, `Dark mode defines ${tokenPath}`); } else {
    fail(20, `Dark mode does not define ${tokenPath} (themes/dark)`);
  }
}
// A variable set only in light.css (or only in dark.css) has no value at all in the other mode.
for (const [mode, own] of [['dark', css.light.vars], ['light', css.dark.vars]]) {
  for (const name of Object.keys(own)) { noteNoValue(mode, name); }
}
const noValue = [...noValueInMode.values()].sort((a, b) => a.mode.localeCompare(b.mode) || a.name.localeCompare(b.name));
for (const { mode, name, usedBy } of noValue) {
  const where = mode === 'dark' ? 'light.css' : 'dark.css';
  const uses = usedBy.size ? ` — used by: ${[...usedBy].join(', ')}` : '';
  fail(20, `${mode}: ${name} has no value in ${mode} mode (it is only set in ${where}; add it to themes/${mode})${uses}`,
    `${mode}: ${name} has no value`);
}
if (!noValue.length) { pass(20, 'Every variable set in light.css or dark.css has a value in both modes'); }
const componentFolders = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const paragonLightValues = new Map();
const collectParagonLight = (node, keys) => {
  if (!node || typeof node !== 'object') { return; }
  if ('$value' in node) { paragonLightValues.set(keys.join('.'), JSON.stringify([node.$value, node.modify ?? null])); return; }
  Object.entries(node).forEach(([key, child]) => { if (!key.startsWith('$')) { collectParagonLight(child, [...keys, key]); } });
};
for (const file of listFiles(path.join(PARAGON_TOKENS, 'themes/light'), '.json')) {
  try { collectParagonLight(JSON.parse(read(file)), []); } catch (e) { /* Paragon's own files */ }
}
// A folder that only restates Paragon's light values needs no dark twin: dark mode keeps Paragon's defaults.
const changesParagon = (folder) => {
  const dir = path.join(TOKENS_DIR, 'themes/light/components', folder) + path.sep;
  return [...light.tokens].some(([tokenPath, entry]) => entry.file.startsWith(dir)
    && paragonLightValues.get(tokenPath) !== JSON.stringify([entry.value, entry.modify ?? null]));
};
const lightOnly = componentFolders(path.join(TOKENS_DIR, 'themes/light/components'))
  .filter((c) => !componentFolders(path.join(TOKENS_DIR, 'themes/dark/components')).includes(c))
  .filter(changesParagon);
if (lightOnly.length) {
  warn(20, `No dark-mode token files for: ${lightOnly.join(', ')} — their light files change Paragon values, but dark mode uses Paragon defaults for these (their dark contrast is still checked under #11)`);
}

// ===========================================================================
// #21 Assets  #22 CSS size, duplicates, unused tokens
// ===========================================================================

for (const name of ['core.css', 'light.css', 'dark.css']) {
  const file = path.join(DIST_DIR, name);
  if (!fs.existsSync(file)) { continue; }
  for (const m of read(file).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const url = m[1].trim();
    if (/^(data:|https?:|\/\/|#)/.test(url)) { continue; }
    const target = path.join(DIST_DIR, url.split(/[?#]/)[0]);
    if (fs.existsSync(target)) { pass(21, `dist/${name}: ${url} exists`); } else {
      fail(21, `dist/${name}: ${url} is missing (${rel(target)})`);
    }
  }
}
if (themeUrls) {
  const paths = [
    ...Object.values(themeUrls.core?.paths || {}),
    ...Object.values(themeUrls.variants || {}).flatMap((v) => Object.values(v.paths || {})),
  ];
  for (const p of paths) {
    if (fs.existsSync(path.join(DIST_DIR, p))) { pass(21, `theme-urls.json: ${p} exists`); } else {
      fail(21, `theme-urls.json points to ${p}, which is missing`);
    }
  }
}

for (const [name, budgetKb] of Object.entries(settings.cssBudgetKb)) {
  const file = path.join(DIST_DIR, name);
  if (!fs.existsSync(file)) { continue; }
  const kb = fs.statSync(file).size / 1024;
  if (kb <= budgetKb) { pass(22, `dist/${name} ${kb.toFixed(0)} KB ≤ ${budgetKb} KB`); } else {
    fail(22, `dist/${name} is ${kb.toFixed(0)} KB, over the ${budgetKb} KB budget`, `dist/${name} over budget`);
  }
}
for (const [label, source] of [['core', css.core], ['light', css.light], ['dark', css.dark]]) {
  source.duplicates.forEach((d) => fail(22, `dist/${label}.css declares ${d.name} twice: "${d.first}" and "${d.second}"`));
}
for (const [label, layer] of [['core', core], ['light', light], ['dark', dark]]) {
  layer.duplicates.forEach((d) => warn(22, `${label}: token ${d.tokenPath} is defined in two files: ${d.files.map(rel).join(' and ')}`));
}
const allBuiltCss = ['core.css', 'light.css', 'dark.css']
  .map((n) => path.join(DIST_DIR, n)).filter(fs.existsSync).map(read).join('\n');
const paragonNames = new Set([...Object.keys(css.paragonCore.vars), ...Object.keys(css.paragonLight.vars)]);
const unused = [...new Set([...Object.keys(css.core.vars), ...Object.keys(css.light.vars), ...Object.keys(css.dark.vars)])]
  .filter((name) => !paragonNames.has(name))
  .filter((name) => !allBuiltCss.includes(`var(${name}`) && !allBuiltCss.includes(`var(${name},`));
if (unused.length) {
  warn(22, `Custom tokens that nothing uses: ${unused.join(', ')}`);
} else {
  pass(22, 'Every custom token is used');
}

// ===========================================================================
// Report
// ===========================================================================

if (UPDATE_BASELINE) {
  const knownIssues = failureKeys.map(({ key, message }) => ({ key, message }));
  fs.writeFileSync(BASELINE_FILE, `${JSON.stringify({
    $description: 'Known issues recorded by "npm run validate:baseline". They are reported as warnings until fixed. Remove an entry once it is fixed so it can never come back unnoticed.',
    updated: new Date().toISOString().slice(0, 10),
    knownIssues,
  }, null, 2)}\n`);
  console.log(`Recorded ${knownIssues.length} known issues in ${rel(BASELINE_FILE)}`);
  process.exit(0);
}

const report = CHECKPOINTS.map(([id, group, title]) => {
  const r = results.get(id);
  const status = r.fail.length ? 'FAIL' : (r.warn.length || r.known.length) ? 'WARN' : 'PASS';
  return {
    id, group, title, status, failed: r.fail, knownIssues: r.known, warnings: r.warn, passed: r.pass.length, passedChecks: r.pass,
  };
});
const totals = {
  PASS: report.filter((r) => r.status === 'PASS').length,
  WARN: report.filter((r) => r.status === 'WARN').length,
  FAIL: report.filter((r) => r.status === 'FAIL').length,
  knownIssues: report.reduce((n, r) => n + r.knownIssues.length, 0),
};
const failed = totals.FAIL > 0 || (STRICT && totals.WARN > 0);

if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify({ passed: !failed, totals, checkpoints: report }, null, 2)}\n`);
} else {
  const color = process.stdout.isTTY ? { PASS: '\x1b[32m', WARN: '\x1b[33m', FAIL: '\x1b[31m', off: '\x1b[0m' }
    : { PASS: '', WARN: '', FAIL: '', off: '' };
  const list = (items, mark) => {
    const shown = VERBOSE ? items : items.slice(0, MAX_LINES);
    shown.forEach((m) => console.log(`        ${mark} ${m}`));
    if (shown.length < items.length) { console.log(`        … and ${items.length - shown.length} more (run with --verbose)`); }
  };
  console.log('\nTitanEd design token validation');
  console.log('================================');
  for (const r of report) {
    const counts = [
      `${r.passed} passed`,
      r.failed.length && `${r.failed.length} failed`,
      r.knownIssues.length && `${r.knownIssues.length} known issues`,
      r.warnings.length && `${r.warnings.length} warnings`,
    ].filter(Boolean).join(', ');
    console.log(`${color[r.status]}[${r.status}]${color.off} #${String(r.id).padEnd(2)} ${r.group}: ${r.title}  (${counts})`);
    list(r.failed, '✗');
    list(r.warnings, '!');
    if (VERBOSE) {
      list(r.knownIssues, '~');
      list(r.passedChecks, '✓');
    }
  }
  console.log('--------------------------------');
  if (totals.knownIssues) {
    console.log(`${totals.knownIssues} known issues from ${rel(BASELINE_FILE)} are counted as warnings (see them with --verbose).`);
  }
  console.log(`Checkpoints: ${totals.PASS} pass, ${totals.WARN} warn, ${totals.FAIL} fail → ${failed ? `${color.FAIL}FAILED${color.off}` : `${color.PASS}PASSED${color.off}`}${STRICT ? ' (strict)' : ''}\n`);
}

process.exitCode = failed ? 1 : 0;
