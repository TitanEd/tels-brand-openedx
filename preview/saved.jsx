/* Locally saved token values and their history: loading, applying them to the page, saving and reverting. */
import React, {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import { tokenStore } from './token-store';
import { MODE, isColor } from './tokens';
import m from './page.messages';

const STYLE_ID = 'design-tokens-saved';

function applyToPage(values) {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  const lines = Object.entries(values).map(([name, value]) => `  ${name}: ${value};`);
  style.textContent = lines.length ? `:root {\n${lines.join('\n')}\n}` : '';
}

/** Values of `names` as the built CSS sets them, without the locally saved values. */
export function readBaseValues(names) {
  const style = document.getElementById(STYLE_ID);
  if (style) { style.disabled = true; }
  const computed = getComputedStyle(document.documentElement);
  const values = Object.fromEntries(names.map((n) => [
    n, computed.getPropertyValue(n).trim().replace(/^(#[0-9a-f]{6})ff$/i, '$1'),
  ]));
  if (style) { style.disabled = false; }
  return values;
}

const canvas = document.createElement('canvas').getContext('2d');
/** Any CSS color -> { hex: '#rrggbb', alpha: 0..1 } for <input type="color">. */
export function parseColor(value) {
  canvas.fillStyle = '#000000';
  canvas.fillStyle = value;
  const s = canvas.fillStyle;
  if (s.startsWith('#')) { return { hex: s, alpha: 1 }; }
  const [r, g, b, a = 1] = s.replace(/rgba?\(|\)/g, '').split(',').map((x) => Number(x.trim()));
  const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  return { hex, alpha: a };
}

/** The message explaining why `value` cannot be saved for a token whose built value is `base`, or null. */
export function valueError(value, base) {
  const v = value.trim();
  if (!v) { return m.errorEmpty; }
  if (/[;{}<>]/.test(v)) { return m.errorCharacters; }
  if (isColor(base) && !CSS.supports('color', v)) { return m.errorColor; }
  return null;
}

export const modeName = (intl) => intl.formatMessage(MODE === 'dark' ? m.darkModeName : m.lightModeName);

export const formatTime = (intl, iso) => intl.formatDate(iso, {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});

/** [{ name, from, to }] for every token whose saved value differs between `before` and `after` (null = built value). */
export function diff(before, after) {
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return names
    .map((name) => ({ name, from: before[name] ?? null, to: after[name] ?? null }))
    .filter((c) => c.from !== c.to);
}

const SavedContext = createContext({
  saved: {}, history: [], version: 0, commit: async () => false, revert: async () => 0,
});
export const useSavedTokens = () => useContext(SavedContext);

export function SavedTokensProvider({ children }) {
  const [saved, setSaved] = useState({});
  const [history, setHistory] = useState([]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    Promise.all([tokenStore.load(MODE), tokenStore.loadHistory(MODE)]).then(([values, entries]) => {
      applyToPage(values);
      setSaved(values);
      setHistory(entries);
      setVersion((v) => v + 1);
    });
  }, []);
  const value = useMemo(() => {
    /**
     * Saves `next` as the new set of saved values and adds a history entry with what changed.
     * info: { action: 'save' | 'reset' | 'reset-all' | 'revert' | 'import', scopeId, revertOf, source }, where
     * source is the imported file name. Returns the number of changes.
     */
    const commit = async (next, info = {}) => {
      const changes = diff(saved, next);
      if (!changes.length) { return 0; }
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: new Date().toISOString(),
        action: info.action || (changes.every((c) => c.to === null) ? 'reset' : 'save'),
        scopeId: info.scopeId || null,
        revertOf: info.revertOf || null,
        source: info.source || null,
        changes,
      };
      const stored = await tokenStore.save(MODE, next);
      const entries = await tokenStore.saveHistory(MODE, [...history, entry]);
      applyToPage(stored);
      setSaved(stored);
      setHistory(entries);
      setVersion((v) => v + 1);
      return changes.length;
    };
    /** Puts the values of `names` (default: all) back to what they were before `entry`, as a new history entry. */
    const revert = (entry, names, scopeId) => {
      const next = { ...saved };
      entry.changes.filter((c) => !names || names.includes(c.name)).forEach((c) => {
        if (c.from === null) { delete next[c.name]; } else { next[c.name] = c.from; }
      });
      return commit(next, { action: 'revert', scopeId: scopeId ?? entry.scopeId, revertOf: entry.id });
    };
    return {
      saved, history, version, commit, revert,
    };
  }, [saved, history, version]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}
