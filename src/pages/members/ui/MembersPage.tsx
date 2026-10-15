import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { MemberFormDialog } from '@/features/member-upsert';
import { MemberStatusTag, useGetMembersQuery } from '@/entities/member';
import {
  MEMBER_PLANS,
  MEMBER_STATUSES,
  type Member,
  type MemberListQuery,
  memberFullName,
} from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { enumOptions, formatDate, humanize, useListParams } from '@/shared/lib';
import { EntityTable, ListToolbar, PageHeader } from '@/shared/ui';

const FILTERS = ['plan', 'status'] as const;

export const MembersPage = () => {
  const list = useListParams(FILTERS);
  const { data, isFetching } = useGetMembersQuery(list.query as MemberListQuery);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { plan, status } = list.filters;

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="People and teams with a plan"
        actions={<Button label="New member" icon="pi pi-plus" onClick={() => setCreating(true)} />}
      />
      <ListToolbar
        search={list.q}
        onSearch={list.setSearch}
        searchPlaceholder="Search name, email or company"
        onReset={list.reset}
        canReset={Boolean(list.q || plan || status)}
      >
        <Dropdown
          value={plan || null}
          options={enumOptions(MEMBER_PLANS)}
          onChange={(e) => list.setFilter('plan', e.value ?? null)}
          placeholder="Any plan"
          showClear
          aria-label="Plan"
        />
        <Dropdown
          value={status || null}
          options={enumOptions(MEMBER_STATUSES)}
          onChange={(e) => list.setFilter('status', e.value ?? null)}
          placeholder="Any status"
          showClear
          aria-label="Status"
        />
      </ListToolbar>
      <EntityTable
        caption="Members"
        items={data?.items ?? []}
        total={data?.total ?? 0}
        page={list.page}
        limit={list.limit}
        loading={isFetching}
        onPage={(page, limit) => (limit !== list.limit ? list.setLimit(limit) : list.setPage(page))}
      >
        <Column
          header="Name"
          body={(m: Member) => <Link to={ROUTES.member(m.id)}>{memberFullName(m)}</Link>}
        />
        <Column field="email" header="Email" />
        <Column header="Company" body={(m: Member) => m.company ?? '—'} />
        <Column header="Plan" body={(m: Member) => humanize(m.plan)} />
        <Column header="Member since" body={(m: Member) => formatDate(m.joinedAt)} />
        <Column header="Status" body={(m: Member) => <MemberStatusTag status={m.status} />} />
      </EntityTable>
      <MemberFormDialog
        visible={creating}
        onHide={() => setCreating(false)}
        onSaved={(m) => navigate(ROUTES.member(m.id))}
      />
    </>
  );
};
