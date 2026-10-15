import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

import { APP_NAME, NAV_ITEMS } from '@/shared/config';

import styles from './AppSidebar.module.scss';

interface Props {
  /** Rendered at the bottom: the signed-in user and the sign-out action. */
  footer?: ReactNode;
}

export const AppSidebar = ({ footer }: Props) => (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>
      <span className={styles.logo} aria-hidden="true">
        <i className="pi pi-building" />
      </span>
      <span>{APP_NAME}</span>
    </div>
    <nav aria-label="Main">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
    {footer ? <div className={styles.footer}>{footer}</div> : null}
  </aside>
);
