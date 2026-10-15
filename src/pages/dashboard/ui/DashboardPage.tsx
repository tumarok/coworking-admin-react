import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import { Link, useSearchParams } from 'react-router';

import { BookingStatusTag } from '@/entities/booking';
import { BOOKING_STATUSES, errorMessage } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { formatDate, formatMoney, formatTimeRange } from '@/shared/lib';
import { EmptyState, PageHeader, PageLoader } from '@/shared/ui';

import { useGetDashboardQuery } from '../api/dashboard-api';

import styles from './DashboardPage.module.scss';

const todayIso = () => new Date().toISOString().slice(0, 10);

export const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') ?? todayIso();
  const { data, isLoading, isFetching, error } = useGetDashboardQuery({ date });

  const setDate = (value: string) =>
    setSearchParams(value && value !== todayIso() ? { date: value } : {}, { replace: true });

  const header = (
    <PageHeader
      title="Dashboard"
      subtitle={`Across all locations on ${formatDate(date)}`}
      actions={
        <InputText
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
        />
      }
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <PageLoader />
      </>
    );
  }
  if (!data) {
    return (
      <>
        {header}
        <EmptyState icon="pi pi-chart-bar" title="Could not load the dashboard">
          <p>{errorMessage(error)}</p>
        </EmptyState>
      </>
    );
  }

  const { kpis, occupancy, byStatus, upcoming } = data;
  const busiest = Math.max(1, ...Object.values(byStatus));

  return (
    <div className={isFetching ? styles.refreshing : undefined}>
      {header}

      <section className={styles.kpis} aria-label="Key figures">
        <Kpi icon="pi pi-calendar" label="Bookings" value={kpis.bookingsToday} />
        <Kpi
          icon="pi pi-percentage"
          label="Occupancy"
          value={`${Math.round(kpis.occupancyRate * 100)}%`}
        />
        <Kpi icon="pi pi-euro" label="Revenue this month" value={formatMoney(kpis.revenueMonth)} />
        <Kpi icon="pi pi-users" label="Active members" value={kpis.activeMembers} />
      </section>

      <div className={styles.columns}>
        <section className="card">
          <h2 className={styles.cardTitle}>Occupancy by location</h2>
          <ul className={styles.list}>
            {occupancy.map((o) => {
              const pct = o.availableHours > 0 ? (o.bookedHours / o.availableHours) * 100 : 0;
              return (
                <li key={o.locationId}>
                  <div className={styles.row}>
                    <Link to={ROUTES.location(o.locationId)}>{o.locationName}</Link>
                    <span className={styles.muted}>
                      {o.bookedHours} of {o.availableHours} h
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round(pct)}
                    showValue={false}
                    style={{ height: '0.5rem' }}
                    aria-label={`${o.locationName} occupancy`}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card">
          <h2 className={styles.cardTitle}>Bookings by status</h2>
          <ul className={styles.list}>
            {BOOKING_STATUSES.map((status) => (
              <li key={status} className={styles.statusRow}>
                <BookingStatusTag status={status} />
                <span className={styles.bar} aria-hidden="true">
                  <span style={{ width: `${(byStatus[status] / busiest) * 100}%` }} />
                </span>
                <strong>{byStatus[status]}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className={styles.row}>
          <h2 className={styles.cardTitle}>Coming up</h2>
          <Link to={ROUTES.bookings}>All bookings</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className={styles.muted}>Nothing scheduled.</p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map((b) => (
              <li key={b.id} className={styles.upcoming}>
                <Link to={ROUTES.booking(b.id)}>{formatTimeRange(b.startsAt, b.endsAt)}</Link>
                <span>
                  {b.roomName} · {b.locationName}
                </span>
                <span className={styles.muted}>{b.memberName}</span>
                <BookingStatusTag status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const Kpi = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
  <div className={`card ${styles.kpi}`}>
    <i className={icon} aria-hidden="true" />
    <div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.muted}>{label}</div>
    </div>
  </div>
);
