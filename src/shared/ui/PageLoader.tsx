import { ProgressSpinner } from 'primereact/progressspinner';

import styles from './PageLoader.module.scss';

export const PageLoader = ({ label = 'Loading…' }: { label?: string }) => (
  <div className={styles.loader} role="status" aria-live="polite">
    <ProgressSpinner style={{ width: 40, height: 40 }} strokeWidth="4" />
    <span className={styles.label}>{label}</span>
  </div>
);
