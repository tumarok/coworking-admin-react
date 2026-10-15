import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { BookingsTable } from '@/widgets/bookings-table';
import { BookingFormDialog } from '@/features/booking-upsert';
import { MemberFormDialog } from '@/features/member-upsert';
import { MemberStatusTag, useDeleteMemberMutation, useGetMemberQuery } from '@/entities/member';
import { useGetBookingsQuery } from '@/entities/booking';
import { errorMessage, errorStatus, memberFullName } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatDate, humanize, notify, useListParams } from '@/shared/lib';
import { DeleteButton, DetailsList, EmptyState, PageHeader, PageLoader } from '@/shared/ui';

export const MemberDetailsPage = () => {
  const { id = '' } = useParams();
  const { data: member, isLoading, error } = useGetMemberQuery(id);
  const [remove] = useDeleteMemberMutation();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);
  const bookings = useListParams();
  const { data: bookingPage, isFetching: bookingsLoading } = useGetBookingsQuery(
    { ...bookings.query, memberId: id },
    { skip: !id },
  );

  if (isLoading) return <PageLoader />;
  if (!member) {
    return (
      <EmptyState
        icon="pi pi-user"
        title={errorStatus(error) === 404 ? 'Member not found' : 'Could not load the member'}
      >
        <p>{errorStatus(error) === 404 ? 'They may have been removed.' : errorMessage(error)}</p>
        <Link to={ROUTES.members}>All members</Link>
      </EmptyState>
    );
  }

  const name = memberFullName(member);

  return (
    <>
      <PageHeader
        back={{ to: ROUTES.members, label: 'Members' }}
        title={name}
        subtitle={member.company ?? undefined}
        actions={
          <>
            <Button label="Edit" icon="pi pi-pencil" outlined onClick={() => setEditing(true)} />
            <DeleteButton
              subject={name}
              onConfirm={async () => {
                await remove(member.id).unwrap();
                notify.success('Member removed', name);
                navigate(ROUTES.members, { replace: true });
              }}
            />
          </>
        }
      />
      <section className="card">
        <DetailsList
          items={[
            { label: 'Status', value: <MemberStatusTag status={member.status} /> },
            { label: 'Plan', value: humanize(member.plan) },
            { label: 'Email', value: <a href={`mailto:${member.email}`}>{member.email}</a> },
            { label: 'Phone', value: member.phone },
            { label: 'Company', value: member.company ?? '—' },
            { label: 'Member since', value: formatDate(member.joinedAt) },
          ]}
        />
      </section>
      <div
        className="actions-row"
        style={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2 className="section-title">Bookings</h2>
        <Button
          label="New booking"
          icon="pi pi-calendar-plus"
          text
          onClick={() => setBooking(true)}
        />
      </div>
      <BookingsTable
        data={bookingPage}
        page={bookings.page}
        limit={bookings.limit}
        loading={bookingsLoading}
        onPage={(page, limit) =>
          limit !== bookings.limit ? bookings.setLimit(limit) : bookings.setPage(page)
        }
        hideMember
        emptyMessage="No bookings yet."
      />
      <MemberFormDialog member={member} visible={editing} onHide={() => setEditing(false)} />
      <BookingFormDialog
        defaults={{ memberId: id }}
        visible={booking}
        onHide={() => setBooking(false)}
      />
    </>
  );
};
