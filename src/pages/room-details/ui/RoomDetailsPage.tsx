import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { BookingsTable } from '@/widgets/bookings-table';
import { BookingFormDialog } from '@/features/booking-upsert';
import { RoomFormDialog } from '@/features/room-upsert';
import {
  AmenityList,
  RoomStatusTag,
  useDeleteRoomMutation,
  useGetRoomQuery,
} from '@/entities/room';
import { useGetBookingsQuery } from '@/entities/booking';
import { errorMessage, errorStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatMoney, humanize, notify, useListParams } from '@/shared/lib';
import { DeleteButton, DetailsList, EmptyState, PageHeader, PageLoader } from '@/shared/ui';

const todayIso = () => new Date().toISOString().slice(0, 10);

export const RoomDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: room, isLoading, error } = useGetRoomQuery(id);
  const [remove] = useDeleteRoomMutation();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const bookings = useListParams();
  const { data: bookingPage, isFetching: bookingsLoading } = useGetBookingsQuery(
    { ...bookings.query, roomId: id, from: todayIso() },
    { skip: !id },
  );

  if (isLoading) return <PageLoader />;
  if (!room) {
    return (
      <EmptyState
        icon="pi pi-th-large"
        title={errorStatus(error) === 404 ? 'Room not found' : 'Could not load the room'}
      >
        <p>{errorStatus(error) === 404 ? 'It may have been deleted.' : errorMessage(error)}</p>
        <Link to={ROUTES.rooms}>All rooms</Link>
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader
        back={{ to: ROUTES.rooms, label: 'Rooms' }}
        title={room.name}
        subtitle={
          <>
            {humanize(room.type)} at{' '}
            <Link to={ROUTES.location(room.locationId)}>{room.locationName}</Link>
          </>
        }
        actions={
          <>
            <Button label="Edit" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
            <DeleteButton
              subject={room.name}
              onConfirm={async () => {
                await remove({ id: room.id, locationId: room.locationId }).unwrap();
                notify.success('Room deleted', room.name);
                navigate(ROUTES.rooms, { replace: true });
              }}
            />
          </>
        }
      />
      <section className="card">
        <DetailsList
          items={[
            { label: 'Status', value: <RoomStatusTag status={room.status} /> },
            { label: 'Type', value: humanize(room.type) },
            { label: 'Capacity', value: `${room.capacity} seats` },
            { label: 'Rate', value: `${formatMoney(room.hourlyRate)} / hour` },
            { label: 'Amenities', value: <AmenityList amenities={room.amenities} /> },
          ]}
        />
      </section>
      <div
        className="actions-row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 className="section-title">Upcoming bookings</h2>
        <Button
          label="Book this room"
          icon="pi pi-calendar-plus"
          text
          onClick={() => setBooking(true)}
        />
      </div>
      <BookingsTable
        showActions
        data={bookingPage}
        page={bookings.page}
        limit={bookings.limit}
        loading={bookingsLoading}
        onPage={(page, limit) =>
          limit !== bookings.limit ? bookings.setLimit(limit) : bookings.setPage(page)
        }
        hideRoom
        emptyMessage="No bookings yet."
      />
      <RoomFormDialog room={room} visible={editing} onHide={() => setEditing(false)} />
      <BookingFormDialog
        defaults={{ roomId: id }}
        visible={booking}
        onHide={() => setBooking(false)}
      />
    </>
  );
};
