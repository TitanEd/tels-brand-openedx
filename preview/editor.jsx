/* The Edit form for one global group or component. */
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  ActionRow, Badge, Button, Form, Icon, ModalDialog,
} from '@openedx/paragon';
import { History as HistoryIcon, Search, Visibility } from '@openedx/paragon/icons';
import {
  dependentsOf, fileOf, isColor, rawTokenValues, shortPath,
} from './tokens';
import { fileWords, scopeWords, useTokenLabels } from './labels';
import {
  modeName, parseColor, readBaseValues, useSavedTokens, valueError as validate,
} from './saved';
import { HistoryList, useHistoryCount } from './history';
import { FontPicker } from './fonts';
import m from './page.messages';
import describe from './describe.messages';

const withAlpha = (hex, alpha) => (alpha >= 1 ? hex : `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`).toUpperCase();

const FILE_ORDER = ['solid-primary', 'solid-', 'outline-', 'tertiary', 'link', 'inverse-', 'icon-primary', 'icon-'];
const fileRank = (short) => {
  const base = short.split('/').pop();
  const i = FILE_ORDER.findIndex((p) => base.startsWith(p));
  return i === -1 ? FILE_ORDER.length : i;
};
/** The token that a value written as var(--pgn-…) copies. */
const followed = (raw) => (/^var\(\s*(--pgn-[\w-]+)/.exec(raw || '') || [])[1];
const MAX_SECTIONS = 5;

function TokenRow({
  row, scope, base, saved, draft, onChange, onRevert,
}) {
  const intl = useIntl();
  const names = useMemo(() => [row.name], [row.name]);
  const historyCount = useHistoryCount(names);
  const [showHistory, setShowHistory] = useState(false);
  const current = draft !== undefined ? (draft ?? base) : (saved ?? base);
  const color = isColor(base);
  const font = /font-family/.test(row.name);
  const error = draft ? validate(draft, base) : null;
  const parsed = color && !error ? parseColor(current) : null;
  let status = null;
  if (draft !== undefined) { status = m.statusChanged; } else if (saved !== undefined) { status = m.statusSaved; }
  return (
    <div className="preview-edit-row">
      <div className="preview-edit-label">
        <div className="font-weight-bold">{row.label}</div>
        <div className="small preview-edit-description">{row.description}</div>
        {row.impact && <div className="small text-muted">{row.impact}</div>}
        {row.follows && saved === undefined && draft === undefined && <div className="small text-muted">{row.follows}</div>}
      </div>
      <div className={`preview-edit-input${font ? ' is-font' : ''}`}>
        {color && (
          <input
            type="color" className="preview-color-input" aria-label={intl.formatMessage(m.pickColor, { name: row.label })}
            value={parsed ? parsed.hex : '#000000'}
            onChange={(e) => onChange(row.name, withAlpha(e.target.value, parsed ? parsed.alpha : 1))}
          />
        )}
        <Form.Control
          size="sm" dir="ltr" value={current} aria-label={row.label} isInvalid={Boolean(error)}
          onChange={(e) => onChange(row.name, e.target.value)}
        />
        {font && <FontPicker value={current} label={row.label} onChange={(value) => onChange(row.name, value)} />}
      </div>
      <div className="preview-edit-status">
        {status && <Badge variant={draft !== undefined ? 'warning' : 'info'}>{intl.formatMessage(status)}</Badge>}
        {(saved !== undefined || draft !== undefined) && (
          <Button variant="link" size="sm" onClick={() => onChange(row.name, saved !== undefined ? null : undefined)}>
            {intl.formatMessage(m.reset)}
          </Button>
        )}
        {historyCount > 0 && (
          <Button
            variant="link" size="sm" iconBefore={HistoryIcon} aria-expanded={showHistory}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? intl.formatMessage(m.hideHistory) : intl.formatMessage(m.tokenHistory, { count: historyCount })}
          </Button>
        )}
        {error && <div className="small text-danger">{intl.formatMessage(error)}</div>}
      </div>
      {showHistory && historyCount > 0 && (
        <div className="preview-edit-history">
          <HistoryList
            names={names} showLabels={false}
            onRevert={(entry) => onRevert(entry, row.name, scope.id)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Edit form for the tokens of one global group or component. `names` are the tokens that belong to it and
 * `scopeOf` maps every token to its group or component. Changes are kept as a draft until Save; Save stores
 * them with a history entry and applies them to the page.
 */
export function TokenEditor({
  scope, kind, names, meta, scopeOf, onClose, onSaved, onPreviewed,
}) {
  const intl = useIntl();
  const labels = useTokenLabels();
  const {
    saved, preview, derived, commit, revert, showPreview,
  } = useSavedTokens();
  // Values being previewed start as unsaved changes, so Save keeps them and Preview updates them.
  const [draft, setDraft] = useState(() => Object.fromEntries(names
    .filter((n) => preview && preview[n] !== saved[n])
    .map((n) => [n, preview[n] ?? null])));
  const [query, setQuery] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [openFiles, setOpenFiles] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const scopeName = intl.formatMessage(scope.name);

  // The value each token has without a saved value of its own: the built one, or the color worked out from a
  // saved color it is made from (Primary 700 from Primary).
  const base = useMemo(() => {
    const built = readBaseValues(names);
    names.forEach((n) => { if (derived[n]) { built[n] = derived[n]; } });
    return built;
  }, [names, derived]);
  const groups = useMemo(() => {
    const own = scopeWords(scope);
    const firstFolder = new Set((scope.paths[0] || '').replace(/^(components|global)\//, '').split(/[/-]/));
    const raw = rawTokenValues();
    const byFile = new Map();
    const impactOf = (name) => {
      const counts = new Map();
      dependentsOf(name).forEach((d) => {
        const s = scopeOf.get(d);
        if (s) { counts.set(s, (counts.get(s) || 0) + 1); }
      });
      const total = [...counts.values()].reduce((a, b) => a + b, 0);
      if (!total) { return kind === 'global' ? intl.formatMessage(describe.direct) : null; }
      const sorted = [...counts].sort((a, b) => b[1] - a[1]);
      const items = sorted.slice(0, MAX_SECTIONS).map(([s, count]) => intl.formatMessage(describe.section, {
        name: intl.formatMessage(s.name), count: intl.formatNumber(count),
      }));
      if (sorted.length > MAX_SECTIONS) { items.push(intl.formatMessage(describe.more, { count: sorted.length - MAX_SECTIONS })); }
      return intl.formatMessage(describe.dependents, { count: total, sections: intl.formatList(items, { type: 'conjunction' }) });
    };
    for (const name of names) {
      const short = shortPath(fileOf(meta, name));
      if (!byFile.has(short)) {
        const words = short.replace(/^(components|global)\//, '').replace(/\.json$/, '').split(/[/-]/)
          .filter((w) => w && !firstFolder.has(w));
        byFile.set(short, { short, title: labels.fileTitle(words.length ? words.join('-') : short), rows: [] });
      }
      const omit = new Set([...own, ...fileWords(short)]);
      const label = labels.label(name, omit);
      const ref = followed(raw.get(name));
      let follows = null;
      if (ref) {
        const refScope = scopeOf.get(ref);
        let refOmit = refScope ? scopeWords(refScope) : new Set();
        if (refScope && shortPath(fileOf(meta, ref)) === short) { refOmit = omit; }
        const refLabel = labels.label(ref, refOmit);
        follows = refScope && refScope.id !== scope.id
          ? intl.formatMessage(m.followsIn, { name: refLabel, section: intl.formatMessage(refScope.name) })
          : intl.formatMessage(m.follows, { name: refLabel });
      }
      const description = labels.describe(name, { scope, short, global: kind === 'global' });
      byFile.get(short).rows.push({
        name, label, follows, description, impact: impactOf(name),
      });
    }
    return [...byFile.values()].sort((a, b) => fileRank(a.short) - fileRank(b.short) || a.short.localeCompare(b.short));
  }, [names, meta, scope, kind, scopeOf, labels, intl]);
  useEffect(() => { if (groups.length) { setOpenFiles(new Set([groups[0].short])); } }, [groups]);

  const onChange = (name, value) => setDraft((d) => {
    const next = { ...d };
    if (value === undefined) { delete next[name]; } else { next[name] = value; }
    return next;
  });
  const onRevert = async (entry, name, scopeId) => {
    onChange(name, undefined);
    await revert(entry, [name], scopeId);
  };
  const savedInScope = names.filter((n) => saved[n] !== undefined);
  const errors = Object.entries(draft).filter(([n, v]) => v !== null && validate(v, base[n]));
  const pending = Object.keys(draft);

  const q = query.trim().toLocaleLowerCase(intl.locale);
  const visible = ({ name, label, description }) => (!onlyChanged || saved[name] !== undefined || draft[name] !== undefined)
    && (!q || label.toLocaleLowerCase(intl.locale).includes(q) || description.toLocaleLowerCase(intl.locale).includes(q)
      || (saved[name] ?? base[name] ?? '').toLowerCase().includes(q));

  const previewedInScope = names.some((n) => preview && preview[n] !== saved[n]);
  /** `values` with the draft of this form applied. */
  const withDraft = (values) => {
    const next = { ...values };
    for (const [name, value] of Object.entries(draft)) {
      if (value === null || value.trim() === base[name]) { delete next[name]; } else { next[name] = value.trim(); }
    }
    return next;
  };
  const save = async () => {
    setSaving(true);
    const count = await commit(withDraft(saved), { scopeId: scope.id, names });
    setSaving(false);
    if (count === null) { return; }
    onSaved(intl.formatMessage(m.savedToast, { name: scopeName, count }));
  };
  const startPreview = async () => {
    setSaving(true);
    const others = { ...(preview || saved) };
    names.forEach((n) => { if (saved[n] === undefined) { delete others[n]; } else { others[n] = saved[n]; } });
    const shown = await showPreview(withDraft(others));
    setSaving(false);
    if (shown) { onPreviewed(); }
  };
  const resetScope = () => setDraft(Object.fromEntries(savedInScope.map((n) => [n, null])));
  const title = intl.formatMessage(m.editTitle, { name: scopeName });

  return (
    <ModalDialog
      title={title} isOpen onClose={onClose} size="xl" hasCloseButton isFullscreenOnMobile isBlocking className="preview-dialog"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
        <p className="small text-muted mb-0">
          {intl.formatMessage(m.editIntro, { count: names.length, mode: modeName(intl) })}
        </p>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <div className="preview-row">
          <Form.Control
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder={intl.formatMessage(m.search)}
            aria-label={intl.formatMessage(m.search)} leadingElement={<Icon src={Search} />} style={{ width: 320 }}
          />
          <Form.Checkbox checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)}>
            {intl.formatMessage(m.onlyChanged)}
          </Form.Checkbox>
        </div>
        <p className="small text-muted">{intl.formatMessage(m.followsHelp)}</p>
        {groups.map((g) => {
          const shown = g.rows.filter(visible);
          if (!shown.length) { return null; }
          const open = openFiles.has(g.short) || Boolean(q) || onlyChanged;
          return (
            <details
              key={g.short} className="preview-edit-group" open={open}
              onToggle={(e) => {
                const isOpen = e.currentTarget.open;
                setOpenFiles((s) => { const n = new Set(s); if (isOpen) { n.add(g.short); } else { n.delete(g.short); } return n; });
              }}
            >
              <summary>
                <strong>{g.title}</strong>
                <span className="small text-muted">{` (${intl.formatNumber(shown.length)})`}</span>
              </summary>
              {open && shown.map((row) => (
                <TokenRow
                  key={row.name} row={row} scope={scope} base={base[row.name] || ''}
                  saved={saved[row.name]} draft={draft[row.name]} onChange={onChange} onRevert={onRevert}
                />
              ))}
            </details>
          );
        })}
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <Button variant="outline-danger" onClick={resetScope} disabled={!savedInScope.length}>
            {intl.formatMessage(m.resetScope, { name: scopeName, count: savedInScope.length })}
          </Button>
          <ActionRow.Spacer />
          <Button variant="tertiary" onClick={onClose}>{intl.formatMessage(m.cancel)}</Button>
          <Button
            variant="outline-primary" iconBefore={Visibility} onClick={startPreview}
            disabled={(!pending.length && !previewedInScope) || errors.length > 0 || saving}
          >
            {intl.formatMessage(m.previewInApps)}
          </Button>
          <Button onClick={save} disabled={!pending.length || errors.length > 0 || saving}>
            {pending.length ? intl.formatMessage(m.saveCount, { count: pending.length }) : intl.formatMessage(m.save)}
          </Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
}
