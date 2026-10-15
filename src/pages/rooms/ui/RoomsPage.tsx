import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { RoomsTable } from '@/widgets/rooms-table';
import { RoomFormDialog } from '@/features/room-upsert';
import { useGetLocationsQuery } from '@/entities/location';
import { useGetRoomsQuery } from '@/entities/room';
import { ROOM_STATUSES, ROOM_TYPES, type RoomListQuery } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { enumOptions, useListParams } from '@/shared/lib';
import { ListToolbar, PageHeader } from '@/shared/ui';

const FILTERS = ['locationId', 'type', 'status'] as const;
const LOCATIONS_ARG = { limit: 100 } as const;

export const RoomsPage = () => {
  const list = useListParams(FILTERS);
  const { data, isFetching } = useGetRoomsQuery(list.query as RoomListQuery);
  const { data: locations } = useGetLocationsQuery(LOCATIONS_ARG);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { locationId, type, status } = list.filters;

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Meeting rooms, offices, desks and event spaces"
        actions={<Button label="New room" icon="pi pi-plus" onClick={() => setCreating(true)} />}
      />
      <ListToolbar
        search={list.q}
        onSearch={list.setSearch}
        searchPlaceholder="Search rooms"
        onReset={list.reset}
        canReset={Boolean(list.q || locationId || type || status)}
      >
        <Dropdown
          value={locationId || null}
          options={locations?.items ?? []}
          optionLabel="name"
          optionValue="id"
          onChange={(e) => list.setFilter('locationId', e.value ?? null)}
          placeholder="Any location"
          showClear
          aria-label="Location"
        />
        <Dropdown
          value={type || null}
          options={enumOptions(ROOM_TYPES)}
          onChange={(e) => list.setFilter('type', e.value ?? null)}
          placeholder="Any type"
          showClear
          aria-label="Type"
        />
        <Dropdown
          value={status || null}
          options={enumOptions(ROOM_STATUSES)}
          onChange={(e) => list.setFilter('status', e.value ?? null)}
          placeholder="Any status"
          showClear
          aria-label="Status"
        />
      </ListToolbar>
      <RoomsTable
        data={data}
        page={list.page}
        limit={list.limit}
        loading={isFetching}
        onPage={(page, limit) => (limit !== list.limit ? list.setLimit(limit) : list.setPage(page))}
      />
      <RoomFormDialog
        visible={creating}
        onHide={() => setCreating(false)}
        onSaved={(room) => navigate(ROUTES.room(room.id))}
      />
    </>
  );
};
