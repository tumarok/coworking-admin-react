import { Button, type ButtonProps } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { useState } from 'react';

import { useChangeBookingStatusMutation } from '@/entities/booking';
import { BOOKING_TRANSITIONS, type Booking, type BookingStatus } from '@/shared/api';
import { humanize, notify } from '@/shared/lib';

const ACTIONS: Partial<Record<BookingStatus, { label: string; icon: string } & ButtonProps>> = {
  confirmed: { label: 'Confirm', icon: 'pi pi-check' },
  checked_in: { label: 'Check in', icon: 'pi pi-sign-in' },
  completed: { label: 'Complete', icon: 'pi pi-flag' },
  no_show: { label: 'No-show', icon: 'pi pi-user-minus', severity: 'warning', outlined: true },
  cancelled: { label: 'Cancel booking', icon: 'pi pi-times', severity: 'danger', outlined: true },
};

interface Props {
  booking: Booking;
  /** Icon-only buttons for table rows. */
  compact?: boolean;
}

/** One button per status the booking may move to next; nothing for finished bookings. */
export const BookingStatusActions = ({ booking, compact = false }: Props) => {
  const [changeStatus] = useChangeBookingStatusMutation();
  const [pending, setPending] = useState<BookingStatus | null>(null);

  const apply = async (status: BookingStatus) => {
    setPending(status);
    try {
      await changeStatus({ id: booking.id, status }).unwrap();
      notify.success(`Booking ${humanize(status).toLowerCase()}`);
    } catch {
      // the global toast explains why the transition was refused
    } finally {
      setPending(null);
    }
  };

  const onClick = (status: BookingStatus) =>
    status === 'cancelled'
      ? confirmDialog({
          header: 'Cancel this booking?',
          message: 'The room becomes available for this time again.',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Cancel booking',
          rejectLabel: 'Keep',
          acceptClassName: 'p-button-danger',
          defaultFocus: 'reject',
          accept: () => apply(status),
        })
      : apply(status);

  return (
    <>
      {BOOKING_TRANSITIONS[booking.status].map((status) => {
        const action = ACTIONS[status];
        if (!action) return null;
        const { label, ...rest } = action;
        return (
          <Button
            key={status}
            {...rest}
            {...(compact
              ? {
                  'aria-label': label,
                  tooltip: label,
                  rounded: true,
                  text: true,
                  size: 'small' as const,
                }
              : { label })}
            loading={pending === status}
            disabled={pending !== null && pending !== status}
            onClick={() => onClick(status)}
          />
        );
      })}
    </>
  );
};
