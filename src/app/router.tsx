import { createBrowserRouter } from 'react-router';

import { NotFoundPage } from '@/pages/not-found';
import { ROUTES } from '@/shared/config';
import { PageLoader } from '@/shared/ui';

import { AppLayout } from './layouts/AppLayout';
import { RequireAuth } from './layouts/RequireAuth';
import { RouteError } from './layouts/RouteError';

/** Pages are split into their own chunks and loaded on first visit. */
export const routes = [
  {
    path: ROUTES.login,
    lazy: () => import('@/pages/login').then((m) => ({ Component: m.LoginPage })),
    hydrateFallbackElement: <PageLoader />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/dashboard').then((m) => ({ Component: m.DashboardPage })),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
