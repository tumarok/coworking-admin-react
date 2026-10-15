import { Navigate, useLocation, useNavigate } from 'react-router';

import { LoginForm } from '@/features/auth';
import { selectIsAuthenticated } from '@/entities/session';
import { APP_NAME, ROUTES } from '@/shared/config';
import { useAppSelector } from '@/shared/lib';

import styles from './LoginPage.module.scss';

export const LoginPage = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <i className="pi pi-building" />
          </span>
          <h1 id="login-title">Sign in</h1>
          <p>to {APP_NAME}</p>
        </div>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        <p className={styles.demo}>
          Demo account: <code>admin@coworking.test</code> / <code>demo1234</code>
        </p>
      </section>
    </main>
  );
};
