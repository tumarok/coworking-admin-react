import { Column } from 'primereact/column';
import { Link } from 'react-router';

import { RoomStatusTag } from '@/entities/room';
import type { Page, Room } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatMoney, humanize } from '@/shared/lib';
import { EntityTable } from '@/shared/ui';

interface Props {
  data: Page<Room> | undefined;
  page: number;
  limit: number;
  loading: boolean;
  onPage: (page: number, limit: number) => void;
  /** Hide the location column when the table already lives on a location page. */
  hideLocation?: boolean;
}

export const RoomsTable = ({ data, page, limit, loading, onPage, hideLocation }: Props) => (
  <EntityTable
    caption="Rooms"
    items={data?.items ?? []}
    total={data?.total ?? 0}
    page={page}
    limit={limit}
    loading={loading}
    onPage={onPage}
    emptyMessage="No rooms match the current filters."
  >
    <Column header="Name" body={(r: Room) => <Link to={ROUTES.room(r.id)}>{r.name}</Link>} />
    {hideLocation ? null : (
      <Column
        header="Location"
        body={(r: Room) => <Link to={ROUTES.location(r.locationId)}>{r.locationName}</Link>}
      />
    )}
    <Column header="Type" body={(r: Room) => humanize(r.type)} />
    <Column field="capacity" header="Seats" />
    <Column header="Rate / hour" body={(r: Room) => formatMoney(r.hourlyRate)} />
    <Column header="Status" body={(r: Room) => <RoomStatusTag status={r.status} />} />
  </EntityTable>
);
