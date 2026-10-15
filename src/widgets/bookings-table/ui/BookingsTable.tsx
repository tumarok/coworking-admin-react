import { Column } from 'primereact/column';
import { Link } from 'react-router';

import { BookingStatusActions } from '@/features/booking-status';
import { BookingStatusTag } from '@/entities/booking';
import type { Booking, Page } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatMoney, formatTimeRange } from '@/shared/lib';
import { EntityTable } from '@/shared/ui';

interface Props {
  data: Page<Booking> | undefined;
  page: number;
  limit: number;
  loading: boolean;
  onPage: (page: number, limit: number) => void;
  hideRoom?: boolean;
  hideMember?: boolean;
  /** Status buttons (confirm, check in, …) in each row. */
  showActions?: boolean;
  /** Turns on row checkboxes for bulk actions. */
  selection?: Booking[];
  onSelectionChange?: (rows: Booking[]) => void;
  emptyMessage?: string;
}

export const BookingsTable = ({
  data,
  page,
  limit,
  loading,
  onPage,
  hideRoom,
  hideMember,
  showActions,
  selection,
  onSelectionChange,
  emptyMessage = 'No bookings match the current filters.',
}: Props) => (
  <EntityTable
    caption="Bookings"
    items={data?.items ?? []}
    total={data?.total ?? 0}
    page={page}
    limit={limit}
    loading={loading}
    onPage={onPage}
    selection={selection}
    onSelectionChange={onSelectionChange}
    emptyMessage={emptyMessage}
  >
    {selection ? <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> : null}
    <Column
      header="When"
      body={(b: Booking) => (
        <Link to={ROUTES.booking(b.id)}>{formatTimeRange(b.startsAt, b.endsAt)}</Link>
      )}
    />
    {hideRoom ? null : (
      <Column
        header="Room"
        body={(b: Booking) => (
          <>
            <Link to={ROUTES.room(b.roomId)}>{b.roomName}</Link>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.locationName}</div>
          </>
        )}
      />
    )}
    {hideMember ? null : (
      <Column
        header="Member"
        body={(b: Booking) => <Link to={ROUTES.member(b.memberId)}>{b.memberName}</Link>}
      />
    )}
    <Column field="attendees" header="People" />
    <Column header="Price" body={(b: Booking) => formatMoney(b.totalPrice)} />
    <Column header="Status" body={(b: Booking) => <BookingStatusTag status={b.status} />} />
    {showActions ? (
      <Column
        header="Actions"
        body={(b: Booking) => <BookingStatusActions booking={b} compact />}
        style={{ whiteSpace: 'nowrap' }}
      />
    ) : null}
  </EntityTable>
);
