import { Link } from 'react-router';

import { ROUTES } from '@/shared/config';

import styles from './NotFoundPage.module.scss';

export const NotFoundPage = () => (
  <section className={styles.page}>
    <p className={styles.code}>404</p>
    <h1>Page not found</h1>
    <p>The page you are looking for does not exist or has been moved.</p>
    <Link to={ROUTES.dashboard}>Back to the dashboard</Link>
  </section>
);
