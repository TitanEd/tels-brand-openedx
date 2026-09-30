/* Download of the saved values as a file, and import of such a file: every value is checked before it is saved. */
import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  ActionRow, Alert, Button, Form, ModalDialog, StatefulButton,
} from '@openedx/paragon';
import { Error as ErrorIcon, Warning } from '@openedx/paragon/icons';
import { Value } from './history';
import {
  diff, modeName, readBaseValues, useSavedTokens, valueError,
} from './saved';
import { MODE } from './tokens';
import m from './page.messages';

const FORMAT = 'design-tokens';
const MAX_FILE_SIZE = 1024 * 1024;
const COLLAPSED = 8;

export function download(values) {
  const file = {
    format: FORMAT, version: 1, mode: MODE, exportedAt: new Date().toISOString(), tokens: values,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `design-tokens-${MODE}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** The text of a chosen file, or null when it is too large to be an export. */
export const readFile = (file) => (file.size > MAX_FILE_SIZE ? Promise.resolve(null) : file.text());

/**
 * Checks the text of an import file against the tokens of this page. Accepts a file made by `download` or a plain
 * object of token names and values. Returns null when the file is not usable, else
 * { fileMode, values: { name: value }, unknown: [name], invalid: [{ name, value, error }] }.
 */
function checkImport(text, known) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return null; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) { return null; }
  const tokens = data.tokens && typeof data.tokens === 'object' && !Array.isArray(data.tokens) ? data.tokens : data;
  const entries = Object.entries(tokens).filter(([name]) => name.startsWith('--'));
  if (!entries.length) { return null; }
  const unknown = entries.filter(([name]) => !known.has(name)).map(([name]) => name);
  const base = readBaseValues(entries.map(([name]) => name).filter((n) => known.has(n)));
  const values = {};
  const invalid = [];
  entries.filter(([name]) => known.has(name)).forEach(([name, value]) => {
    const error = typeof value === 'string' ? valueError(value, base[name]) : m.importNotText;
    if (error) { invalid.push({ name, value: typeof value === 'string' ? value : JSON.stringify(value), error }); }
    else { values[name] = value.trim(); }
  });
  return {
    fileMode: ['light', 'dark'].includes(data.mode) ? data.mode : null, values, unknown, invalid,
  };
}

/**
 * Shows what an import file changes and saves it as one history entry.
 * file: { name, text } (text null = unreadable); known: Set of token names; labelOf(name): readable name.
 */
export function ImportDialog({
  file, known, labelOf, onClose, onImported,
}) {
  const intl = useIntl();
  const { saved, commit } = useSavedTokens();
  const [keepOthers, setKeepOthers] = useState('keep');
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState('default');
  const result = useMemo(() => (file.text === null ? null : checkImport(file.text, known)), [file, known]);

  const others = result ? Object.keys(saved).filter((n) => !(n in result.values)) : [];
  const next = result && (keepOthers === 'keep' ? { ...saved, ...result.values } : { ...result.values });
  const changes = result ? diff(saved, next) : [];
  const same = result ? Object.keys(result.values).filter((n) => saved[n] === result.values[n]).length : 0;
  const changedNames = changes.map((c) => c.name).join(' ');
  const base = useMemo(() => readBaseValues(changedNames ? changedNames.split(' ') : []), [changedNames]);
  const mode = modeName(intl);
  const title = intl.formatMessage(m.importTitle);

  const save = async () => {
    setState('pending');
    const count = await commit(next, { action: 'import', source: file.name });
    if (count === null) { setState('default'); return; }
    onImported(count);
  };

  return (
    <ModalDialog title={title} isOpen onClose={onClose} size="lg" hasCloseButton isFullscreenOnMobile className="preview-dialog">
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
        <p className="small text-muted mb-0">
          {intl.formatMessage(m.importIntro, { file: <bdi key="file">{file.name}</bdi>, mode })}
        </p>
      </ModalDialog.Header>
      <ModalDialog.Body>
        {!result && <Alert variant="danger" icon={ErrorIcon}>{intl.formatMessage(m.importReadError)}</Alert>}
        {result && (
          <>
            {result.fileMode && result.fileMode !== MODE && (
              <Alert variant="warning" icon={Warning}>
                {intl.formatMessage(m.importModeWarning, {
                  fileMode: intl.formatMessage(result.fileMode === 'dark' ? m.darkModeName : m.lightModeName), mode,
                })}
              </Alert>
            )}
            <ul className="preview-import-summary">
              <li><strong>{intl.formatMessage(m.importChanges, { count: changes.length })}</strong></li>
              {same > 0 && <li>{intl.formatMessage(m.importSame, { count: same })}</li>}
              {result.invalid.length > 0 && <li>{intl.formatMessage(m.importInvalid, { count: result.invalid.length })}</li>}
              {result.unknown.length > 0 && <li>{intl.formatMessage(m.importUnknown, { count: result.unknown.length })}</li>}
            </ul>
            {others.length > 0 && (
              <Form.Group className="preview-import-choice">
                <Form.Label>{intl.formatMessage(m.importKeepLabel, { count: others.length })}</Form.Label>
                <Form.RadioSet name="import-keep" value={keepOthers} onChange={(e) => setKeepOthers(e.target.value)}>
                  <Form.Radio value="keep">{intl.formatMessage(m.importKeep)}</Form.Radio>
                  <Form.Radio value="replace">{intl.formatMessage(m.importReplace)}</Form.Radio>
                </Form.RadioSet>
              </Form.Group>
            )}
            {changes.length > 0 && (
              <ul className="preview-history-changes preview-import-list">
                {(expanded ? changes : changes.slice(0, COLLAPSED)).map((c) => (
                  <li key={c.name}>
                    <span className="preview-history-label">{labelOf(c.name)}</span>
                    <span>
                      {intl.formatMessage(m.changeArrow, {
                        from: <Value key="from" value={c.from} base={base[c.name]} />,
                        to: <Value key="to" value={c.to} base={base[c.name]} />,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {changes.length > COLLAPSED && !expanded && (
              <Button variant="link" size="sm" className="px-0" onClick={() => setExpanded(true)}>
                {intl.formatMessage(m.showAll, { count: changes.length })}
              </Button>
            )}
            {result.invalid.length > 0 && (
              <ul className="preview-history-changes preview-import-list preview-import-invalid">
                {result.invalid.map((item) => (
                  <li key={item.name}>
                    <span className="preview-history-label">{labelOf(item.name)}</span>
                    <span><bdi dir="ltr">{item.value}</bdi> · <span className="text-danger">{intl.formatMessage(item.error)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary">{intl.formatMessage(m.importCancel)}</ModalDialog.CloseButton>
          <StatefulButton
            state={state} disabledStates={['pending']} onClick={save} disabled={!changes.length}
            labels={{ default: intl.formatMessage(m.importConfirm), pending: intl.formatMessage(m.importConfirm) }}
          />
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
}
