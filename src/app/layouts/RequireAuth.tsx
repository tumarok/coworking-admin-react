import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { selectCurrentUser, selectIsAuthenticated, useMeQuery } from '@/entities/session';
import { ROUTES } from '@/shared/config';
import { useAppSelector } from '@/shared/lib';
import { PageLoader } from '@/shared/ui';

/**
 * Lets the user through when there is a token. After a reload only the token survives, so the
 * profile is fetched once; a rejected token ends in `sessionExpired` and a redirect to login.
 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const { isError } = useMeQuery(undefined, { skip: !isAuthenticated || user !== null });

  if (!isAuthenticated) {
    return (
      <Navigate to={ROUTES.login} replace state={{ from: location.pathname + location.search }} />
    );
  }
  if (!user && !isError) return <PageLoader label="Checking your session…" />;
  return children;
};
