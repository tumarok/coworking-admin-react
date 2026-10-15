import type { ReactNode } from 'react';
import { Link } from 'react-router';

import styles from './PageHeader.module.scss';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons on the right: "New booking", "Edit", … */
  actions?: ReactNode;
  back?: { to: string; label: string };
}

export const PageHeader = ({ title, subtitle, actions, back }: Props) => (
  <header className={styles.header}>
    <div className={styles.text}>
      {back ? (
        <Link to={back.to} className={styles.back}>
          <i className="pi pi-arrow-left" aria-hidden="true" /> {back.label}
        </Link>
      ) : null}
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </header>
);
