import { createApi } from '../server/core/api';
import { createMswHandlers } from '../server/msw';

import { server } from './msw-server';

/** A fixed "now" so seeded data and date-dependent rules are stable across runs. */
export const TEST_NOW = Date.parse('2026-10-14T09:00:00.000Z');

/** Serves the real mock API (same core as `npm run mock`) to the code under test. */
export const installMockApi = () => {
  const api = createApi({ now: TEST_NOW, clock: () => TEST_NOW });
  server.use(...createMswHandlers(api));
  return api;
};

/** Requests go out with a valid demo token, as after a real sign-in. */
export const signIn = () => sessionStorage.setItem('coworking-admin.token', 'demo-token.usr_admin');
