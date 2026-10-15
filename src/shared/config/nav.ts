import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  /** PrimeIcons class, e.g. "pi pi-calendar". */
  icon: string;
  to: string;
  /** Match the path exactly (used for the dashboard at "/"). */
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-chart-bar', to: ROUTES.dashboard, end: true },
  { label: 'Locations', icon: 'pi pi-building', to: ROUTES.locations },
];
