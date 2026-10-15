import { setupServer } from 'msw/node';

/**
 * Network layer for component tests. Every test declares the responses it needs with
 * `server.use(...)`; an unhandled request fails the test instead of silently hanging.
 */
export const server = setupServer();

export const apiUrl = (path: string) => `http://localhost/api/v1${path}`;
