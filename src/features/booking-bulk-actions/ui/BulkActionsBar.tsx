import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';
import { Link } from 'react-router';

import { useBulkUpdateBookingsMutation } from '@/entities/booking';
import type { Booking, BulkBookingAction, BulkBookingResult } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatTimeRange, notify } from '@/shared/lib';

const PAST: Record<BulkBookingAction, string> = { confirm: 'confirmed', cancel: 'cancelled' };

const plural = (n: number) => `${n} booking${n === 1 ? '' : 's'}`;

interface Props {
  selected: Booking[];
  /** Called after the request, so the page can clear its selection. */
  onDone: () => void;
}

/**
 * Confirms or cancels many bookings at once. The server applies what it can and explains every
 * booking it refused, so a partial success is reported item by item.
 */
export const BulkActionsBar = ({ selected, onDone }: Props) => {
  const [bulkUpdate, { isLoading }] = useBulkUpdateBookingsMutation();
  const [report, setReport] = useState<{ action: BulkBookingAction; result: BulkBookingResult }>();

  const run = async (action: BulkBookingAction) => {
    try {
      const result = await bulkUpdate({ ids: selected.map((b) => b.id), action }).unwrap();
      if (result.updated.length > 0) {
        notify.success(`${plural(result.updated.length)} ${PAST[action]}`);
      }
      if (result.failed.length > 0) setReport({ action, result });
      onDone();
    } catch {
      // the global toast explains the failure
    }
  };

  const cancel = () =>
    confirmDialog({
      header: `Cancel ${plural(selected.length)}?`,
      message: 'The rooms become available for these times again.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancel bookings',
      rejectLabel: 'Keep',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: () => run('cancel'),
    });

  const byId = new Map(selected.map((b) => [b.id, b]));

  return (
    <>
      <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>
        {selected.length} selected
      </span>
      <Button
        label="Confirm"
        icon="pi pi-check"
        loading={isLoading}
        onClick={() => run('confirm')}
      />
      <Button
        label="Cancel"
        icon="pi pi-times"
        severity="danger"
        outlined
        disabled={isLoading}
        onClick={cancel}
      />
      <Dialog
        header={report ? `Some bookings were not ${PAST[report.action]}` : ''}
        visible={Boolean(report)}
        onHide={() => setReport(undefined)}
        style={{ width: '34rem' }}
        breakpoints={{ '640px': '95vw' }}
      >
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
          {report?.result.failed.map(({ id, reason }) => {
            const booking = byId.get(id);
            return (
              <li key={id}>
                <Link to={ROUTES.booking(id)}>
                  {booking
                    ? `${booking.roomName}, ${formatTimeRange(booking.startsAt, booking.endsAt)}`
                    : id}
                </Link>
                <div>{reason}</div>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </>
  );
};
