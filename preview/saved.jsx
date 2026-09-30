/* Saved token values and their history: loading, applying them to the page, saving and reverting. */
import React, {
  createContext, useContext, useEffect, useMemo, useState,
} from 'react';
import { useIntl } from 'react-intl';
import { tokenStore } from './token-store';
import {
  MODE, isColor, rawTokenValues, tokenMeta,
} from './tokens';
import { valueProblem } from './token-value';
import { derivedValues } from './derived-colors';
import { useDialogs } from './dialogs';
import m from './page.messages';

const STYLE_ID = 'design-tokens-saved';

/** The colors the build worked out from a color that `values` change (Primary 700 from Primary), as #RRGGBB(AA). */
async function derivedFrom(values) {
  const { derived } = await tokenMeta();
  if (!derived || !Object.keys(values).length) { return {}; }
  const result = derivedValues({
    rules: derived.rules[MODE] || {}, raw: rawTokenValues(), values, yiq: derived.yiq,
  });
  return Object.fromEntries(Object.entries(result).map(([n, v]) => [n, v.replace(/^(#[0-9a-f]{6})ff$/i, '$1')]));
}

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

/** Values of `names` as the built CSS sets them, without the saved values. */
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
  const problem = valueProblem(value);
  if (problem) { return { empty: m.errorEmpty, characters: m.errorCharacters, unbalanced: m.errorUnbalanced }[problem]; }
  if (isColor(base) && !CSS.supports('color', value.trim())) { return m.errorColor; }
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

/** `preview` with the values of `names` set to those of `next`, or null when it no longer differs from `next`. */
function followPreview(preview, next, names) {
  if (!preview) { return null; }
  const values = { ...preview };
  names.forEach((n) => { if (next[n] === undefined) { delete values[n]; } else { values[n] = next[n]; } });
  return diff(next, values).length ? values : null;
}

/**
 * Saving `next` over `state` ({ tokens, history, preview }): { data, count }, where data is the state to store
 * (null when nothing changes) and count the number of changed values. `info` is described at `save` below.
 */
function afterSave(state, next, info) {
  const { tokens, history, preview } = state;
  const changes = diff(tokens, next);
  const nextPreview = info.endPreview ? null : followPreview(preview, next, info.names || changes.map((c) => c.name));
  if (!changes.length) {
    const previewChanged = diff(preview || {}, nextPreview || {}).length || !preview !== !nextPreview;
    return { data: previewChanged ? { tokens, history, preview: nextPreview } : null, count: 0 };
  }
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: new Date().toISOString(),
    action: info.action || (changes.every((c) => c.to === null) ? 'reset' : 'save'),
    scopeId: info.scopeId || null,
    revertOf: info.revertOf || null,
    source: info.source || null,
    changes,
  };
  return { data: { tokens: next, history: [...history, entry], preview: nextPreview }, count: changes.length };
}

const SavedContext = createContext({
  saved: {},
  history: [],
  preview: null,
  derived: {},
  version: 0,
  commit: async () => null,
  commitTo: async () => null,
  revert: async () => null,
  showPreview: async () => false,
  stopPreview: async () => false,
  previewTo: async () => false,
  stopPreviewTo: async () => false,
});
export const useSavedTokens = () => useContext(SavedContext);

export function SavedTokensProvider({ children }) {
  const intl = useIntl();
  const { notify } = useDialogs();
  const [saved, setSaved] = useState({});
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [derived, setDerived] = useState({});
  const [version, setVersion] = useState(0);
  const show = async (data) => {
    const shown = data.preview || data.tokens;
    const worked = await derivedFrom(shown);
    applyToPage({ ...worked, ...shown });
    setDerived(worked);
    setSaved(data.tokens);
    setHistory(data.history);
    setPreview(data.preview);
    setVersion((v) => v + 1);
  };
  useEffect(() => {
    tokenStore.load(MODE).then(show).catch((error) => {
      console.error(error);
      notify({ text: intl.formatMessage(m.loadFailed) });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => {
    const store = async (data) => show(await tokenStore.save(MODE, data));
    /**
     * Saves `next` as the new set of saved values and adds a history entry with what changed.
     * info: { action: 'save' | 'reset' | 'reset-all' | 'revert' | 'import' | 'theme' | 'theme-code', scopeId,
     * revertOf, source, names, endPreview }, where source is the imported file or theme name, names are the tokens
     * whose previewed value becomes the one of `next` (default: the changed ones) and endPreview stops the preview.
     * Returns the number of changes.
     */
    const save = async (next, info = {}) => {
      const { data, count } = afterSave({ tokens: saved, history, preview }, next, info);
      if (data) { await store(data); }
      return count;
    };
    /** `save` for `mode`, which can be the mode this page does not show. */
    const saveTo = async (mode, next, info = {}) => {
      if (mode === MODE) { return save(next, info); }
      const { data, count } = afterSave(await tokenStore.load(mode), next, info);
      if (data) { await tokenStore.save(mode, data); }
      return count;
    };
    const failed = (error) => {
      console.error(error);
      notify({ text: intl.formatMessage(m.saveFailed) });
      return null;
    };
    /** `save`, or null (after telling the user) when the values could not be saved. */
    const commit = (next, info) => save(next, info).catch(failed);
    const commitTo = (mode, next, info) => saveTo(mode, next, info).catch(failed);
    /**
     * Shows `next` (every token value, like the saved values) on this page and in the apps without saving it, or
     * stops the preview when `next` is the same as the saved values. Returns false (after telling the user) on error.
     */
    const previewFailed = (error) => {
      console.error(error);
      notify({ text: intl.formatMessage(m.previewFailed) });
      return false;
    };
    const showPreview = (next) => store({ tokens: saved, history, preview: diff(saved, next).length ? next : null })
      .then(() => true)
      .catch(previewFailed);
    const stopPreview = () => showPreview(saved);
    /** `showPreview` for `mode`, which can be the mode this page does not show. */
    const previewTo = (mode, next) => {
      if (mode === MODE) { return showPreview(next); }
      return tokenStore.load(mode)
        .then((data) => tokenStore.save(mode, { ...data, preview: diff(data.tokens, next).length ? next : null }))
        .then(() => true)
        .catch(previewFailed);
    };
    /** `stopPreview` for `mode`, which can be the mode this page does not show. */
    const stopPreviewTo = (mode) => {
      if (mode === MODE) { return stopPreview(); }
      return tokenStore.load(mode)
        .then((data) => (data.preview ? tokenStore.save(mode, { ...data, preview: null }) : null))
        .then(() => true)
        .catch(previewFailed);
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
      saved, history, preview, derived, version, commit, commitTo, revert, showPreview, stopPreview, previewTo, stopPreviewTo,
    };
  }, [saved, history, preview, derived, version, intl, notify]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}
