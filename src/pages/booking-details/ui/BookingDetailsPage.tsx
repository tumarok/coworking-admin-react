import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { BookingStatusActions } from '@/features/booking-status';
import { BookingFormDialog } from '@/features/booking-upsert';
import { BookingStatusTag, useGetBookingQuery } from '@/entities/booking';
import { errorMessage, errorStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { durationHours, formatDateTime, formatMoney, formatTimeRange } from '@/shared/lib';
import { DetailsList, EmptyState, PageHeader, PageLoader } from '@/shared/ui';

export const BookingDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: booking, isLoading, error } = useGetBookingQuery(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!booking) {
    return (
      <EmptyState
        icon="pi pi-calendar"
        title={errorStatus(error) === 404 ? 'Booking not found' : 'Could not load the booking'}
      >
        <p>{errorStatus(error) === 404 ? 'Check the link and try again.' : errorMessage(error)}</p>
        <Link to={ROUTES.bookings}>All bookings</Link>
      </EmptyState>
    );
  }

  const editable = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <>
      <PageHeader
        back={{ to: ROUTES.bookings, label: 'Bookings' }}
        title={`${booking.roomName}, ${formatTimeRange(booking.startsAt, booking.endsAt)}`}
        subtitle={<BookingStatusTag status={booking.status} />}
        actions={
          <>
            <BookingStatusActions booking={booking} />
            {editable ? (
              <Button label="Edit" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
            ) : null}
          </>
        }
      />
      <section className="card">
        <DetailsList
          items={[
            {
              label: 'Room',
              value: <Link to={ROUTES.room(booking.roomId)}>{booking.roomName}</Link>,
            },
            {
              label: 'Location',
              value: <Link to={ROUTES.location(booking.locationId)}>{booking.locationName}</Link>,
            },
            {
              label: 'Member',
              value: <Link to={ROUTES.member(booking.memberId)}>{booking.memberName}</Link>,
            },
            { label: 'Starts', value: formatDateTime(booking.startsAt) },
            { label: 'Ends', value: formatDateTime(booking.endsAt) },
            { label: 'Duration', value: `${durationHours(booking.startsAt, booking.endsAt)} h` },
            { label: 'Attendees', value: booking.attendees },
            { label: 'Price', value: formatMoney(booking.totalPrice) },
            { label: 'Created', value: formatDateTime(booking.createdAt) },
            { label: 'Notes', value: booking.notes ?? '—' },
          ]}
        />
      </section>
      <BookingFormDialog booking={booking} visible={editing} onHide={() => setEditing(false)} />
    </>
  );
};
