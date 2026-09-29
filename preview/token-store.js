// Saved token values, per mode: { '--pgn-color-primary-base': '#123456', ... }, and the history of changes, per
// mode: [{ id, time, action, scopeId, revertOf, changes: [{ name, from, to }] }] (null = the built value).
// The page only talks to this object, and every method returns a Promise, so browser storage can be
// replaced by an API without changing the page.
const key = (mode) => `design-tokens:v1:${mode}`;
const historyKey = (mode) => `design-tokens-history:v1:${mode}`;

function read(storageKey, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey));
    return value && typeof value === 'object' ? value : fallback;
  } catch (e) {
    return fallback;
  }
}

export const tokenStore = {
  async load(mode) {
    return read(key(mode), {});
  },

  async save(mode, tokens) {
    if (Object.keys(tokens).length) {
      window.localStorage.setItem(key(mode), JSON.stringify(tokens));
    } else {
      window.localStorage.removeItem(key(mode));
    }
    return tokens;
  },

  async loadHistory(mode) {
    const entries = read(historyKey(mode), []);
    return Array.isArray(entries) ? entries : [];
  },

  async saveHistory(mode, entries) {
    window.localStorage.setItem(historyKey(mode), JSON.stringify(entries));
    return entries;
  },
};
