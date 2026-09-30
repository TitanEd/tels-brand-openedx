/* Uploaded fonts: their @font-face rules on this page, and a font picker with an Upload button. */
import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useIntl } from 'react-intl';
import { Button, Form } from '@openedx/paragon';
import { Upload } from '@openedx/paragon/icons';
import { fontStore } from './theme-store';
import { useDialogs } from './dialogs';
import m from './themes.messages';

const STYLE_ID = 'design-tokens-uploaded-fonts';
const FORMATS = {
  woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype',
};
const WEIGHTS = {
  thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400,
  medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900,
};

/** { family, weight, style } from a font file name such as "OpenSans-SemiBoldItalic.ttf". */
export function describeFontFile(fileName) {
  const parts = fileName.replace(/\.[^.]+$/, '').replace(/\[.*\]|[-_ ]?VariableFont.*$/i, '').split(/[-_]/).filter(Boolean);
  const suffix = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const style = /italic|oblique/.test(suffix) ? 'italic' : 'normal';
  const weightWord = suffix.replace(/italic|oblique/g, '');
  const isStyle = parts.length > 1 && (weightWord === '' || WEIGHTS[weightWord] !== undefined);
  const family = (isStyle ? parts.slice(0, -1) : parts).join(' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return { family: family || `Font ${Date.now().toString(36)}`, weight: WEIGHTS[weightWord] || 400, style };
}

/** The token value for an uploaded font family. */
export const uploadedFontValue = (family) => `'${family}', sans-serif`;
/** The first family of a font list: "'Nunito Sans', sans-serif" -> "Nunito Sans". */
export const firstFamily = (value) => (value || '').split(',')[0].replace(/["']/g, '').trim();
const sameFont = (a, b) => (a || '').replace(/["']/g, '').replace(/\s*,\s*/g, ',').trim().toLowerCase()
  === (b || '').replace(/["']/g, '').replace(/\s*,\s*/g, ',').trim().toLowerCase();

// Fonts that every computer has, so they need no upload. `label` is a message key when the family name is not
// the name people know.
const SYSTEM_FONTS = [
  { value: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", label: 'systemUi' },
  { value: 'Arial, Helvetica, sans-serif' },
  { value: "Verdana, Geneva, 'DejaVu Sans', sans-serif" },
  { value: "'Trebuchet MS', 'Lucida Grande', sans-serif" },
  { value: "Georgia, 'Times New Roman', serif" },
  { value: "'Times New Roman', Times, serif" },
  { value: "'Courier New', Courier, monospace" },
];

const FontsContext = createContext({ fonts: [], upload: async () => null });
export const useFonts = () => useContext(FontsContext);

export function FontsProvider({ children }) {
  const intl = useIntl();
  const { notify } = useDialogs();
  const [fonts, setFonts] = useState([]);
  const refresh = () => fontStore.list().then(setFonts).catch((error) => console.error(error));
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = fonts.map((f) => `@font-face { font-family: "${f.family}"; src: url("${fontStore.url(f)}") `
      + `format("${FORMATS[f.file.split('.').pop()]}"); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`).join('\n');
  }, [fonts]);
  const value = useMemo(() => ({
    fonts,
    /** Uploads a font file; returns the stored font, or null (after telling the user). */
    upload: async (file) => {
      try {
        const font = await fontStore.upload(file, describeFontFile(file.name));
        await refresh();
        return font;
      } catch (error) {
        console.error(error);
        notify({ text: intl.formatMessage(m.uploadFailed) });
        return null;
      }
    },
  }), [fonts, intl, notify]); // eslint-disable-line react-hooks/exhaustive-deps
  return <FontsContext.Provider value={value}>{children}</FontsContext.Provider>;
}

/** A list of fonts (on every computer, uploaded) and an Upload font button. `label` names the field. */
export function FontPicker({
  value, onChange, label, onUploaded,
}) {
  const intl = useIntl();
  const { fonts, upload } = useFonts();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const uploaded = [...new Set(fonts.map((f) => f.family))].map((family) => ({ value: uploadedFontValue(family) }));
  const known = [...SYSTEM_FONTS, ...uploaded].find((o) => sameFont(o.value, value));
  const optionLabel = (o) => (o.label ? intl.formatMessage(m[o.label]) : firstFamily(o.value));
  const option = (o) => <option key={o.value} value={o.value} style={{ fontFamily: o.value }}>{optionLabel(o)}</option>;
  const onFile = async (e) => {
    const [file] = e.target.files;
    e.target.value = '';
    if (!file) { return; }
    setBusy(true);
    const font = await upload(file);
    setBusy(false);
    if (font) {
      onChange(uploadedFontValue(font.family));
      if (onUploaded) { onUploaded(intl.formatMessage(m.uploaded, { name: font.family })); }
    }
  };
  return (
    <div className="font-picker">
      <div className="font-picker-row">
        <Form.Control
          as="select" size="sm" value={known ? known.value : ''} aria-label={label} style={{ fontFamily: value }}
          onChange={(e) => { if (e.target.value) { onChange(e.target.value); } }}
        >
          {!known && (
            <optgroup label={intl.formatMessage(m.fontCurrent)}>
              <option value="">{firstFamily(value)}</option>
            </optgroup>
          )}
          <optgroup label={intl.formatMessage(m.fontSystem)}>{SYSTEM_FONTS.map(option)}</optgroup>
          {uploaded.length > 0 && <optgroup label={intl.formatMessage(m.fontUploadedGroup)}>{uploaded.map(option)}</optgroup>}
        </Form.Control>
        <Button
          size="sm" variant="outline-primary" iconBefore={Upload} disabled={busy}
          onClick={() => input.current.click()} aria-label={intl.formatMessage(m.uploadAria, { name: label })}
        >
          {intl.formatMessage(busy ? m.uploading : m.upload)}
        </Button>
        <input
          ref={input} type="file" hidden accept=".woff2,.woff,.ttf,.otf" onChange={onFile}
          aria-label={intl.formatMessage(m.uploadAria, { name: label })}
        />
      </div>
      <div className="small text-muted">{intl.formatMessage(m.uploadHelp)}</div>
    </div>
  );
}
