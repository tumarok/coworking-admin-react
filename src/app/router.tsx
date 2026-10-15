import { createBrowserRouter } from 'react-router';

import { NotFoundPage } from '@/pages/not-found';
import { PageLoader } from '@/shared/ui';

import { AppLayout } from './layouts/AppLayout';
import { RouteError } from './layouts/RouteError';

/** Pages are split into their own chunks and loaded on first visit. */
export const routes = [
  {
    element: <AppLayout />,
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
