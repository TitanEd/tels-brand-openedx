// Why a token value cannot be written into the theme stylesheet, or null: 'empty' | 'characters' | 'unbalanced'.
// Used by the page and by the preview server: a stray ; { } comment, quote or bracket in one value would break
// every rule after it in the stylesheet that the MFEs load.
function valueProblem(value) {
  const v = String(value).trim();
  if (!v) { return 'empty'; }
  if (/[;{}<>\\\r\n]|\/\*|\*\//.test(v)) { return 'characters'; }
  if ((v.split('"').length - 1) % 2 || (v.split("'").length - 1) % 2) { return 'unbalanced'; }
  let depth = 0;
  for (const c of v) {
    if (c === '(') { depth += 1; }
    if (c === ')') { depth -= 1; }
    if (depth < 0) { return 'unbalanced'; }
  }
  return depth ? 'unbalanced' : null;
}

module.exports = { valueProblem };
