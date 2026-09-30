// Saved token values, per mode: { tokens: { '--pgn-color-primary-base': '#123456', ... }, history: [{ id, time,
// action, scopeId, revertOf, source, changes: [{ name, from, to }] }] (null = the built value), preview: every
// token value the apps should show while a preview is on, or null }.
// Kept by the preview server (scripts/saved-theme.js), which also writes the values into the theme stylesheet that
// MFEs load (npm run serve). The page only talks to this object, so another backend only has to accept and return
// the same JSON.
const url = (mode) => `/api/design-tokens/${mode}`;

async function request(mode, options) {
  const response = await fetch(url(mode), { cache: 'no-store', ...options });
  if (!response.ok) { throw new Error(`${options?.method || 'GET'} ${url(mode)}: ${response.status} ${await response.text()}`); }
  return response.json();
}

const save = (mode, data) => request(mode, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});

// Earlier versions of the page kept the values in localStorage: move them to the server once.
const legacyKeys = (mode) => [`design-tokens:v1:${mode}`, `design-tokens-history:v1:${mode}`];
async function moveLegacy(mode, data) {
  if (Object.keys(data.tokens).length || data.history.length) { return data; }
  const [tokensKey, historyKey] = legacyKeys(mode);
  let tokens;
  let history;
  try {
    tokens = JSON.parse(window.localStorage.getItem(tokensKey)) || {};
    history = JSON.parse(window.localStorage.getItem(historyKey)) || [];
  } catch (e) {
    return data;
  }
  if (!Object.keys(tokens).length && !history.length) { return data; }
  try {
    const moved = await save(mode, { tokens, history: Array.isArray(history) ? history : [], preview: data.preview });
    legacyKeys(mode).forEach((k) => window.localStorage.removeItem(k));
    return moved;
  } catch (error) {
    console.warn('Values saved by an earlier version of this page were not moved:', error);
    return data;
  }
}

export const tokenStore = {
  async load(mode) {
    return moveLegacy(mode, await request(mode));
  },

  async save(mode, { tokens, history, preview }) {
    return save(mode, { tokens, history, preview: preview || null });
  },
};
