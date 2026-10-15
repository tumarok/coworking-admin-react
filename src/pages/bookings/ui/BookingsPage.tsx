import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { BookingsTable } from '@/widgets/bookings-table';
import { BookingFormDialog } from '@/features/booking-upsert';
import { useGetBookingsQuery } from '@/entities/booking';
import { useGetLocationsQuery } from '@/entities/location';
import { BOOKING_STATUSES, type BookingListQuery } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { enumOptions, useListParams } from '@/shared/lib';
import { ListToolbar, PageHeader } from '@/shared/ui';

const FILTERS = ['from', 'to', 'status', 'locationId'] as const;
const LOCATIONS_ARG = { limit: 100 } as const;

export const BookingsPage = () => {
  const list = useListParams(FILTERS);
  const { data, isFetching } = useGetBookingsQuery(list.query as BookingListQuery);
  const { data: locations } = useGetLocationsQuery(LOCATIONS_ARG);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { from, to, status, locationId } = list.filters;

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Who uses which room, and when"
        actions={<Button label="New booking" icon="pi pi-plus" onClick={() => setCreating(true)} />}
      />
      <ListToolbar
        search={list.q}
        onSearch={list.setSearch}
        searchPlaceholder="Search member or room"
        onReset={list.reset}
        canReset={Boolean(list.q || from || to || status || locationId)}
      >
        <InputText
          type="date"
          value={from}
          onChange={(e) => list.setFilter('from', e.target.value || null)}
          aria-label="From date"
        />
        <InputText
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => list.setFilter('to', e.target.value || null)}
          aria-label="To date"
        />
        <Dropdown
          value={status || null}
          options={enumOptions(BOOKING_STATUSES)}
          onChange={(e) => list.setFilter('status', e.value ?? null)}
          placeholder="Any status"
          showClear
          aria-label="Status"
        />
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
      </ListToolbar>
      <BookingsTable
        showActions
        data={data}
        page={list.page}
        limit={list.limit}
        loading={isFetching}
        onPage={(page, limit) => (limit !== list.limit ? list.setLimit(limit) : list.setPage(page))}
      />
      <BookingFormDialog
        visible={creating}
        onHide={() => setCreating(false)}
        onSaved={(b) => navigate(ROUTES.booking(b.id))}
      />
    </>
  );
};
