import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

import { ROUTES } from '@/shared/config';

/** Last line of defence: a render error or a failed lazy import lands here. */
export const RouteError = () => {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <section role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <Link to={ROUTES.dashboard}>Back to the dashboard</Link>
    </section>
  );
};
