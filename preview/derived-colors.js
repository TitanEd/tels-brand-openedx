// Colors that the token build works out from another color ("modify" in the token files: Primary 700 is Primary
// mixed with 20% black). The build writes them as fixed hex values, so a saved Primary would not reach them; this
// works them out again from the saved values with the same math as Paragon (tokens/style-dictionary.js and
// tokens/sass-helpers.js in @openedx/paragon). Shared by the page (preview/saved.jsx) and the preview server
// (scripts/saved-theme.js); the rules come from scripts/derived-tokens.js.
const chromaModule = require('chroma-js');

const chroma = chromaModule.default || chromaModule;
const RESERVED = ['inherit', 'initial', 'revert', 'unset', 'currentColor', 'none'];

const lighten = (color, amount) => color.set('hsl.l', color.get('hsl.l') + Number(amount));

/** Bootstrap's color-yiq as Paragon does it: dark or light text for `background`, adjusted to reach 4.5:1. */
function colorYiq(background, { light, dark, threshold }, yiq) {
  const [r, g, b] = background.rgb();
  const isLight = ((r * 299) + (g * 587) + (b * 114)) * 0.001 >= Number(threshold || yiq.threshold);
  let result = chroma(isLight ? (dark || yiq.dark) : (light || yiq.light));
  for (let attempt = 1; chroma.contrast(background, result) < 4.5 && attempt <= 10; attempt += 1) {
    result = isLight ? result.darken(0.1) : result.brighten(0.1);
  }
  return result;
}

/** `value` (a color) with the `modify` steps of a token applied, as #RRGGBBAA; null when it is not a color. */
function applyModify(value, modify, yiq) {
  if (RESERVED.includes(value)) { return null; }
  let color;
  try {
    color = chroma(value);
    modify.forEach((step) => {
      const { type, amount, otherColor } = step;
      if (type === 'mix') { color = color.mix(otherColor, Number(amount), 'rgb'); } else if (type === 'color-yiq') {
        color = colorYiq(color, step, yiq);
      } else if (type === 'darken') { color = lighten(color, -amount); } else if (type === 'lighten') {
        color = lighten(color, amount);
      } else if (typeof color[type] === 'function') { color = color[type](Number(amount)); } else { throw new Error(type); }
    });
  } catch (e) {
    return null;
  }
  return color.hex('rgba').toUpperCase();
}

const same = (a, b) => {
  if (a === b) { return true; }
  try {
    return chroma(a).hex('rgba') === chroma(b).hex('rgba');
  } catch (e) {
    return false;
  }
};

/**
 * The values of the worked-out colors whose source color is different in `values` from the built CSS.
 *   rules  { '--pgn-color-primary-700': { ref: '--pgn-color-primary-base', modify: [...] }, ... } for this mode
 *   raw    Map or object of every --pgn-* name -> value as the built CSS writes it (e.g. "var(--pgn-…)")
 *   values the values set on top (saved or previewed)
 *   yiq    { threshold, light, dark }: Paragon's defaults for color-yiq
 * Returns { name: '#RRGGBBAA' }, also for names in `values` (callers let `values` win).
 */
function derivedValues({
  rules, raw, values, yiq,
}) {
  const get = (name) => (raw instanceof Map ? raw.get(name) : raw[name]);
  /** name -> value as the page shows it with `set` on top of the built CSS (`live`: work out changed colors). */
  const resolver = (set, live) => {
    const memo = new Map();
    const valueOf = (name, depth = 0) => {
      if (depth > 30) { return undefined; }
      if (memo.has(name)) { return memo.get(name); }
      const text = (value) => {
        const ref = /^var\(\s*(--pgn-[\w-]+)\s*(?:,\s*(.+))?\)$/.exec((value || '').trim());
        return ref ? (valueOf(ref[1], depth + 1) ?? ref[2]) : value;
      };
      let result;
      if (set[name] !== undefined) {
        result = text(set[name]);
      } else {
        result = (live && worked(name, valueOf, depth)) || text(get(name));
      }
      memo.set(name, result);
      return result;
    };
    return valueOf;
  };
  const base = resolver({}, false);
  /** The worked-out value of `name` from its source color, or null when that color is the built one. */
  function worked(name, valueOf, depth = 0) {
    const rule = rules[name];
    if (!rule || same(valueOf(rule.ref, depth + 1), base(rule.ref))) { return null; }
    const steps = rule.modify.map((s) => (/^\{.+\}$/.test(s.otherColor || '')
      ? { ...s, otherColor: valueOf(`--pgn-${s.otherColor.slice(1, -1).replace(/\./g, '-')}`, depth + 1) } : s));
    return applyModify(valueOf(rule.ref, depth + 1), steps, yiq);
  }
  const current = resolver(values, true);
  const derived = {};
  Object.keys(rules).forEach((name) => {
    const value = worked(name, current);
    if (value && !same(value, base(name))) { derived[name] = value; }
  });
  return derived;
}

module.exports = { applyModify, derivedValues };
