import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { RoomFormDialog } from '@/features/room-upsert';
import {
  AmenityList,
  RoomStatusTag,
  useDeleteRoomMutation,
  useGetRoomQuery,
} from '@/entities/room';
import { errorMessage, errorStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatMoney, humanize, notify } from '@/shared/lib';
import { DeleteButton, DetailsList, EmptyState, PageHeader, PageLoader } from '@/shared/ui';

export const RoomDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: room, isLoading, error } = useGetRoomQuery(id);
  const [remove] = useDeleteRoomMutation();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

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
      <RoomFormDialog room={room} visible={editing} onHide={() => setEditing(false)} />
    </>
  );
};
