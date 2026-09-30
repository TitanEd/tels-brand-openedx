/*
 * Which colors the token build works out from another color, per mode: tokens with a "modify" list whose value
 * is one reference ("{color.primary.base}"). The token files are merged like "paragon build-tokens" does for a
 * theme: Paragon's core and light tokens first, then ours for that mode (paragon/tokens/src/themes/<mode>).
 * Result: { rules: { light: { '--pgn-…': { ref: '--pgn-…', modify } }, dark: {…} }, yiq: { threshold, light, dark } },
 * used with preview/derived-colors.js.
 */
const fs = require('fs');
const path = require('path');
const { applyModify } = require('../preview/derived-colors');

const ROOT = path.resolve(__dirname, '..');
const PARAGON = path.join(ROOT, 'node_modules/@openedx/paragon/tokens/src');
const OURS = path.join(ROOT, 'paragon/tokens/src');

const isObject = (x) => x && typeof x === 'object' && !Array.isArray(x);
function merge(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (isObject(value) && isObject(target[key])) { merge(target[key], value); } else { target[key] = isObject(value) ? merge({}, value) : value; }
  });
  return target;
}

function readTree(dir, into = {}) {
  if (!fs.existsSync(dir)) { return into; }
  fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { readTree(file, into); return; }
    if (!entry.name.endsWith('.json')) { return; }
    try {
      merge(into, JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (e) {
      console.error(`${path.relative(ROOT, file)}: ${e.message}`);
    }
  });
  return into;
}

function rulesOf(tree) {
  const rules = {};
  const visit = (node, keys) => {
    if (!isObject(node)) { return; }
    if ('$value' in node) {
      const ref = /^\{([^{}]+)\}$/.exec(typeof node.$value === 'string' ? node.$value.trim() : '');
      if (ref && Array.isArray(node.modify) && node.modify.length) {
        rules[`--pgn-${keys.join('-').replace(/\./g, '-')}`] = { ref: `--pgn-${ref[1].replace(/\./g, '-')}`, modify: node.modify };
      }
      return;
    }
    Object.entries(node).forEach(([key, child]) => { if (!key.startsWith('$')) { visit(child, [...keys, key]); } });
  };
  visit(tree, []);
  return rules;
}

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return {};
  }
};

/** Map(--pgn-* name -> value) of the declarations in `css`, first one first. */
function declarations(css) {
  const values = new Map();
  for (const [, name, value] of css.matchAll(/(--pgn-[\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
    if (!values.has(name)) { values.set(name, value.trim()); }
  }
  return values;
}

/** Map of every --pgn-* name -> value in dist/core.css and dist/<mode>.css (the mode wins). */
function builtValues(mode) {
  const read = (name) => {
    const file = path.join(ROOT, 'dist', `${name}.css`);
    return fs.existsSync(file) ? declarations(fs.readFileSync(file, 'utf8')) : new Map();
  };
  return new Map([...read('core'), ...read(mode)]);
}

/**
 * Keeps the rules that give the value the build wrote when applied to the built source color, so rules that the
 * build did not apply (e.g. a token that ends up as var(--pgn-…)) are never used.
 */
function checked(rules, raw, yiq) {
  const resolve = (value, depth = 0) => {
    const ref = /^var\(\s*(--pgn-[\w-]+)\s*(?:,\s*(.+))?\)$/.exec((value || '').trim());
    return ref && depth < 30 ? resolve(raw.get(ref[1]) ?? ref[2], depth + 1) : value;
  };
  return Object.fromEntries(Object.entries(rules).filter(([name, rule]) => {
    const built = raw.get(name);
    if (!built || /^var\(/.test(built)) { return false; }
    const steps = rule.modify.map((s) => (/^\{.+\}$/.test(s.otherColor || '')
      ? { ...s, otherColor: resolve(raw.get(`--pgn-${s.otherColor.slice(1, -1).replace(/\./g, '-')}`)) } : s));
    return (applyModify(resolve(raw.get(rule.ref)), steps, yiq) || '').toUpperCase() === built.toUpperCase();
  }));
}

function derivedTokens() {
  const base = () => readTree(path.join(PARAGON, 'themes/light'), readTree(path.join(PARAGON, 'core')));
  const colors = readJson(path.join(PARAGON, 'themes/light/global/other.json'));
  const yiq = {
    threshold: readJson(path.join(PARAGON, 'core/global/other.json'))['yiq-contrasted-threshold'],
    light: colors['yiq-text-light'],
    dark: colors['yiq-text-dark'],
  };
  const rules = Object.fromEntries(['light', 'dark'].map((mode) => [
    mode, checked(rulesOf(readTree(path.join(OURS, `themes/${mode}`), base())), builtValues(mode), yiq),
  ]));
  return { rules, yiq };
}

module.exports = { builtValues, declarations, derivedTokens };
