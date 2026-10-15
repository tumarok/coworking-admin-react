import { DataTable, type DataTablePageEvent } from 'primereact/datatable';
import type { ReactNode } from 'react';

import styles from './EntityTable.module.scss';

interface Props<T extends { id: string }> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  /** True while a request is in flight, including background refetches. */
  loading: boolean;
  onPage: (page: number, limit: number) => void;
  /** PrimeReact <Column> elements. */
  children: ReactNode;
  emptyMessage?: string;
  /** Enables row checkboxes; pass a selection column among the children. */
  selection?: T[];
  onSelectionChange?: (rows: T[]) => void;
  caption?: string;
}

/**
 * Server-paginated table: it renders one page and reports page changes; the caller keeps page
 * state in the URL and fetches.
 */
export const EntityTable = <T extends { id: string }>({
  items,
  total,
  page,
  limit,
  loading,
  onPage,
  children,
  emptyMessage = 'Nothing matches the current filters.',
  selection,
  onSelectionChange,
  caption,
}: Props<T>) => {
  const handlePage = (e: DataTablePageEvent) => onPage((e.page ?? 0) + 1, e.rows);
  const common = {
    value: items,
    dataKey: 'id',
    lazy: true,
    paginator: true,
    first: (page - 1) * limit,
    rows: limit,
    totalRecords: total,
    rowsPerPageOptions: [10, 20, 50],
    onPage: handlePage,
    loading,
    emptyMessage,
    className: styles.table,
    tableStyle: { minWidth: '48rem' },
    'aria-label': caption,
    paginatorTemplate:
      'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport',
    currentPageReportTemplate: '{first}–{last} of {totalRecords}',
  };

  return selection && onSelectionChange ? (
    <DataTable
      {...common}
      selectionMode="checkbox"
      selection={selection}
      onSelectionChange={(e) => onSelectionChange(e.value as T[])}
    >
      {children}
    </DataTable>
  ) : (
    <DataTable {...common}>{children}</DataTable>
  );
};
