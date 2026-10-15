import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { useState } from 'react';

interface Props {
  /** What is being deleted, used in the confirmation: "Delete Riverside Hub?" */
  subject: string;
  /** Resolves when deleted; a rejection keeps the user on the page (the toast explains why). */
  onConfirm: () => Promise<void>;
  label?: string;
}

/** Asks before deleting; needs a single <ConfirmDialog /> mounted in the app. */
export const DeleteButton = ({ subject, onConfirm, label = 'Delete' }: Props) => {
  const [busy, setBusy] = useState(false);

  const ask = () =>
    confirmDialog({
      header: `Delete ${subject}?`,
      message: 'This cannot be undone.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Keep',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: async () => {
        setBusy(true);
        try {
          await onConfirm();
        } catch {
          // the global toast has already explained the failure
        } finally {
          setBusy(false);
        }
      },
    });

  return (
    <Button
      label={label}
      icon="pi pi-trash"
      severity="danger"
      outlined
      loading={busy}
      onClick={ask}
    />
  );
};
