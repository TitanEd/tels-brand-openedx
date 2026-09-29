import { useEffect, useState } from 'react';

export const MODE = window.PREVIEW_MODE || 'light';

/** Map(--pgn-* name -> value as written in :root) for every variable the loaded stylesheets set, e.g. "var(--pgn-…)". */
export function rawTokenValues() {
  const raw = new Map();
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) { visit(rule.cssRules); continue; }
      if (!rule.style || !/(^|,)\s*:root\s*(,|$)/.test(rule.selectorText || '')) { continue; }
      for (let i = 0; i < rule.style.length; i += 1) {
        const name = rule.style[i];
        if (name.startsWith('--pgn-')) { raw.set(name, rule.style.getPropertyValue(name).trim()); }
      }
    }
  };
  for (const sheet of document.styleSheets) {
    if (!sheet.href) { continue; }
    try { visit(sheet.cssRules); } catch (e) { /* cross-origin sheet */ }
  }
  return raw;
}

let dependents = null;
/** Every token whose built value copies `name`, directly or through other tokens (var(--pgn-…) chains). */
export function dependentsOf(name) {
  if (!dependents) {
    const followers = new Map();
    for (const [token, raw] of rawTokenValues()) {
      for (const [, ref] of raw.matchAll(/var\(\s*(--pgn-[\w-]+)/g)) {
        if (!followers.has(ref)) { followers.set(ref, new Set()); }
        followers.get(ref).add(token);
      }
    }
    dependents = { followers, cache: new Map() };
  }
  if (!dependents.cache.has(name)) {
    const all = new Set();
    const queue = [name];
    while (queue.length) {
      for (const next of dependents.followers.get(queue.pop()) || []) {
        if (!all.has(next) && next !== name) { all.add(next); queue.push(next); }
      }
    }
    dependents.cache.set(name, all);
  }
  return dependents.cache.get(name);
}

export const isColor = (v) => Boolean(v) && !/^(inherit|initial|unset|currentcolor|none|transparent)$/i.test(v)
  && CSS.supports('color', v);
export const isLength = (v) => Boolean(v) && /^-?[\d.]+(px|rem|em|%|vw|vh)$|^calc\(/.test(v);

// { sources } from paragon/tokens/src, served by scripts/preview-server.js.
const metaPromise = fetch('/token-meta.json').then((r) => r.json()).catch(() => ({ sources: {} }));
export function useTokenMeta() {
  const [meta, setMeta] = useState(null);
  useEffect(() => { metaPromise.then(setMeta); }, []);
  return meta;
}

/** The token file that represents `name` in this mode (core, then this mode, then the other mode). */
export const fileOf = (meta, name) => {
  const s = meta.sources[name] || {};
  return s[MODE] || s.core || s.light || s.dark;
};

/** "themes/light/components/button/solid-primary.json" -> "components/button/solid-primary.json" */
export const shortPath = (file) => (file || '').replace(/^core\//, '').replace(/^themes\/[a-z]+\//, '');

/**
 * Assigns every token in our files to exactly one scope (a global group or a component), by the first scope
 * whose `paths` prefix matches the token's file and none of whose `exclude` prefixes do.
 * Returns Map(scopeId -> [names in file order]).
 */
export function assignTokens(meta, scopes, fallbackId) {
  const byScope = new Map(scopes.map((s) => [s.id, []]));
  for (const name of Object.keys(meta.sources)) {
    const short = shortPath(fileOf(meta, name));
    const scope = scopes.find((s) => s.paths.some((p) => short.startsWith(p))
      && !(s.exclude || []).some((p) => short.startsWith(p)));
    const id = scope ? scope.id : fallbackId(short);
    if (id) { (byScope.get(id) || byScope.set(id, []).get(id)).push(name); }
  }
  return byScope;
}
