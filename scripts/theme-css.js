/*
 * The theme stylesheet with saved token values: the built CSS (dist/light.css, dist/light.min.css, ...) with each
 * saved value written into its first :root block, replacing the built declaration or added at the end when the
 * file does not declare that token. The rest of the file is unchanged, so MFEs loading it get the saved values
 * wherever the Paragon CSS uses var(--pgn-...).
 *   withTokens(css, { '--pgn-color-primary-base': '#123456' }) -> css
 * Values must pass preview/token-value.js: they are written as they are.
 */

// The declarations of the block whose { is at `open`, skipping strings, brackets and comments:
// { declarations: [{ name, valueStart, valueEnd }], close } where close is the index of its }.
function scanBlock(css, open) {
  const declarations = [];
  let start = open + 1;
  let quote = null;
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    const c = css[i];
    if (quote) {
      if (c === '\\') { i += 1; } else if (c === quote) { quote = null; }
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) { break; }
      if (!css.slice(start, i).trim()) { start = end + 2; }
      i = end + 1;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '(') {
      depth += 1;
    } else if (c === ')') {
      depth -= 1;
    } else if (depth === 0 && (c === ';' || c === '}')) {
      const colon = css.indexOf(':', start);
      if (colon > start && colon < i) {
        declarations.push({ name: css.slice(start, colon).trim(), valueStart: colon + 1, valueEnd: i });
      }
      if (c === '}') { return { declarations, close: i }; }
      start = i + 1;
    }
  }
  throw new Error('The :root block of the built CSS is not closed.');
}

function withTokens(css, tokens) {
  const start = css.search(/:root\s*\{/);
  if (start < 0) { throw new Error('The built CSS has no :root block.'); }
  const open = css.indexOf('{', start);
  const { declarations, close } = scanBlock(css, open);
  const minified = !css.slice(open, close).includes('\n');
  const space = minified ? '' : ' ';
  const declared = new Map(declarations.map((d) => [d.name, d]));
  const replaced = declarations.filter((d) => d.name in tokens).sort((a, b) => b.valueStart - a.valueStart);
  const added = Object.keys(tokens).sort().filter((name) => !declared.has(name));

  let out = css;
  let end = close;
  replaced.forEach((d) => {
    const value = `${space}${tokens[d.name]}`;
    out = `${out.slice(0, d.valueStart)}${value}${out.slice(d.valueEnd)}`;
    end += value.length - (d.valueEnd - d.valueStart);
  });
  if (!added.length) { return out; }
  const before = out.slice(0, end).replace(/\s*$/, '');
  const separator = before.endsWith(';') || before.endsWith('{') ? '' : ';';
  const lines = added.map((name) => `${name}:${space}${tokens[name]}`);
  return minified
    ? `${before}${separator}${lines.join(';')}${out.slice(end)}`
    : `${before}${separator}\n${lines.map((l) => `  ${l};`).join('\n')}\n${out.slice(end)}`;
}

module.exports = { withTokens };
