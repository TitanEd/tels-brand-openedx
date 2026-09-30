/* Confirmations and error messages as Paragon dialogs, one at a time, in the order they were asked for. */
import React, {
  createContext, useCallback, useContext, useMemo, useRef, useState,
} from 'react';
import { useIntl } from 'react-intl';
import { ActionRow, AlertModal, Button } from '@openedx/paragon';
import { Error as ErrorIcon, Warning } from '@openedx/paragon/icons';
import m from './dialogs.messages';

const DialogsContext = createContext({ confirm: async () => false, notify: async () => {} });

/**
 * confirm({ title, text, confirmLabel, danger }) resolves to true when the user confirms, false otherwise.
 * notify({ title, text }) shows an error message and resolves when it is closed (title defaults to a generic one).
 */
export const useDialogs = () => useContext(DialogsContext);

export function DialogsProvider({ children }) {
  const intl = useIntl();
  const [queue, setQueue] = useState([]);
  const nextId = useRef(0);
  const open = useCallback((dialog) => new Promise((resolve) => {
    nextId.current += 1;
    const id = nextId.current;
    setQueue((q) => [...q, { ...dialog, id, resolve }]);
  }), []);
  const api = useMemo(() => ({
    confirm: (options) => open({ kind: 'confirm', ...options }),
    notify: (options) => open({ kind: 'notice', ...options }).then(() => undefined),
  }), [open]);

  const current = queue[0];
  const close = (result) => {
    current.resolve(result);
    setQueue((q) => q.slice(1));
  };
  let footer = null;
  if (current) {
    footer = current.kind === 'confirm' ? (
      <ActionRow>
        <Button variant="tertiary" onClick={() => close(false)}>{intl.formatMessage(m.cancel)}</Button>
        <Button variant={current.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{current.confirmLabel}</Button>
      </ActionRow>
    ) : (
      <ActionRow>
        <Button onClick={() => close(false)}>{intl.formatMessage(m.ok)}</Button>
      </ActionRow>
    );
  }
  const notice = current?.kind === 'notice';
  return (
    <DialogsContext.Provider value={api}>
      {children}
      {current && (
        <AlertModal
          key={current.id} isOpen title={current.title || intl.formatMessage(m.errorTitle)} onClose={() => close(false)}
          variant={notice || current.danger ? 'danger' : 'warning'} icon={notice ? ErrorIcon : Warning}
          footerNode={footer} className="preview-alert-modal"
        >
          <p className="mb-0">{current.text}</p>
        </AlertModal>
      )}
    </DialogsContext.Provider>
  );
}
