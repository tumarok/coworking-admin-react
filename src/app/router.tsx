import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';

import { NotFoundPage } from '@/pages/not-found';
import { ROUTES } from '@/shared/config';
import { PageLoader } from '@/shared/ui';

import { AppLayout } from './layouts/AppLayout';
import { RequireAuth } from './layouts/RequireAuth';
import { RouteError } from './layouts/RouteError';

/** A page in its own chunk, loaded on first visit. */
const lazyPage =
  <M,>(load: () => Promise<M>, pick: (module: M) => ComponentType) =>
  () =>
    load().then((module) => ({ Component: pick(module) }));

export const routes = [
  {
    path: ROUTES.login,
    lazy: lazyPage(
      () => import('@/pages/login'),
      (m) => m.LoginPage,
    ),
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
        lazy: lazyPage(
          () => import('@/pages/dashboard'),
          (m) => m.DashboardPage,
        ),
      },
      {
        path: ROUTES.locations,
        lazy: lazyPage(
          () => import('@/pages/locations'),
          (m) => m.LocationsPage,
        ),
      },
      {
        path: ROUTES.location(':id'),
        lazy: lazyPage(
          () => import('@/pages/location-details'),
          (m) => m.LocationDetailsPage,
        ),
      },
      {
        path: ROUTES.rooms,
        lazy: lazyPage(
          () => import('@/pages/rooms'),
          (m) => m.RoomsPage,
        ),
      },
      {
        path: ROUTES.room(':id'),
        lazy: lazyPage(
          () => import('@/pages/room-details'),
          (m) => m.RoomDetailsPage,
        ),
      },
      {
        path: ROUTES.members,
        lazy: lazyPage(
          () => import('@/pages/members'),
          (m) => m.MembersPage,
        ),
      },
      {
        path: ROUTES.member(':id'),
        lazy: lazyPage(
          () => import('@/pages/member-details'),
          (m) => m.MemberDetailsPage,
        ),
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
