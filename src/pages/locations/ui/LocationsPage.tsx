import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { LocationFormDialog } from '@/features/location-upsert';
import { LocationStatusTag, useGetLocationsQuery } from '@/entities/location';
import { LOCATION_STATUSES, type Location, type LocationListQuery } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { enumOptions, useListParams } from '@/shared/lib';
import { EntityTable, ListToolbar, PageHeader } from '@/shared/ui';

const FILTERS = ['status'] as const;
const STATUS_OPTIONS = enumOptions(LOCATION_STATUSES);

export const LocationsPage = () => {
  const list = useListParams(FILTERS);
  const { data, isFetching } = useGetLocationsQuery(list.query as LocationListQuery);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Locations"
        subtitle="Spaces in the network and their opening hours"
        actions={
          <Button label="New location" icon="pi pi-plus" onClick={() => setCreating(true)} />
        }
      />
      <ListToolbar
        search={list.q}
        onSearch={list.setSearch}
        searchPlaceholder="Search name, city or address"
        onReset={list.reset}
        canReset={Boolean(list.q || list.filters.status)}
      >
        <Dropdown
          value={list.filters.status || null}
          options={STATUS_OPTIONS}
          onChange={(e) => list.setFilter('status', e.value ?? null)}
          placeholder="Any status"
          showClear
          aria-label="Status"
        />
      </ListToolbar>
      <EntityTable
        caption="Locations"
        items={data?.items ?? []}
        total={data?.total ?? 0}
        page={list.page}
        limit={list.limit}
        loading={isFetching}
        onPage={(page, limit) => (limit !== list.limit ? list.setLimit(limit) : list.setPage(page))}
      >
        <Column
          header="Name"
          body={(l: Location) => <Link to={ROUTES.location(l.id)}>{l.name}</Link>}
        />
        <Column field="city" header="City" />
        <Column field="address" header="Address" />
        <Column header="Hours" body={(l: Location) => `${l.opensAt}–${l.closesAt}`} />
        <Column field="roomCount" header="Rooms" />
        <Column header="Status" body={(l: Location) => <LocationStatusTag status={l.status} />} />
      </EntityTable>
      <LocationFormDialog
        visible={creating}
        onHide={() => setCreating(false)}
        onSaved={(l) => navigate(ROUTES.location(l.id))}
      />
    </>
  );
};
