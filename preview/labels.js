import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import terms from './terms.messages';
import describe from './describe.messages';

const CATEGORIES = new Set(['color', 'size', 'spacing', 'typography', 'elevation', 'transition', 'other']);
const SILENT = new Set(['base', 'theme', 'box', 'content', 'component']);
const VARIANT_FILE = /^(solid|outline|inverse|icon|tertiary|link)(-|$)/;
const SCOPE_ALIASES = {
  button: ['btn'], tabs: ['nav', 'tab'], table: ['data'], navbar: ['nav'], 'product-tour': ['checkpoint'],
};

/** Words of a token name without its category: "h1" -> heading 1, "2", "5" -> "2.5", "padding x" -> "x padding". */
function wordsOf(name) {
  const parts = name.replace(/^--pgn-/, '').split('-');
  if (CATEGORIES.has(parts[0])) { parts.shift(); }
  const words = [];
  for (const part of parts) {
    const heading = /^h([1-6])$/.exec(part);
    const last = words[words.length - 1];
    if (heading) {
      words.push('heading', heading[1]);
    } else if (/^\d$/.test(part) && /^\d$/.test(last || '')) {
      words[words.length - 1] = `${last}.${part}`;
    } else if ((part === 'x' || part === 'y') && last) {
      words.splice(words.length - 1, 0, part);
    } else if (!SILENT.has(part)) {
      words.push(part);
    }
  }
  return words;
}

/** Words a component's own tokens all start with ("btn" for Button), left out of its labels. */
export function scopeWords(scope) {
  const words = new Set();
  for (const p of scope.paths) {
    const folder = p.replace(/^components\//, '').replace(/^global\/.*/, '').replace(/\/$/, '').split('/').join('-');
    if (!folder) { continue; }
    folder.split('-').forEach((w) => words.add(w));
    (SCOPE_ALIASES[folder] || []).forEach((w) => words.add(w));
  }
  return words;
}

/** Words of a variant file ("solid-primary") that its group title already says. */
export function fileWords(short) {
  const base = short.split('/').pop().replace(/\.json$/, '');
  return VARIANT_FILE.test(base) ? new Set(base.split('-')) : new Set();
}

const has = (words, ...list) => list.some((w) => words.has(w));

/** What a token controls, from its category and name words: a key of describe.messages. */
function propertyOf(name) {
  const [category, ...rest] = name.replace(/^--pgn-/, '').split('-');
  const w = new Set(rest);
  switch (category) {
    case 'color': case 'border': case 'content':
      if (has(w, 'bg', 'backdrop', 'skrim', 'surface')) { return 'background'; }
      if (has(w, 'border', 'divider') || category === 'border') { return 'border'; }
      if (w.has('shadow')) { return 'shadowColor'; }
      if (w.has('decoration')) { return 'underlineColor'; }
      if (w.has('placeholder')) { return 'placeholder'; }
      if (has(w, 'icon', 'arrow', 'caret')) { return 'icon'; }
      if (has(w, 'text', 'link', 'label', 'title', 'caption', 'headings', 'body', 'description', 'msg', 'feedback', 'muted')) {
        return 'text';
      }
      return 'color';
    case 'size':
      if (w.has('radius')) { return 'radius'; }
      if (w.has('border')) { return 'borderWidth'; }
      if (w.has('height')) { return 'height'; }
      if (w.has('width')) { return 'width'; }
      if (w.has('icon')) { return 'iconSize'; }
      return 'size';
    case 'spacing': {
      const axis = (w.has('x') && 'X') || (w.has('y') && 'Y') || '';
      if (w.has('padding')) { return `padding${axis}`; }
      if (w.has('margin')) { return `margin${axis}`; }
      if (has(w, 'gap', 'gutter', 'spacer', 'space')) { return 'gap'; }
      if (has(w, 'offset', 'distance', 'position')) { return 'offset'; }
      return 'spacing';
    }
    case 'typography':
      if (w.has('family')) { return 'font'; }
      if (w.has('line') && w.has('height')) { return 'lineHeight'; }
      if (w.has('size')) { return 'fontSize'; }
      if (w.has('weight')) { return 'fontWeight'; }
      if (w.has('letter')) { return 'letterSpacing'; }
      if (w.has('decoration')) { return 'underline'; }
      return 'textStyle';
    case 'elevation':
      return w.has('zindex') ? 'stacking' : 'shadow';
    case 'transition':
      return 'animation';
    default:
      return w.has('opacity') ? 'opacity' : 'setting';
  }
}

const STATES = ['disabled', 'hover', 'active', 'focus', 'checked', 'selected', 'visited', 'invalid', 'valid', 'indeterminate'];
// In these components "active" is the current item (tab, page, menu item), not a pressed control.
const ACTIVE_IS_SELECTED = new Set(['tabs', 'pagination', 'dropdown', 'menu', 'breadcrumb', 'navbar', 'stepper', 'carousel', 'data-table']);

function stateOf(name, scope) {
  const w = new Set(name.replace(/^--pgn-/, '').split('-'));
  const state = STATES.find((s) => w.has(s)) || 'none';
  return state === 'active' && scope && ACTIVE_IS_SELECTED.has(scope.id) ? 'selected' : state;
}

export function useTokenLabels() {
  const intl = useIntl();
  return useMemo(() => {
    const word = (w) => (terms[w] ? intl.formatMessage(terms[w]) : w);
    const sentence = (words) => {
      const text = words.map(word).join(' ');
      return text.charAt(0).toLocaleUpperCase(intl.locale) + text.slice(1);
    };
    const fileTitle = (short) => sentence(short.split('/').pop().replace(/\.json$/, '').split('-'));
    return {
      /** Readable name of a token, leaving out the words in `omit` (component and group words). */
      label(name, omit = new Set()) {
        const words = wordsOf(name);
        const kept = words.filter((w) => !omit.has(w));
        return sentence(kept.length ? kept : words.slice(-1));
      },
      /** Readable title of a token file group: "solid-primary.json" -> "Solid primary". */
      fileTitle,
      /** One sentence saying what a token changes: "Changes the background color of Button (Solid primary) when …". */
      describe(name, { scope, short, global }) {
        const property = intl.formatMessage(describe[propertyOf(name)]);
        if (global) { return intl.formatMessage(describe.global, { property }); }
        const component = intl.formatMessage(scope.name);
        const base = short.split('/').pop().replace(/\.json$/, '');
        const target = VARIANT_FILE.test(base)
          ? intl.formatMessage(describe.target, { component, variant: fileTitle(short) })
          : component;
        return intl.formatMessage(describe.component, { property, target, state: stateOf(name, scope) });
      },
    };
  }, [intl]);
}
