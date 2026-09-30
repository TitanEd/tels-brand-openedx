/* Theme templates: a scrolling row of theme cards (the theme of the token files first) and the form that makes one. */
import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntl } from 'react-intl';
import {
  ActionRow, Alert, Badge, Button, Form, Icon, IconButton, ModalDialog,
} from '@openedx/paragon';
import {
  Add, CheckCircle, ChevronLeft, ChevronRight, Delete, Edit, Visibility,
} from '@openedx/paragon/icons';
import { APPS } from './apps';
import pageMessages from './page.messages';
import {
  CODE_THEME_ID, HEX, THEME_COLORS, THEME_FONTS, THEME_MODES as MODES, themeTokens,
} from './theme-template';
import { themeStore } from './theme-store';
import { useDialogs } from './dialogs';
import { FontPicker, firstFamily } from './fonts';
import { diff, parseColor, useSavedTokens } from './saved';
import { MODE } from './tokens';
import m from './themes.messages';

const WHITE = '#ffffff';
const MODE_NAME = { light: m.sampleLight, dark: m.sampleDark };

// ---------------------------------------------------------------------------
// The theme of the token files, read from the built CSS
// ---------------------------------------------------------------------------

/** Map(--pgn-* name -> value) of the declarations in `css`, first one first. */
function declarations(css) {
  const values = new Map();
  for (const [, name, value] of css.matchAll(/(--pgn-[\w-]+)\s*:\s*([^;}]+)[;}]/g)) {
    if (!values.has(name)) { values.set(name, value.trim()); }
  }
  return values;
}

/** `value` with every var(--pgn-…) replaced by the value it points to. */
function resolve(values, value) {
  let result = value;
  for (let i = 0; i < 10 && /var\(/.test(result); i += 1) {
    result = result.replace(/var\(\s*(--pgn-[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, name, fallback) => values.get(name) ?? fallback ?? '');
  }
  return result;
}

const toHex = (value) => parseColor(value).hex.toLowerCase();

/** The theme of the token files (dist/core.css + light.css / dark.css), in the shape of a theme template. */
async function loadCodeTheme() {
  const [core, light, dark] = await Promise.all(['core', 'light', 'dark'].map((name) => fetch(`/brand/${name}.css`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : ''))));
  const byMode = {
    light: new Map([...declarations(core), ...declarations(light)]),
    dark: new Map([...declarations(core), ...declarations(dark)]),
  };
  const read = (mode, token) => resolve(byMode[mode], byMode[mode].get(token) || '');
  return {
    id: CODE_THEME_ID,
    colors: Object.fromEntries(MODES.map((mode) => [mode, Object.fromEntries(THEME_COLORS.map((c) => [c.key, toHex(read(mode, c.token))]))])),
    fonts: Object.fromEntries(THEME_FONTS.map((f) => [f.key, read('light', f.token)])),
  };
}

// Colors that the token files may point at another theme color (brand and link at primary, surface at background).
const FOLLOWS = { brand: 'primary', link: 'primary', surface: 'background' };

/**
 * The colors of `theme` per mode. A color it does not set has its value in the token files, or follows the theme's
 * own color when the token files make it follow that one.
 */
const fullColors = (theme, codeTheme) => Object.fromEntries(MODES.map((mode) => {
  const code = codeTheme.colors[mode];
  const own = theme.colors[mode] || {};
  const colors = { ...code, ...own };
  Object.entries(FOLLOWS).forEach(([key, followed]) => {
    if (!own[key] && own[followed] && code[key] === code[followed]) { colors[key] = own[followed]; }
  });
  return [mode, colors];
}));

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

// Ready-made palettes for the theme form. Every contrast check under the colors passes (4.5:1) in both modes.
const PALETTES = [
  {
    id: 'ocean',
    name: m.paletteOcean,
    colors: {
      light: {
        primary: '#0a66c2', secondary: '#3e4c59', brand: '#0b5cad', link: '#0a66c2', background: '#ffffff', surface: '#ffffff', text: '#1f2933', headings: '#102a43', border: '#d9e2ec',
      },
      dark: {
        primary: '#2563eb', secondary: '#52606d', brand: '#2563eb', link: '#60a5fa', background: '#0f172a', surface: '#1e293b', text: '#e2e8f0', headings: '#f8fafc', border: '#334155',
      },
    },
  },
  {
    id: 'forest',
    name: m.paletteForest,
    colors: {
      light: {
        primary: '#2e7d32', secondary: '#5d4037', brand: '#1b5e20', link: '#2e7d32', background: '#ffffff', surface: '#ffffff', text: '#1c2a1e', headings: '#10301a', border: '#d7e3d9',
      },
      dark: {
        primary: '#2e7d32', secondary: '#6d4c41', brand: '#2e7d32', link: '#81c784', background: '#0f1a12', surface: '#18261b', text: '#e6f0e8', headings: '#f4faf5', border: '#2f4234',
      },
    },
  },
  {
    id: 'sunset',
    name: m.paletteSunset,
    colors: {
      light: {
        primary: '#b93c0a', secondary: '#7c2d12', brand: '#c2410c', link: '#b93c0a', background: '#fffbf5', surface: '#ffffff', text: '#292524', headings: '#1c1917', border: '#eadfd3',
      },
      dark: {
        primary: '#c2410c', secondary: '#9a3412', brand: '#c2410c', link: '#fdba74', background: '#1c1917', surface: '#292524', text: '#f5f5f4', headings: '#fafaf9', border: '#44403c',
      },
    },
  },
  {
    id: 'royal',
    name: m.paletteRoyal,
    colors: {
      light: {
        primary: '#6d28d9', secondary: '#334155', brand: '#5b21b6', link: '#6d28d9', background: '#ffffff', surface: '#ffffff', text: '#1e1b4b', headings: '#1e1b4b', border: '#e4e0f5',
      },
      dark: {
        primary: '#7c3aed', secondary: '#475569', brand: '#6d28d9', link: '#c4b5fd', background: '#13111c', surface: '#1f1b2e', text: '#ede9fe', headings: '#faf5ff', border: '#3b3551',
      },
    },
  },
  {
    id: 'teal',
    name: m.paletteTeal,
    colors: {
      light: {
        primary: '#0f766e', secondary: '#334155', brand: '#0f766e', link: '#0f766e', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', headings: '#0f172a', border: '#dbe4ea',
      },
      dark: {
        primary: '#0f766e', secondary: '#475569', brand: '#0f766e', link: '#5eead4', background: '#042f2e', surface: '#0b3b39', text: '#ccfbf1', headings: '#f0fdfa', border: '#1f5552',
      },
    },
  },
  {
    id: 'graphite',
    name: m.paletteGraphite,
    colors: {
      light: {
        primary: '#1f2937', secondary: '#4b5563', brand: '#111827', link: '#1f2937', background: '#ffffff', surface: '#ffffff', text: '#111827', headings: '#030712', border: '#e5e7eb',
      },
      dark: {
        primary: '#4b5563', secondary: '#374151', brand: '#4b5563', link: '#d1d5db', background: '#0b0f19', surface: '#161b26', text: '#f3f4f6', headings: '#ffffff', border: '#2d3340',
      },
    },
  },
];
const samePalette = (a, b) => MODES.every((mode) => THEME_COLORS.every((c) => a[mode][c.key] === b[mode][c.key]));

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio of two #rrggbb colors. */
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
// The contrast checks shown under a color, from the colors of its mode: [message, other color] pairs.
const onPage = (c) => [[m.contrastBackground, c.background], [m.contrastSurface, c.surface]];
const CONTRAST = {
  primary: () => [[m.contrastLabels, WHITE]],
  secondary: () => [[m.contrastLabels, WHITE]],
  brand: () => [[m.contrastLabels, WHITE]],
  link: onPage,
  text: onPage,
  headings: onPage,
};

// ---------------------------------------------------------------------------
// Sample and card
// ---------------------------------------------------------------------------

/** A light and a dark screen drawn with `colors` (every color of both modes) and the fonts of `theme`. */
function ThemeSample({ colors: byMode, fonts, compact = false }) {
  const intl = useIntl();
  return (
    <div className={`theme-sample${compact ? ' is-compact' : ''}`} aria-hidden={compact || undefined}>
      {MODES.map((mode) => {
        const colors = byMode[mode];
        return (
          <div
            key={mode} className="theme-sample-screen"
            style={{ background: colors.background, color: colors.text, fontFamily: fonts.body }}
          >
            <div className="theme-sample-mode">{intl.formatMessage(MODE_NAME[mode])}</div>
            <div className="theme-sample-heading" style={{ color: colors.headings, fontFamily: fonts.headings }}>{intl.formatMessage(m.sampleHeading)}</div>
            <div className="theme-sample-card" style={{ background: colors.surface, borderColor: colors.border }}>
              {!compact && <p className="theme-sample-text">{intl.formatMessage(m.sampleText)}</p>}
              <div className="theme-sample-actions">
                <span className="theme-sample-button" style={{ background: colors.primary, color: WHITE }}>{intl.formatMessage(m.sampleButton)}</span>
                {!compact && (
                  <span className="theme-sample-button" style={{ background: colors.secondary, color: WHITE }}>{intl.formatMessage(m.sampleSecondary)}</span>
                )}
                <span className="theme-sample-link" style={{ color: colors.link }}>{intl.formatMessage(m.sampleLink)}</span>
                {!compact && <span className="theme-sample-badge" style={{ background: colors.brand, color: WHITE }}>{intl.formatMessage(m.sampleBrand)}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Swatches({ colors }) {
  const intl = useIntl();
  return (
    <div className="theme-swatches">
      {MODES.map((mode) => {
        const modeName = intl.formatMessage(MODE_NAME[mode]);
        return (
          <div key={mode} className="theme-swatch-row" role="group" aria-label={modeName}>
            <span className="theme-swatch-mode" aria-hidden>{modeName}</span>
            {THEME_COLORS.map((c) => {
              const label = intl.formatMessage(m.swatchMode, {
                mode: modeName, name: intl.formatMessage(m[`${c.key}Color`]), value: colors[mode][c.key].toUpperCase(),
              });
              return <span key={c.key} className="theme-swatch" style={{ background: colors[mode][c.key] }} title={label} role="img" aria-label={label} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

function ThemeCard({
  theme, colors, name, text, selected, changed, previewed, busy, onUse, onPreview, onEdit, onDelete,
}) {
  const intl = useIntl();
  return (
    <div id={`theme-card-${theme.id}`} className={`theme-card${selected ? ' is-selected' : ''}`} role="listitem">
      <ThemeSample colors={colors} fonts={theme.fonts} compact />
      <div className="theme-card-body">
        <div className="theme-card-title">
          <h3 className="h5 mb-0">{name}</h3>
          {selected && <Badge variant="success"><Icon src={CheckCircle} size="xs" className="theme-card-check" />{intl.formatMessage(m.inUse)}</Badge>}
        </div>
        <p className="small text-muted mb-0">{text}</p>
        <Swatches colors={colors} />
        <div className="small">{intl.formatMessage(m.font, { font: firstFamily(theme.fonts.body) })}</div>
        {selected && changed && <Badge variant="warning" className="align-self-start">{intl.formatMessage(m.changed)}</Badge>}
        {previewed && <Badge variant="info" className="align-self-start">{intl.formatMessage(m.previewing)}</Badge>}
      </div>
      <div className="theme-card-actions">
        <div className="theme-card-main-actions">
          <Button
            size="sm" variant={selected ? 'outline-primary' : 'primary'} onClick={onUse} disabled={busy || (selected && !changed)}
            aria-label={intl.formatMessage(m.useAria, { name })}
          >
            {intl.formatMessage(m.use)}
          </Button>
          <Button
            size="sm" variant="outline-primary" iconBefore={Visibility} onClick={onPreview} disabled={busy || previewed}
            aria-label={intl.formatMessage(m.previewAria, { name })}
          >
            {intl.formatMessage(m.previewButton)}
          </Button>
        </div>
        {onEdit && <IconButton src={Edit} iconAs={Icon} size="sm" alt={intl.formatMessage(m.edit, { name })} onClick={onEdit} disabled={busy} />}
        {onDelete && <IconButton src={Delete} iconAs={Icon} size="sm" alt={intl.formatMessage(m.remove, { name })} onClick={onDelete} disabled={busy} />}
      </div>
    </div>
  );
}

/** A row that scrolls sideways, with Previous / Next buttons and faded edges where there is more to see. */
function Carousel({ label, count, children }) {
  const intl = useIntl();
  const track = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const update = () => {
    const el = track.current;
    if (!el) { return; }
    const position = Math.abs(el.scrollLeft);
    setEdges({ start: position <= 1, end: position >= el.scrollWidth - el.clientWidth - 1 });
  };
  useEffect(() => {
    update();
    const observer = new ResizeObserver(update);
    observer.observe(track.current);
    return () => observer.disconnect();
  }, []);
  useEffect(update, [count]);
  const scroll = (direction) => {
    const el = track.current;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  return (
    <div className={`theme-carousel${edges.start ? '' : ' has-before'}${edges.end ? '' : ' has-after'}`}>
      <IconButton
        src={ChevronLeft} iconAs={Icon} alt={intl.formatMessage(m.previous)} onClick={() => scroll(-1)}
        disabled={edges.start} className="theme-carousel-button"
      />
      <div ref={track} className="theme-track" onScroll={update} role="list" aria-label={label}>{children}</div>
      <IconButton
        src={ChevronRight} iconAs={Icon} alt={intl.formatMessage(m.next)} onClick={() => scroll(1)}
        disabled={edges.end} className="theme-carousel-button"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

/** The color `colorKey` of `mode`: picker, hex field and contrast checks. */
function ColorCell({
  mode, colorKey, colors, text, onChange,
}) {
  const intl = useIntl();
  const name = intl.formatMessage(m[`${colorKey}Color`]);
  const value = text ?? colors[colorKey];
  const valid = HEX.test(value);
  const checks = CONTRAST[colorKey] ? CONTRAST[colorKey](colors) : [];
  return (
    <div className="theme-color-cell">
      <div className="theme-color-mode">{intl.formatMessage(MODE_NAME[mode])}</div>
      <div className="theme-color-inputs">
        <input
          type="color" className="preview-color-input" value={colors[colorKey]}
          aria-label={intl.formatMessage(mode === 'light' ? m.pickLight : m.pickDark, { name })}
          onChange={(e) => onChange(mode, colorKey, e.target.value)}
        />
        <Form.Control
          size="sm" dir="ltr" value={value} isInvalid={!valid}
          aria-label={intl.formatMessage(mode === 'light' ? m.hexLight : m.hexDark, { name })}
          onChange={(e) => onChange(mode, colorKey, e.target.value, true)}
        />
      </div>
      {!valid && <div className="small text-danger">{intl.formatMessage(m.hexInvalid)}</div>}
      {checks.map(([message, other]) => {
        const ratio = contrast(colors[colorKey], other);
        const low = ratio < 4.5;
        return (
          <div key={message.id} className={`small ${low ? 'text-danger' : 'text-muted'}`}>
            {intl.formatMessage(message, { ratio: intl.formatNumber(ratio, { maximumFractionDigits: 1 }) })}
            {low && ` ${intl.formatMessage(m.contrastLow)}`}
          </div>
        );
      })}
    </div>
  );
}

/** One color of the theme: what it is for, and its value for light and for dark screens. */
function ColorRow({
  colorKey, colors, texts, onChange,
}) {
  const intl = useIntl();
  return (
    <div className="theme-color-row" role="group" aria-label={intl.formatMessage(m[`${colorKey}Color`])}>
      <div className="theme-color-text">
        <div className="font-weight-bold">{intl.formatMessage(m[`${colorKey}Color`])}</div>
        <div className="small">{intl.formatMessage(m[`${colorKey}ColorHelp`])}</div>
      </div>
      {MODES.map((mode) => (
        <ColorCell
          key={mode} mode={mode} colorKey={colorKey} colors={colors[mode]} text={texts[`${mode}.${colorKey}`]} onChange={onChange}
        />
      ))}
    </div>
  );
}

/**
 * Form for a new theme (`theme` null, starting from `codeTheme`) or for editing `theme`, filled with `draft` (the
 * values last previewed) when given. onSubmit(values), onCreate(values) (a new theme, not applied) and
 * onPreview(values) return true when done.
 */
function ThemeDialog({
  theme, draft, codeTheme, inUse, onClose, onSubmit, onCreate, onPreview, onMessage,
}) {
  const intl = useIntl();
  const [name, setName] = useState((draft || theme)?.name ?? '');
  const [colors, setColors] = useState(() => fullColors(draft || theme || codeTheme, codeTheme));
  const [fonts, setFonts] = useState(() => ({ ...(draft || theme || codeTheme).fonts }));
  const [texts, setTexts] = useState({});
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const palettes = useMemo(() => [{ id: CODE_THEME_ID, name: m.paletteCode, colors: codeTheme.colors }, ...PALETTES], [codeTheme]);
  const paletteId = palettes.find((p) => samePalette(p.colors, colors))?.id;

  const onColor = (mode, key, value, typed = false) => {
    const field = `${mode}.${key}`;
    if (typed) { setTexts((t) => ({ ...t, [field]: value })); }
    if (HEX.test(value)) {
      setColors((c) => ({ ...c, [mode]: { ...c[mode], [key]: value.toLowerCase() } }));
      if (!typed) { setTexts((t) => ({ ...t, [field]: undefined })); }
    }
  };
  const usePalette = (palette) => { setColors(fullColors(palette, codeTheme)); setTexts({}); };
  const invalid = Object.values(texts).some((t) => t !== undefined && !HEX.test(t));
  const nameMissing = !name.trim();
  const send = (action) => async () => {
    setTouched(true);
    if (nameMissing || invalid) { return; }
    setBusy(true);
    const done = await action({ name: name.trim().slice(0, 80), colors, fonts });
    setBusy(false);
    if (done) { onClose(); }
  };
  const title = theme ? intl.formatMessage(m.editTitle, { name: theme.name }) : intl.formatMessage(m.createTitle);
  let submitText = m.submitCreate;
  if (theme) { submitText = inUse ? m.submitApply : m.submitSave; }

  return (
    <ModalDialog
      title={title} isOpen onClose={onClose} size="xl" hasCloseButton isFullscreenOnMobile isBlocking className="preview-dialog"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
        <p className="small text-muted mb-0">{intl.formatMessage(m.dialogIntro)}</p>
        {inUse && <p className="small mb-0">{intl.formatMessage(m.dialogInUse)}</p>}
      </ModalDialog.Header>
      <ModalDialog.Body>
        <div className="theme-form">
          <div className="theme-form-fields">
            <Form.Group isInvalid={touched && nameMissing}>
              <Form.Label className="font-weight-bold">{intl.formatMessage(m.name)}</Form.Label>
              <Form.Control value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus />
              {touched && nameMissing && <Form.Control.Feedback type="invalid">{intl.formatMessage(m.nameRequired)}</Form.Control.Feedback>}
            </Form.Group>

            <div className="font-weight-bold">{intl.formatMessage(m.palettes)}</div>
            <p className="small text-muted mb-2">{intl.formatMessage(m.palettesHelp)}</p>
            <div className="theme-palettes">
              {palettes.map((p) => (
                <button
                  key={p.id} type="button" className={`theme-palette${paletteId === p.id ? ' is-selected' : ''}`}
                  aria-pressed={paletteId === p.id} onClick={() => usePalette(p)}
                >
                  <span className="theme-palette-dots" aria-hidden>
                    {[['light', 'primary'], ['light', 'secondary'], ['light', 'background'], ['dark', 'background'], ['dark', 'primary']].map(([mode, k]) => (
                      <span key={`${mode}.${k}`} style={{ background: p.colors[mode][k] }} />
                    ))}
                  </span>
                  <span>{intl.formatMessage(p.name)}</span>
                </button>
              ))}
            </div>

            <h3 className="h4 mt-4">{intl.formatMessage(m.colors)}</h3>
            <p className="small text-muted mb-2">{intl.formatMessage(m.colorsHelp)}</p>
            {THEME_COLORS.map((c) => (
              <ColorRow key={c.key} colorKey={c.key} colors={colors} texts={texts} onChange={onColor} />
            ))}

            <h3 className="h4 mt-4">{intl.formatMessage(m.fonts)}</h3>
            {THEME_FONTS.map((f) => (
              <div key={f.key} className="theme-font-field">
                <div className="font-weight-bold">{intl.formatMessage(m[f.key])}</div>
                <div className="small mb-2">{intl.formatMessage(m[`${f.key}Help`])}</div>
                <FontPicker
                  value={fonts[f.key]} label={intl.formatMessage(m[f.key])} onUploaded={onMessage}
                  onChange={(value) => setFonts((x) => ({ ...x, [f.key]: value }))}
                />
              </div>
            ))}
          </div>
          <div className="theme-form-preview">
            <h3 className="h4">{intl.formatMessage(m.preview)}</h3>
            <ThemeSample colors={colors} fonts={fonts} />
          </div>
        </div>
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <span className="small text-muted theme-form-preview-help">{intl.formatMessage(m.previewHelp)}</span>
          <ActionRow.Spacer />
          <Button variant="tertiary" onClick={onClose}>{intl.formatMessage(m.cancel)}</Button>
          <Button variant="outline-primary" iconBefore={Visibility} onClick={send(onPreview)} disabled={busy || (touched && (nameMissing || invalid))}>
            {intl.formatMessage(m.previewButton)}
          </Button>
          {!theme && (
            <Button variant="outline-primary" onClick={send(onCreate)} disabled={busy || (touched && (nameMissing || invalid))}>
              {intl.formatMessage(m.submitCreateOnly)}
            </Button>
          )}
          <Button onClick={send(onSubmit)} disabled={busy || (touched && (nameMissing || invalid))}>{intl.formatMessage(submitText)}</Button>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/** The label of the button that applies the previewed theme. */
function previewApplyLabel({ theme, editing }) {
  if (editing === 'new') { return m.submitCreate; }
  if (editing) { return m.previewSaveUse; }
  return theme.id === CODE_THEME_ID ? m.confirmCodeButton : m.use;
}

/** While a theme is previewed: what is shown, links to the apps, and Back to editing / Discard / apply. */
function ThemePreviewBar({
  name, applyLabel, busy, onBack, onDiscard, onApply,
}) {
  const intl = useIntl();
  return (
    <Alert
      variant="warning" icon={Visibility} className="theme-preview-bar"
      actions={[
        onBack && <Button key="back" variant="tertiary" onClick={onBack} disabled={busy}>{intl.formatMessage(m.previewBack)}</Button>,
        <Button key="discard" variant="tertiary" onClick={onDiscard} disabled={busy}>{intl.formatMessage(m.previewDiscard)}</Button>,
        <Button key="apply" onClick={onApply} disabled={busy}>{applyLabel}</Button>,
      ].filter(Boolean)}
    >
      <Alert.Heading>{intl.formatMessage(m.previewTitle, { name })}</Alert.Heading>
      <p className="mb-2">{intl.formatMessage(m.previewText)}</p>
      <div className="preview-bar-apps">
        <span>{intl.formatMessage(pageMessages.previewApps)}</span>
        {APPS.map((app) => (
          <a key={app.url} href={app.url} target="_blank" rel="noopener noreferrer">{intl.formatMessage(pageMessages[app.name])}</a>
        ))}
      </div>
    </Alert>
  );
}

/**
 * The Themes section. `onMessage(text)` shows a toast; `onPreviewing(on)` says whether a theme preview is shown
 * (the page then hides its own preview bar).
 */
export function ThemeSection({ onMessage, onPreviewing }) {
  const intl = useIntl();
  const {
    saved, preview, commitTo, previewTo, stopPreviewTo,
  } = useSavedTokens();
  const dialogs = useDialogs();
  const [codeTheme, setCodeTheme] = useState(null);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [scrollTo, setScrollTo] = useState(null);

  const previewing = data?.previewing;
  const previewOn = Boolean(previewing) && diff(preview ?? saved, themeTokens(previewing.theme, MODE)).length === 0;
  useEffect(() => { if (onPreviewing) { onPreviewing(previewOn); } }, [previewOn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([loadCodeTheme(), themeStore.load()]).then(([code, list]) => {
      setCodeTheme(code);
      setData(list);
    }).catch((error) => {
      console.error(error);
      dialogs.notify({ text: intl.formatMessage(m.loadFailed) });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (scrollTo) { document.getElementById(`theme-card-${scrollTo}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); }
  }, [scrollTo, data]);

  if (!codeTheme || !data) {
    return <section className="theme-section"><p className="text-muted">{intl.formatMessage(m.loading)}</p></section>;
  }
  const themes = [{ ...codeTheme, name: intl.formatMessage(m.codeName) }, ...data.themes];
  const selectedId = data.selected ?? CODE_THEME_ID;
  const selectedTheme = themes.find((t) => t.id === selectedId);
  const changed = Boolean(selectedTheme) && diff(saved, themeTokens(selectedTheme, MODE)).length > 0;

  const store = async (next) => {
    try {
      const stored = await themeStore.save(next);
      setData(stored);
      return stored;
    } catch (error) {
      console.error(error);
      dialogs.notify({ text: intl.formatMessage(m.saveFailed) });
      return null;
    }
  };
  /** Saves the values of `theme` for light and dark (this page's mode last, so the page shows them). */
  const apply = async (theme, list) => {
    const code = theme.id === CODE_THEME_ID;
    const info = { action: code ? 'theme-code' : 'theme', source: code ? null : theme.name, endPreview: true };
    for (const mode of [...MODES.filter((x) => x !== MODE), MODE]) {
      // eslint-disable-next-line no-await-in-loop
      if (await commitTo(mode, themeTokens(theme, mode), info) === null) { return false; }
    }
    if (!await store({ ...list, selected: theme.id, previewing: null })) { return false; }
    onMessage(code ? intl.formatMessage(m.codeApplied) : intl.formatMessage(m.applied, { name: theme.name }));
    return true;
  };
  const use = async (theme) => {
    const code = theme.id === CODE_THEME_ID;
    const confirmed = await dialogs.confirm(code ? {
      title: intl.formatMessage(m.confirmCode),
      text: intl.formatMessage(m.confirmCodeText),
      confirmLabel: intl.formatMessage(m.confirmCodeButton),
    } : {
      title: intl.formatMessage(m.confirmUse, { name: theme.name }),
      text: intl.formatMessage(m.confirmUseText),
      confirmLabel: intl.formatMessage(m.use),
    });
    if (!confirmed) { return; }
    setBusy(true);
    await apply(theme, data);
    setBusy(false);
  };
  const remove = async (theme) => {
    const confirmed = await dialogs.confirm({
      title: intl.formatMessage(m.confirmDelete, { name: theme.name }),
      text: intl.formatMessage(m.confirmDeleteText),
      confirmLabel: intl.formatMessage(m.confirmDeleteButton),
      danger: true,
    });
    if (!confirmed) { return; }
    setBusy(true);
    const previewOfIt = previewing && (previewing.theme.id === theme.id || previewing.editing === theme.id);
    if (previewOfIt) { await Promise.all(MODES.map((mode) => stopPreviewTo(mode))); }
    const stored = await store({
      themes: data.themes.filter((t) => t.id !== theme.id),
      selected: data.selected === theme.id ? null : data.selected,
      previewing: previewOfIt ? null : previewing,
    });
    setBusy(false);
    if (stored) { onMessage(intl.formatMessage(m.deleted, { name: theme.name })); }
  };
  /**
   * Saves form `values` for `target` (a theme, or 'new') and applies the theme when `use` is true; by default
   * when it is new or in use. Saving without applying ends a preview of the same form.
   */
  const save = async (values, target, use) => {
    const now = new Date().toISOString();
    const isNew = target === 'new';
    const theme = isNew
      ? {
        id: `t-${Date.now().toString(36)}`, created: now, updated: now, ...values,
      }
      : { ...target, ...values, updated: now };
    const applying = use ?? (isNew || data.selected === theme.id);
    const endsPreview = !applying && Boolean(previewing) && previewing.editing === (isNew ? 'new' : theme.id);
    if (endsPreview) { await Promise.all(MODES.map((mode) => stopPreviewTo(mode))); }
    const stored = await store({
      ...data,
      themes: isNew ? [...data.themes, theme] : data.themes.map((t) => (t.id === theme.id ? theme : t)),
      previewing: endsPreview ? null : data.previewing,
    });
    if (!stored) { return false; }
    setScrollTo(theme.id);
    if (applying) { return apply(theme, stored); }
    if (isNew) { onMessage(intl.formatMessage(m.createdOnly, { name: theme.name })); }
    return true;
  };
  const submit = (values) => save(values, editing);
  const createOnly = (values) => save(values, 'new', false);

  /** Shows `theme` on this page and in the apps for light and dark, without saving; `editingRef` as in previewing. */
  const startPreview = async (theme, editingRef) => {
    setBusy(true);
    let done = true;
    for (const mode of [...MODES.filter((x) => x !== MODE), MODE]) {
      // eslint-disable-next-line no-await-in-loop
      if (!await previewTo(mode, themeTokens(theme, mode))) { done = false; break; }
    }
    if (done) { done = Boolean(await store({ ...data, previewing: { theme, editing: editingRef } })); }
    setBusy(false);
    if (done) { onMessage(intl.formatMessage(m.previewStarted, { name: theme.name })); }
    return done;
  };
  /** The theme of the form `values` (for `editing`) as previewed. */
  const previewForm = (values) => startPreview(editing === 'new' ? values : { ...editing, ...values }, editing === 'new' ? 'new' : editing.id);
  const previewCard = (theme) => startPreview(theme.id === CODE_THEME_ID ? { id: CODE_THEME_ID, name: theme.name } : theme, null);
  const discardPreview = async () => {
    setBusy(true);
    const stopped = (await Promise.all(MODES.map((mode) => stopPreviewTo(mode)))).every(Boolean);
    const stored = stopped && await store({ ...data, previewing: null });
    setBusy(false);
    if (stored) { onMessage(intl.formatMessage(m.previewDiscarded)); }
  };
  const previewTarget = () => (previewing.editing === 'new' ? 'new' : data.themes.find((t) => t.id === previewing.editing));
  const backToEditing = () => {
    setDraft(previewing.theme);
    setEditing(previewTarget());
  };
  const applyPreview = async () => {
    setBusy(true);
    if (previewing.editing) {
      const { name, colors, fonts } = previewing.theme;
      await save({ name, colors, fonts }, previewTarget(), true);
    } else {
      const theme = previewing.theme.id === CODE_THEME_ID ? codeTheme : data.themes.find((t) => t.id === previewing.theme.id) || previewing.theme;
      await apply(theme, data);
    }
    setBusy(false);
  };
  const closeDialog = () => { setEditing(null); setDraft(null); };

  return (
    <section className="theme-section" aria-labelledby="themes-title">
      <div className="theme-section-header">
        <div>
          <h2 id="themes-title" className="h3 mb-1">{intl.formatMessage(m.title)}</h2>
          <p className="text-muted mb-0">{intl.formatMessage(m.intro)}</p>
        </div>
        <Button iconBefore={Add} onClick={() => setEditing('new')} disabled={busy}>{intl.formatMessage(m.create)}</Button>
      </div>
      {previewOn && (
        <ThemePreviewBar
          name={previewing.theme.name} busy={busy} onDiscard={discardPreview} onApply={applyPreview}
          onBack={previewing.editing ? backToEditing : null}
          applyLabel={intl.formatMessage(previewApplyLabel(previewing))}
        />
      )}
      <Carousel label={intl.formatMessage(m.listLabel)} count={themes.length}>
        {themes.map((theme) => {
          const code = theme.id === CODE_THEME_ID;
          return (
            <ThemeCard
              key={theme.id} theme={theme} colors={fullColors(theme, codeTheme)} name={theme.name} busy={busy}
              text={code ? intl.formatMessage(m.codeText) : intl.formatMessage(m.created, { date: intl.formatDate(theme.created, { dateStyle: 'medium' }) })}
              selected={theme.id === selectedId} changed={changed}
              previewed={previewOn && !previewing.editing && previewing.theme.id === theme.id}
              onUse={() => use(theme)} onPreview={() => previewCard(theme)}
              onEdit={code ? null : () => setEditing(theme)}
              onDelete={code ? null : () => remove(theme)}
            />
          );
        })}
        <div className="theme-card theme-card-create" role="listitem">
          <button type="button" className="theme-create-button" onClick={() => setEditing('new')} disabled={busy}>
            <Icon src={Add} />
            <span className="h5 mb-0">{intl.formatMessage(m.create)}</span>
            <span className="small text-muted">{intl.formatMessage(m.createText)}</span>
          </button>
        </div>
      </Carousel>
      {editing && (
        <ThemeDialog
          theme={editing === 'new' ? null : editing} draft={draft} codeTheme={codeTheme} inUse={editing !== 'new' && editing.id === data.selected}
          onClose={closeDialog} onSubmit={submit} onCreate={createOnly} onPreview={previewForm} onMessage={onMessage}
        />
      )}
    </section>
  );
}
