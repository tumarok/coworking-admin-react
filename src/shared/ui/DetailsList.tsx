import type { ReactNode } from 'react';

import styles from './DetailsList.module.scss';

export interface DetailsItem {
  label: string;
  value: ReactNode;
}

/** A definition list laid out as a responsive grid of label/value pairs. */
export const DetailsList = ({ items }: { items: DetailsItem[] }) => (
  <dl className={styles.list}>
    {items.map(({ label, value }) => (
      <div key={label} className={styles.item}>
        <dt>{label}</dt>
        <dd>{value ?? '—'}</dd>
      </div>
    ))}
  </dl>
);
