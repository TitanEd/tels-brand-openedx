/* Design token preview: step 1 global tokens, step 2 one section per component, each with an Edit form. */
import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { FormattedMessage, IntlProvider, useIntl } from 'react-intl';
import {
  Alert, Badge, Button, Icon, Nav, Toast,
} from '@openedx/paragon';
import {
  Download, Edit, ExpandLess, ExpandMore, History as HistoryIcon, Upload, Visibility,
} from '@openedx/paragon/icons';
import { APPS } from './apps';
import {
  COMPONENTS, GLOBAL_GROUPS, OTHER_COMPONENTS, OTHER_GLOBALS,
} from './catalog';
import { TokenEditor } from './editor';
import { HistoryDialog, useHistoryCount } from './history';
import {
  SavedTokensProvider, diff, modeName, parseColor, useSavedTokens,
} from './saved';
import {
  applyLocaleToDocument, getLocale, getMessages,
} from './i18n';
import { scopeWords, useTokenLabels } from './labels';
import { ImportDialog, download, readFile } from './transfer';
import { DialogsProvider, useDialogs } from './dialogs';
import { FontsProvider } from './fonts';
import { ThemeSection } from './themes';
import {
  MODE, assignTokens, isColor, isLength, useTokenMeta,
} from './tokens';
import m from './page.messages';

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }

  static getDerivedStateFromError(error) { return { error }; }

  render() {
    if (this.state.error) {
      return <div className="text-danger small"><FormattedMessage {...m.demoError} /></div>;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Global token tiles
// ---------------------------------------------------------------------------

/** A token value as a person reads it: colors as #RRGGBB, lengths in px, the first font of a font list. */
function readableValue(name, value, probe, intl) {
  if (!value) { return ''; }
  if (/shadow/.test(name)) { return ''; }
  if (isColor(value)) {
    const { hex, alpha } = parseColor(value);
    return alpha < 1 ? `${hex.toUpperCase()} · ${intl.formatNumber(alpha, { style: 'percent' })}` : hex.toUpperCase();
  }
  if (/font-family/.test(name)) { return value.split(',')[0].replace(/["']/g, '').trim(); }
  if (isLength(value) && !/%$/.test(value)) {
    probe.style.width = value;
    const px = parseFloat(getComputedStyle(probe).width);
    return Number.isFinite(px) ? `${intl.formatNumber(Math.round(px * 100) / 100)} px` : value;
  }
  return value.replace(/\s+/g, ' ');
}

function TokenTiles({ scope, names }) {
  const intl = useIntl();
  const labels = useTokenLabels();
  const { saved, version } = useSavedTokens();
  const values = useMemo(() => {
    const computed = getComputedStyle(document.documentElement);
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const result = Object.fromEntries(names.map((n) => {
      const value = computed.getPropertyValue(n).trim();
      return [n, { value, text: readableValue(n, value, probe, intl) }];
    }));
    probe.remove();
    return result;
  }, [names, version, intl]); // eslint-disable-line react-hooks/exhaustive-deps
  const omit = useMemo(() => scopeWords(scope), [scope]);
  return (
    <div className="preview-tiles">
      {names.map((name) => {
        const { value, text } = values[name];
        let visual = null;
        if (isColor(value)) {
          visual = <span className="preview-tile-color" style={{ background: `var(${name})` }} />;
        } else if (/shadow/.test(name)) {
          visual = <span className="preview-tile-shadow" style={{ boxShadow: `var(${name})` }} />;
        } else if (/font-family/.test(name)) {
          visual = <span className="preview-tile-text" style={{ fontFamily: `var(${name})` }}>{intl.formatMessage(m.tileSample)}</span>;
        } else if (/font-size/.test(name)) {
          visual = <span className="preview-tile-text" style={{ fontSize: `min(var(${name}), 2.5rem)` }}>{intl.formatMessage(m.tileSample)}</span>;
        } else if (/font-weight/.test(name)) {
          visual = <span className="preview-tile-text" style={{ fontWeight: `var(${name})` }}>{intl.formatMessage(m.tileSample)}</span>;
        } else if (/radius/.test(name)) {
          visual = <span className="preview-tile-radius" style={{ borderRadius: `var(${name})` }} />;
        } else if (/border-width/.test(name)) {
          visual = <span className="preview-tile-radius" style={{ borderWidth: `var(${name})` }} />;
        } else if (isLength(value)) {
          visual = <span className="preview-tile-bar" style={{ width: `min(var(${name}), 100%)` }} />;
        }
        return (
          <div key={name} className="preview-tile">
            <div className="preview-tile-visual">{visual}</div>
            <div className="preview-tile-name">{labels.label(name, omit)}</div>
            {text && <div className="small text-muted preview-tile-value"><bdi dir="ltr">{text}</bdi></div>}
            {saved[name] !== undefined && <Badge variant="info">{intl.formatMessage(m.statusSaved)}</Badge>}
          </div>
        );
      })}
    </div>
  );
}

/** While a preview is on: what it shows, links to the apps, and Save / Discard. `onDone(message)` after either. */
function PreviewBar({ onDone }) {
  const intl = useIntl();
  const {
    saved, preview, commit, stopPreview,
  } = useSavedTokens();
  const [busy, setBusy] = useState(false);
  if (!preview) { return null; }
  const count = diff(saved, preview).length;
  const save = async () => {
    setBusy(true);
    const saveCount = await commit(preview, { action: 'save' });
    setBusy(false);
    if (saveCount !== null) { onDone(intl.formatMessage(m.previewSaved, { count: saveCount })); }
  };
  const discard = async () => {
    setBusy(true);
    const stopped = await stopPreview();
    setBusy(false);
    if (stopped) { onDone(intl.formatMessage(m.previewDiscarded)); }
  };
  return (
    <Alert
      variant="warning" icon={Visibility} className="preview-bar"
      actions={[
        <Button key="discard" variant="tertiary" onClick={discard} disabled={busy}>{intl.formatMessage(m.previewDiscard)}</Button>,
        <Button key="save" onClick={save} disabled={busy}>{intl.formatMessage(m.previewSave, { count })}</Button>,
      ]}
    >
      <Alert.Heading>{intl.formatMessage(m.previewTitle, { count })}</Alert.Heading>
      <p className="mb-2">{intl.formatMessage(m.previewText, { mode: modeName(intl) })}</p>
      <div className="preview-bar-apps">
        <span>{intl.formatMessage(m.previewApps)}</span>
        {APPS.map((app) => (
          <a key={app.url} href={app.url} target="_blank" rel="noopener noreferrer">{intl.formatMessage(m[app.name])}</a>
        ))}
      </div>
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// Step 1 / step 2 sections
// ---------------------------------------------------------------------------

function ScopeSection({
  scope, kind, names, onEdit, onHistory,
}) {
  const intl = useIntl();
  const { saved } = useSavedTokens();
  const historyCount = useHistoryCount(names);
  const Demo = scope.demo;
  const name = intl.formatMessage(scope.name);
  const savedCount = names.filter((n) => saved[n] !== undefined).length;
  return (
    <section id={scope.id} className="preview-card" aria-labelledby={`${scope.id}-title`}>
      <header className="preview-card-header">
        <div>
          <div className="preview-card-kicker">{intl.formatMessage(kind === 'global' ? m.kindGlobal : m.kindComponent)}</div>
          <h3 id={`${scope.id}-title`} className="h4 mb-1">{name}</h3>
          <p className="mb-1">{intl.formatMessage(scope.description)}</p>
          <div className="small text-muted preview-card-meta">
            <span>{names.length ? intl.formatMessage(m.tokenCount, { count: names.length }) : intl.formatMessage(m.noTokens)}</span>
            {savedCount > 0 && <Badge variant="info">{intl.formatMessage(m.savedInCard, { count: savedCount })}</Badge>}
          </div>
        </div>
        <div className="preview-card-actions">
          {historyCount > 0 && (
            <Button
              variant="outline-primary" iconBefore={HistoryIcon} onClick={onHistory}
              aria-label={intl.formatMessage(m.historyAria, { name })}
            >
              {intl.formatMessage(m.history)}
              <Badge variant="light" className="preview-count-badge">{intl.formatNumber(historyCount)}</Badge>
            </Button>
          )}
          <Button iconBefore={Edit} onClick={onEdit} disabled={!names.length} aria-label={intl.formatMessage(m.editAria, { name })}>
            {intl.formatMessage(m.edit)}
          </Button>
        </div>
      </header>
      <div className="preview-card-body">
        {scope.note && <p className="small text-muted">{intl.formatMessage(scope.note)}</p>}
        {Demo && <div className="preview-demo"><Boundary><Demo /></Boundary></div>}
        {kind === 'global' && names.length > 0 && <TokenTiles scope={scope} names={names} />}
      </div>
    </section>
  );
}

function Step({ number, title, text }) {
  const intl = useIntl();
  return (
    <div className="preview-step">
      <span className="preview-step-number">{intl.formatNumber(number)}</span>
      <div><h2 className="h3 mb-1">{title}</h2><p className="mb-0 text-muted">{text}</p></div>
    </div>
  );
}

const scrollTo = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

function SidebarGroup({ id, title, items }) {
  const intl = useIntl();
  const [open, setOpen] = useState(true);
  return (
    <div className="preview-sidebar-group">
      <button
        type="button" className="preview-sidebar-heading" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <Icon src={open ? ExpandLess : ExpandMore} size="sm" />
      </button>
      {open && (
        <nav id={id} className="preview-sidebar-links small" aria-label={title}>
          {items.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={scrollTo(item.id)}>{intl.formatMessage(item.name)}</a>
          ))}
        </nav>
      )}
    </div>
  );
}

function Page() {
  const intl = useIntl();
  const meta = useTokenMeta();
  const labels = useTokenLabels();
  const { saved, commit, revert } = useSavedTokens();
  const dialogs = useDialogs();
  const historyCount = useHistoryCount();
  const [editing, setEditing] = useState(null);
  const [historyOf, setHistoryOf] = useState(null);
  const [importing, setImporting] = useState(null);
  const [message, setMessage] = useState(null);
  const [themePreviewing, setThemePreviewing] = useState(false);
  const fileInput = useRef(null);
  const title = intl.formatMessage(m.pageTitle);
  const mode = modeName(intl);

  useEffect(() => { document.title = `${title} · ${mode}`; }, [title, mode]);

  const scopes = useMemo(() => {
    if (!meta) { return null; }
    const all = [...GLOBAL_GROUPS, ...COMPONENTS];
    const byScope = assignTokens(meta, all, (short) => {
      if (short.startsWith('global/')) { return OTHER_GLOBALS.id; }
      if (short.startsWith('components/')) { return OTHER_COMPONENTS.id; }
      return null;
    });
    const withOther = (list, other) => (byScope.get(other.id)?.length ? [...list, other] : list);
    const globals = withOther(GLOBAL_GROUPS, OTHER_GLOBALS).filter((g) => byScope.get(g.id)?.length);
    const components = withOther(COMPONENTS, OTHER_COMPONENTS);
    const scopeOf = new Map();
    const scopeById = new Map();
    [...globals, ...components].forEach((s) => {
      scopeById.set(s.id, s);
      (byScope.get(s.id) || []).forEach((n) => scopeOf.set(n, s));
    });
    return {
      byScope, globals, components, scopeOf, scopeById, known: new Set(Object.keys(meta.sources)),
    };
  }, [meta]);

  const savedCount = Object.keys(saved).length;
  const resetAll = async () => {
    const confirmed = await dialogs.confirm({
      title: intl.formatMessage(m.resetAllConfirm, { count: savedCount, mode }),
      text: intl.formatMessage(m.resetAllConfirmText),
      confirmLabel: intl.formatMessage(m.resetAll),
      danger: true,
    });
    if (!confirmed) { return; }
    const count = await commit({}, { action: 'reset-all' });
    if (count !== null) { setMessage(intl.formatMessage(m.resetAllDone)); }
  };
  const scopeName = (id) => {
    const scope = id && scopes.scopeById.get(id);
    return scope ? intl.formatMessage(scope.name) : intl.formatMessage(m.allTokens);
  };
  const labelOf = (name, entry) => {
    const scope = scopes.scopeOf.get(name);
    if (!scope) { return labels.label(name); }
    const label = labels.label(name, scopeWords(scope));
    return entry.scopeId === scope.id
      ? label : intl.formatMessage(m.tokenInSection, { section: intl.formatMessage(scope.name), name: label });
  };
  const onFileChosen = async (e) => {
    const [file] = e.target.files;
    e.target.value = '';
    if (file) { setImporting({ name: file.name, text: await readFile(file) }); }
  };
  const onRevert = async (entry, changes) => {
    const scopeId = historyOf && historyOf !== 'all' ? historyOf.id : undefined;
    const count = await revert(entry, changes.map((c) => c.name), scopeId);
    if (count !== null) { setMessage(intl.formatMessage(m.revertedToast, { count })); }
  };

  return (
    <div className="px-4 py-4" id="top">
      <div className="preview-header">
        <h1 className="h2 mb-0">{title}</h1>
        <div className="preview-header-actions">
          <Button variant="outline-primary" iconBefore={HistoryIcon} onClick={() => setHistoryOf('all')} disabled={!scopes}>
            {intl.formatMessage(m.history)}
            {historyCount > 0 && <Badge variant="light" className="preview-count-badge">{intl.formatNumber(historyCount)}</Badge>}
          </Button>
          {savedCount > 0 && (
            <Button variant="outline-primary" iconBefore={Download} onClick={() => download(saved)}>
              {intl.formatMessage(m.download)}
            </Button>
          )}
          <Button variant="outline-primary" iconBefore={Upload} onClick={() => fileInput.current.click()} disabled={!scopes}>
            {intl.formatMessage(m.import)}
          </Button>
          <input
            ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFileChosen}
            aria-label={intl.formatMessage(m.import)}
          />
          {savedCount > 0 && <Button variant="outline-danger" onClick={resetAll}>{intl.formatMessage(m.resetAll)}</Button>}
        </div>
      </div>
      <ThemeSection onMessage={setMessage} onPreviewing={setThemePreviewing} />
      <Nav variant="tabs" activeKey={MODE} className="preview-mode-tabs" aria-label={intl.formatMessage(m.modeSwitch)}>
        {[['light', m.lightMode], ['dark', m.darkMode]].map(([key, label]) => (
          <Nav.Item key={key}>
            <Nav.Link eventKey={key} href={`/${key}.html${window.location.hash}`} aria-current={MODE === key ? 'page' : undefined}>
              {intl.formatMessage(label)}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      {!themePreviewing && <PreviewBar onDone={setMessage} />}

      {!scopes && <p>{intl.formatMessage(m.loading)}</p>}
      {scopes && (
        <div className="preview-layout">
          <aside className="preview-sidebar" aria-label={intl.formatMessage(m.sidebarLabel)}>
            <SidebarGroup id="sidebar-global" title={intl.formatMessage(m.globalHeading)} items={scopes.globals} />
            <SidebarGroup id="sidebar-components" title={intl.formatMessage(m.componentsHeading)} items={scopes.components} />
          </aside>
          <main>
            <div id="step-1">
              <Step number={1} title={intl.formatMessage(m.step1Title)} text={intl.formatMessage(m.step1Text)} />
            </div>
            {scopes.globals.map((g) => (
              <ScopeSection
                key={g.id} scope={g} kind="global" names={scopes.byScope.get(g.id)}
                onEdit={() => setEditing({ scope: g, kind: 'global' })} onHistory={() => setHistoryOf(g)}
              />
            ))}
            <div id="step-2">
              <Step number={2} title={intl.formatMessage(m.step2Title)} text={intl.formatMessage(m.step2Text)} />
            </div>
            {scopes.components.map((c) => (
              <ScopeSection
                key={c.id} scope={c} kind="component" names={scopes.byScope.get(c.id) || []}
                onEdit={() => setEditing({ scope: c, kind: 'component' })} onHistory={() => setHistoryOf(c)}
              />
            ))}
          </main>
        </div>
      )}

      {editing && (
        <TokenEditor
          scope={editing.scope} kind={editing.kind} names={scopes.byScope.get(editing.scope.id) || []} meta={meta}
          scopeOf={scopes.scopeOf} onClose={() => setEditing(null)}
          onSaved={(text) => { setEditing(null); setMessage(text); }}
          onPreviewed={() => { setEditing(null); setMessage(intl.formatMessage(m.previewStarted)); }}
        />
      )}
      {historyOf && (
        <HistoryDialog
          title={historyOf === 'all'
            ? intl.formatMessage(m.historyTitle)
            : intl.formatMessage(m.historyScopeTitle, { name: intl.formatMessage(historyOf.name) })}
          names={historyOf === 'all' ? undefined : scopes.byScope.get(historyOf.id)}
          labelOf={historyOf === 'all' ? labelOf : (name) => labels.label(name, scopeWords(historyOf))}
          scopeName={historyOf === 'all' ? scopeName : undefined}
          onRevert={onRevert} onClose={() => setHistoryOf(null)}
        />
      )}
      {importing && (
        <ImportDialog
          file={importing} known={scopes.known} labelOf={(name) => labelOf(name, {})} onClose={() => setImporting(null)}
          onImported={(count) => { setImporting(null); setMessage(intl.formatMessage(m.importDone, { count })); }}
        />
      )}
      <Toast show={Boolean(message)} onClose={() => setMessage(null)}>{message || ''}</Toast>
    </div>
  );
}

const locale = getLocale();
applyLocaleToDocument(locale);

function App() {
  const onError = (error) => {
    if (error.code !== 'MISSING_TRANSLATION') { console.error(error); } // eslint-disable-line no-console
  };
  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} defaultLocale="en" onError={onError}>
      <DialogsProvider>
        <SavedTokensProvider>
          <FontsProvider>
            <Page />
          </FontsProvider>
        </SavedTokensProvider>
      </DialogsProvider>
    </IntlProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
