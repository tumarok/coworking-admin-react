import { Button } from 'primereact/button';
import type { ReactNode } from 'react';

import { SearchInput } from './SearchInput';

import styles from './ListToolbar.module.scss';

interface Props {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter controls (dropdowns, date ranges). */
  children?: ReactNode;
  /** Shown when any search or filter is active. */
  onReset?: () => void;
  canReset?: boolean;
  /** Right-aligned extras, e.g. bulk actions. */
  actions?: ReactNode;
}

export const ListToolbar = ({
  search,
  onSearch,
  searchPlaceholder,
  children,
  onReset,
  canReset,
  actions,
}: Props) => (
  <div className={styles.toolbar}>
    <div className={styles.filters}>
      <SearchInput value={search} onSearch={onSearch} placeholder={searchPlaceholder} />
      {children}
      {onReset && canReset ? (
        <Button label="Clear filters" icon="pi pi-filter-slash" text onClick={onReset} />
      ) : null}
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);
