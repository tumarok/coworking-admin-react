import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import type { ReactNode } from 'react';

interface Props {
  header: string;
  visible: boolean;
  onHide: () => void;
  /** id of the <form> inside, so the footer button can submit it. */
  formId: string;
  submitting: boolean;
  /** A problem that does not belong to a single field. */
  banner?: ReactNode;
  submitLabel?: string;
  width?: string;
  children: ReactNode;
}

export const FormDialog = ({
  header,
  visible,
  onHide,
  formId,
  submitting,
  banner,
  submitLabel = 'Save',
  width = '40rem',
  children,
}: Props) => (
  <Dialog
    header={header}
    visible={visible}
    onHide={onHide}
    style={{ width }}
    breakpoints={{ '640px': '95vw' }}
    draggable={false}
    footer={
      <>
        <Button label="Cancel" text onClick={onHide} disabled={submitting} />
        <Button type="submit" form={formId} label={submitLabel} loading={submitting} />
      </>
    }
  >
    {banner ? (
      <Message severity="error" content={banner} style={{ width: '100%', marginBottom: '1rem' }} />
    ) : null}
    {children}
  </Dialog>
);
