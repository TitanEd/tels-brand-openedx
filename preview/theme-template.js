// Theme templates: the colors that nothing else is worked out from, for light and for dark, and the fonts, turned
// into design token values. A template is
// { id, name, created, updated, colors: { light: { <color key>: '#rrggbb' }, dark: { … } }, fonts: { body, headings } }.
// A color missing from a mode is not set by the theme (it keeps the value of the token files). Status colors
// (success, warning, danger, info) are left to the design tokens. Shared by the page (preview/themes.jsx) and the
// preview server (scripts/saved-theme.js), which checks what the page saves.
const { valueProblem } = require('./token-value');

const THEME_MODES = ['light', 'dark'];

// Each color sets `token` in its mode. Other tokens follow them (e.g. button fills follow the primary color, card,
// modal and dropdown backgrounds follow the surface color).
const THEME_COLORS = [
  { key: 'primary', token: '--pgn-color-primary-base' },
  { key: 'secondary', token: '--pgn-color-secondary-base' },
  { key: 'brand', token: '--pgn-color-brand-base', followsPrimary: true },
  { key: 'link', token: '--pgn-color-link-base', followsPrimary: true },
  { key: 'background', token: '--pgn-color-bg-base' },
  { key: 'surface', token: '--pgn-color-surface-base' },
  { key: 'text', token: '--pgn-color-body-base' },
  { key: 'headings', token: '--pgn-color-headings-base' },
  { key: 'border', token: '--pgn-color-border' },
];

const THEME_FONTS = [
  { key: 'body', token: '--pgn-typography-font-family-base' },
  { key: 'headings', token: '--pgn-typography-headings-font-family' },
];

// The theme of the token files (paragon/tokens/src): no saved values.
const CODE_THEME_ID = 'code';
const MAX_THEMES = 50;
const HEX = /^#[0-9a-f]{6}$/i;

/** `theme` with colors per mode; themes saved before that had one set of colors plus a background and text per mode. */
function upgradeTheme(theme) {
  const colors = theme && theme.colors;
  if (!colors || typeof colors.primary !== 'string') { return theme; }
  const shared = { primary: colors.primary, secondary: colors.secondary, brand: colors.brand };
  return {
    ...theme,
    colors: {
      light: { ...shared, background: colors.lightBackground, text: colors.lightText },
      dark: { ...shared, background: colors.darkBackground, text: colors.darkText },
    },
  };
}

/**
 * The saved token values that `theme` sets in `mode`; none for the theme of the token files. A brand or link color
 * equal to the primary color is left out, so it keeps following primary (var(--pgn-color-primary-base) in the files).
 */
function themeTokens(theme, mode) {
  if (!theme || theme.id === CODE_THEME_ID) { return {}; }
  const colors = theme.colors[mode] || {};
  const primary = (colors.primary || '').toLowerCase();
  const tokens = {};
  THEME_COLORS.filter((c) => colors[c.key])
    .filter((c) => !(c.followsPrimary && colors[c.key].toLowerCase() === primary))
    .forEach((c) => { tokens[c.token] = colors[c.key]; });
  THEME_FONTS.forEach((f) => { tokens[f.token] = theme.fonts[f.key]; });
  return tokens;
}

const COLOR_KEYS = new Set(THEME_COLORS.map((c) => c.key));
const ID = /^[a-z0-9-]{1,40}$/;

/** Why the name, colors and fonts of `theme` (called `label` in the message) cannot be saved, or null. */
function contentProblem(theme, label) {
  const { name, colors, fonts } = theme;
  if (typeof name !== 'string' || !name.trim() || name.length > 80) { return `Wrong name for theme ${label}.`; }
  if (!colors || typeof colors !== 'object' || Object.keys(colors).some((mode) => !THEME_MODES.includes(mode))) {
    return `Theme ${label} needs colors for light and dark.`;
  }
  for (const mode of THEME_MODES) {
    const set = colors[mode];
    if (!set || typeof set !== 'object' || Object.entries(set).some(([key, value]) => !COLOR_KEYS.has(key) || typeof value !== 'string' || !HEX.test(value))) {
      return `Theme ${label} needs every ${mode} color as #rrggbb.`;
    }
  }
  if (!fonts || THEME_FONTS.some((f) => typeof fonts[f.key] !== 'string' || fonts[f.key].length > 300 || valueProblem(fonts[f.key]))) {
    return `Theme ${label} has a wrong font.`;
  }
  return null;
}

/**
 * Why `data` ({ themes, selected, previewing }) cannot be saved, or null. `previewing` is null or the theme shown
 * as a preview: { theme, editing }, where theme is a saved theme, the code theme or the values of the theme form,
 * and editing is null (previewed from its card), 'new' or the id of the theme being edited.
 */
function checkThemes(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.themes)) { return 'Expected { themes, selected }.'; }
  if (data.themes.length > MAX_THEMES) { return `At most ${MAX_THEMES} themes.`; }
  const ids = new Set();
  for (const theme of data.themes) {
    if (!theme || typeof theme !== 'object') { return 'Every theme must be an object.'; }
    const { id } = theme;
    if (typeof id !== 'string' || !ID.test(id) || id === CODE_THEME_ID || ids.has(id)) { return `Wrong theme id: ${JSON.stringify(id)}`; }
    ids.add(id);
    const problem = contentProblem(theme, id);
    if (problem) { return problem; }
  }
  if (data.selected != null && data.selected !== CODE_THEME_ID && !ids.has(data.selected)) { return 'Unknown selected theme.'; }
  const { previewing } = data;
  if (previewing != null) {
    if (typeof previewing !== 'object' || !previewing.theme || typeof previewing.theme !== 'object') { return 'Expected previewing: { theme, editing }.'; }
    const { theme, editing } = previewing;
    if (theme.id !== undefined && (typeof theme.id !== 'string' || !ID.test(theme.id))) { return 'Wrong id of the previewed theme.'; }
    if (theme.id !== CODE_THEME_ID) {
      const problem = contentProblem(theme, 'previewed');
      if (problem) { return problem; }
    }
    if (editing != null && editing !== 'new' && !ids.has(editing)) { return 'Unknown theme being edited in the preview.'; }
  }
  return null;
}

module.exports = {
  CODE_THEME_ID, HEX, THEME_COLORS, THEME_FONTS, THEME_MODES, checkThemes, themeTokens, upgradeTheme,
};
