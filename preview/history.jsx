/* History of saved changes: the list with Revert buttons, used for all changes, one component and one token. */
import React, { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  ActionRow, Button, ModalDialog,
} from '@openedx/paragon';
import { Undo } from '@openedx/paragon/icons';
import {
  formatTime, modeName, readBaseValues, useSavedTokens,
} from './saved';
import { isColor } from './tokens';
import m from './page.messages';

const COLLAPSED = 6;

/** A saved value with a color swatch; null stands for the built value `base`. */
export function Value({ value, base }) {
  const intl = useIntl();
  const shown = value ?? base;
  return (
    <span className="preview-history-value">
      {isColor(shown) && <span className="preview-history-swatch" style={{ background: shown }} />}
      {value === null ? (
        <span>{intl.formatMessage(m.original)}{base && <> (<bdi dir="ltr">{base}</bdi>)</>}</span>
      ) : <bdi dir="ltr">{value}</bdi>}
    </span>
  );
}

/** Text of the kind of change: "Changed", "Reset all values", "Reverted the change of 28 Sep 2026, 16:40". */
function useActionText() {
  const intl = useIntl();
  const { history } = useSavedTokens();
  return (entry) => {
    switch (entry.action) {
      case 'reset': return intl.formatMessage(m.actionReset);
      case 'reset-all': return intl.formatMessage(m.actionResetAll);
      case 'import': return entry.source
        ? intl.formatMessage(m.actionImport, { file: entry.source }) : intl.formatMessage(m.actionImportUnknown);
      case 'revert': {
        const original = history.find((e) => e.id === entry.revertOf);
        return original
          ? intl.formatMessage(m.actionRevert, { time: formatTime(intl, original.time) })
          : intl.formatMessage(m.actionRevertUnknown);
      }
      default: return intl.formatMessage(m.actionSave);
    }
  };
}

function Entry({
  entry, changes, labelOf, scopeName, base, onRevert, showLabels,
}) {
  const intl = useIntl();
  const { saved } = useSavedTokens();
  const actionText = useActionText();
  const [expanded, setExpanded] = useState(false);
  const time = formatTime(intl, entry.time);
  const reverted = changes.every((c) => (saved[c.name] ?? null) === c.from);
  const shown = expanded ? changes : changes.slice(0, COLLAPSED);
  return (
    <li className="preview-history-entry">
      <div className="preview-history-entry-header">
        <div>
          <strong>{actionText(entry)}</strong>
          <div className="small text-muted">
            <time dateTime={entry.time}>{time}</time>
            {scopeName && <> · {scopeName(entry.scopeId)}</>}
            {showLabels && <> · {intl.formatMessage(m.changeCount, { count: changes.length })}</>}
          </div>
        </div>
        {reverted ? (
          <span className="small text-muted preview-history-reverted">{intl.formatMessage(m.alreadyReverted)}</span>
        ) : (
          <Button
            size="sm" variant="outline-primary" iconBefore={Undo} onClick={() => onRevert(entry, changes)}
            aria-label={intl.formatMessage(m.revertAria, { time })}
          >
            {intl.formatMessage(m.revert)}
          </Button>
        )}
      </div>
      <ul className="preview-history-changes">
        {shown.map((c) => (
          <li key={c.name}>
            {showLabels && <span className="preview-history-label">{labelOf(c.name, entry)}</span>}
            <span>
              {intl.formatMessage(m.changeArrow, {
                from: <Value key="from" value={c.from} base={base[c.name]} />,
                to: <Value key="to" value={c.to} base={base[c.name]} />,
              })}
            </span>
          </li>
        ))}
      </ul>
      {changes.length > COLLAPSED && !expanded && (
        <Button variant="link" size="sm" className="px-0" onClick={() => setExpanded(true)}>
          {intl.formatMessage(m.showAll, { count: changes.length })}
        </Button>
      )}
    </li>
  );
}

/**
 * History entries, newest first. `names` limits the list to entries that changed one of these tokens, and each
 * entry to those tokens (a component or a single token); without it every change is listed.
 * onRevert(entry, changes) reverts the listed changes of one entry.
 */
export function HistoryList({
  names, labelOf, scopeName, onRevert, showLabels = true,
}) {
  const intl = useIntl();
  const { history, version } = useSavedTokens();
  const items = useMemo(() => {
    const only = names ? new Set(names) : null;
    return history
      .map((entry) => ({ entry, changes: only ? entry.changes.filter((c) => only.has(c.name)) : entry.changes }))
      .filter((item) => item.changes.length)
      .reverse();
  }, [history, names]);
  const base = useMemo(
    () => readBaseValues([...new Set(items.flatMap((i) => i.changes.map((c) => c.name)))]),
    [items, version], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!items.length) { return <p className="text-muted mb-0">{intl.formatMessage(m.historyEmpty)}</p>; }
  return (
    <ol className="preview-history">
      {items.map(({ entry, changes }) => (
        <Entry
          key={entry.id} entry={entry} changes={changes} labelOf={labelOf} scopeName={scopeName} base={base}
          onRevert={onRevert} showLabels={showLabels}
        />
      ))}
    </ol>
  );
}

/** Number of history entries that changed one of `names` (all entries without `names`). */
export function useHistoryCount(names) {
  const { history } = useSavedTokens();
  return useMemo(() => {
    if (!names) { return history.length; }
    const only = new Set(names);
    return history.filter((e) => e.changes.some((c) => only.has(c.name))).length;
  }, [history, names]);
}

export function HistoryDialog({
  title, names, labelOf, scopeName, onRevert, onClose,
}) {
  const intl = useIntl();
  return (
    <ModalDialog title={title} isOpen onClose={onClose} size="lg" hasCloseButton isFullscreenOnMobile className="preview-dialog">
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
        <p className="small text-muted mb-0">{intl.formatMessage(m.historyIntro, { mode: modeName(intl) })}</p>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <HistoryList names={names} labelOf={labelOf} scopeName={scopeName} onRevert={onRevert} />
      </ModalDialog.Body>
      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary">{intl.formatMessage(m.close)}</ModalDialog.CloseButton>
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
}