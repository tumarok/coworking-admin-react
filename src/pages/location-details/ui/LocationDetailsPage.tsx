import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { LocationFormDialog } from '@/features/location-upsert';
import {
  LocationStatusTag,
  useDeleteLocationMutation,
  useGetLocationQuery,
} from '@/entities/location';
import { errorMessage, errorStatus } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { notify } from '@/shared/lib';
import { DeleteButton, DetailsList, EmptyState, PageHeader, PageLoader } from '@/shared/ui';

export const LocationDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: location, isLoading, error } = useGetLocationQuery(id);
  const [remove] = useDeleteLocationMutation();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  if (isLoading) return <PageLoader />;
  if (!location) {
    return (
      <EmptyState
        icon="pi pi-map-marker"
        title={errorStatus(error) === 404 ? 'Location not found' : 'Could not load the location'}
      >
        <p>{errorStatus(error) === 404 ? 'It may have been deleted.' : errorMessage(error)}</p>
        <Link to={ROUTES.locations}>All locations</Link>
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader
        back={{ to: ROUTES.locations, label: 'Locations' }}
        title={location.name}
        subtitle={`${location.address}, ${location.city}`}
        actions={
          <>
            <Button label="Edit" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
            <DeleteButton
              subject={location.name}
              onConfirm={async () => {
                await remove(location.id).unwrap();
                notify.success('Location deleted', location.name);
                navigate(ROUTES.locations, { replace: true });
              }}
            />
          </>
        }
      />
      <section className="card">
        <DetailsList
          items={[
            { label: 'Status', value: <LocationStatusTag status={location.status} /> },
            { label: 'City', value: location.city },
            { label: 'Address', value: location.address },
            { label: 'Time zone', value: location.timezone },
            { label: 'Opening hours', value: `${location.opensAt}–${location.closesAt}` },
            { label: 'Rooms', value: location.roomCount },
          ]}
        />
      </section>
      <LocationFormDialog location={location} visible={editing} onHide={() => setEditing(false)} />
    </>
  );
};
