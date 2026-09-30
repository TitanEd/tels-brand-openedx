/*
 * Saved token values per mode and the theme stylesheets built from them, in saved-theme/ (gitignored):
 *   <mode>.json               { tokens, history, preview }: saved values, their history, and the values being
 *                             previewed (all token values the apps should show, or null)
 *   <mode>.css, .min.css      dist/<mode>.css with the saved values in :root (written on every save), plus the
 *                             colors the build worked out from a saved color (preview/derived-colors.js)
 *   <mode>.preview.css, ...   the same with the previewed values, while a preview is on
 *   themes.json               { themes, selected }: theme templates made on the page (preview/theme-template.js)
 *   fonts.json, fonts/        uploaded font files: [{ family, weight, style, file }]; the theme stylesheets get an
 *                             @font-face for each, with url(uploaded-fonts/<file>) next to the stylesheet
 * Used by preview-server.js (the page, which writes) and theme-server.js (npm run serve, which the MFEs load).
 */
const fs = require('fs');
const path = require('path');
const { withTokens } = require('./theme-css');
const { valueProblem } = require('../preview/token-value');
const { checkThemes, upgradeTheme } = require('../preview/theme-template');
const { derivedValues } = require('../preview/derived-colors');
const { builtValues, derivedTokens } = require('./derived-tokens');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SAVED = path.join(ROOT, 'saved-theme');
const FONTS = path.join(SAVED, 'fonts');
const MODES = ['light', 'dark'];
const EXTENSIONS = ['.css', '.min.css'];
const FONT_URL = 'uploaded-fonts/';

const savedFile = (mode) => path.join(SAVED, `${mode}.json`);
const themesFile = path.join(SAVED, 'themes.json');
const fontsFile = path.join(SAVED, 'fonts.json');
const mtime = (file) => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0);
const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
};

function readSaved(mode) {
  try {
    const { tokens, history, preview } = JSON.parse(fs.readFileSync(savedFile(mode), 'utf8'));
    return { tokens: tokens || {}, history: history || [], preview: preview || null };
  } catch (e) {
    return { tokens: {}, history: [], preview: null };
  }
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, file);
}

// ---------------------------------------------------------------------------
// Uploaded fonts
// ---------------------------------------------------------------------------

const FONT_FORMATS = {
  woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype',
};
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,59}$/;

function readFonts() {
  const fonts = readJson(fontsFile, []);
  return Array.isArray(fonts) ? fonts : [];
}

/** The font file type from its first bytes, or null when it is not a font. */
function fontType(data) {
  const tag = data.subarray(0, 4).toString('latin1');
  if (tag === 'wOF2') { return 'woff2'; }
  if (tag === 'wOFF') { return 'woff'; }
  if (tag === 'OTTO') { return 'otf'; }
  if (tag === 'true' || data.subarray(0, 4).equals(Buffer.from([0, 1, 0, 0]))) { return 'ttf'; }
  return null;
}

/**
 * Stores an uploaded font file for { family, weight, style }, replacing the one with the same family, weight and
 * style. Returns { font } or { error }.
 */
function addFont(data, { family, weight, style }) {
  const type = fontType(data);
  if (!type) { return { error: 'Not a WOFF2, WOFF, TTF or OTF font file.' }; }
  const name = String(family || '').trim();
  if (!FAMILY.test(name)) { return { error: 'The font name can only have letters, digits, spaces, "-" and "_".' }; }
  const w = Number(weight);
  if (!Number.isInteger(w) || w < 100 || w > 900 || w % 100) { return { error: 'The weight must be 100, 200, … or 900.' }; }
  if (!['normal', 'italic'].includes(style)) { return { error: 'The style must be normal or italic.' }; }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = `${slug}-${w}${style === 'italic' ? '-italic' : ''}.${type}`;
  const fonts = readFonts().filter((f) => !(f.family === name && f.weight === w && f.style === style));
  fonts.forEach((f) => { if (f.file === file) { fs.rmSync(path.join(FONTS, f.file), { force: true }); } });
  const font = {
    family: name, weight: w, style, file,
  };
  writeFile(path.join(FONTS, file), data);
  writeFile(fontsFile, `${JSON.stringify([...fonts.filter((f) => f.file !== file), font], null, 2)}\n`);
  return { font };
}

/** The uploaded font file `name` (a file name from fonts.json), or null. */
function fontFile(name) {
  const font = readFonts().find((f) => f.file === name);
  return font ? path.join(FONTS, font.file) : null;
}

/** @font-face rules for the uploaded fonts, with URLs relative to the stylesheet that contains them. */
function fontFaces() {
  return readFonts().filter((f) => FAMILY.test(f.family) && FONT_FORMATS[path.extname(f.file).slice(1)]).map((f) => (
    `@font-face{font-family:"${f.family}";src:url("${FONT_URL}${f.file}") format("${FONT_FORMATS[path.extname(f.file).slice(1)]}");`
    + `font-weight:${f.weight};font-style:${f.style};font-display:swap}\n`
  )).join('');
}

// ---------------------------------------------------------------------------
// Theme templates
// ---------------------------------------------------------------------------

function readThemes() {
  const read = readJson(themesFile, null);
  const data = read && Array.isArray(read.themes) ? { ...read, themes: read.themes.map(upgradeTheme) } : read;
  return data && !checkThemes(data)
    ? { themes: data.themes, selected: data.selected ?? null, previewing: data.previewing ?? null }
    : { themes: [], selected: null, previewing: null };
}

function writeThemeList(data) {
  const themes = { themes: data.themes, selected: data.selected ?? null, previewing: data.previewing ?? null };
  writeFile(themesFile, `${JSON.stringify(themes, null, 2)}\n`);
  return themes;
}

// ---------------------------------------------------------------------------
// Saved values and the theme stylesheets
// ---------------------------------------------------------------------------

function writeThemes(mode, { tokens, preview }) {
  const faces = fontFaces();
  const { rules, yiq } = derivedTokens();
  const raw = builtValues(mode);
  // Colors the build worked out from a saved color (Primary 700 from Primary) follow it; saved values win.
  const withDerived = (values) => ({
    ...derivedValues({
      rules: rules[mode], raw, values, yiq,
    }),
    ...values,
  });
  const saved = withDerived(tokens);
  const previewed = preview && withDerived(preview);
  EXTENSIONS.forEach((ext) => {
    const built = path.join(DIST, `${mode}${ext}`);
    if (!fs.existsSync(built)) { return; }
    const css = fs.readFileSync(built, 'utf8');
    writeFile(path.join(SAVED, `${mode}${ext}`), faces + withTokens(css, saved));
    const previewFile = path.join(SAVED, `${mode}.preview${ext}`);
    if (previewed) { writeFile(previewFile, faces + withTokens(css, previewed)); } else { fs.rmSync(previewFile, { force: true }); }
  });
}

function writeSaved(mode, data) {
  const saved = { tokens: data.tokens, history: data.history, preview: data.preview || null };
  writeFile(savedFile(mode), `${JSON.stringify(saved, null, 2)}\n`);
  writeThemes(mode, saved);
  return saved;
}

/** Why `data` cannot be saved, or null. `sources` has every --pgn-* name of the token files as a key. */
function checkSaved(data, sources) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) { return 'Expected { tokens, history, preview }.'; }
  const { tokens, history, preview } = data;
  if (!Array.isArray(history)) { return '"history" must be an array.'; }
  const checkTokens = (key, values) => {
    if (!values || typeof values !== 'object' || Array.isArray(values)) { return `"${key}" must be an object.`; }
    const wrong = Object.entries(values).find(([name, value]) => !Object.prototype.hasOwnProperty.call(sources, name)
      || typeof value !== 'string' || value.length > 1000 || valueProblem(value));
    return wrong ? `Not allowed in "${key}": ${wrong[0]}: ${JSON.stringify(wrong[1])}` : null;
  };
  return checkTokens('tokens', tokens) || (preview == null ? null : checkTokens('preview', preview));
}

/**
 * The file to send for dist/<name>: for light/dark, the previewed stylesheet while a preview is on, else the saved
 * one (both rewritten when dist/, the saved values or the uploaded fonts are newer), else dist/<name>; for
 * uploaded-fonts/<file>, the uploaded font. Null for a path outside dist/.
 */
function themeFile(name) {
  if (name.startsWith(FONT_URL)) { return fontFile(name.slice(FONT_URL.length)); }
  const built = path.normalize(path.join(DIST, name));
  if (!built.startsWith(`${DIST}${path.sep}`)) { return null; }
  const match = /^(light|dark)(\.min)?\.css$/.exec(name);
  if (!match) { return built; }
  const [, mode, min = ''] = match;
  const saved = readSaved(mode);
  const file = path.join(SAVED, `${mode}${saved.preview ? '.preview' : ''}${min}.css`);
  if (!saved.preview && !Object.keys(saved.tokens).length) { return built; }
  // Also once per server start, so stylesheets written by an older version of this code are replaced.
  if (!written.has(mode) || mtime(file) < Math.max(mtime(built), mtime(savedFile(mode)), mtime(fontsFile))) {
    writeThemes(mode, saved);
    written.add(mode);
  }
  return file;
}
const written = new Set();

module.exports = {
  DIST, MODES, addFont, checkSaved, checkThemes, fontFile, readFonts, readSaved, readThemes, themeFile, writeSaved,
  writeThemeList,
};
