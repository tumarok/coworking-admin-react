/** Base URL of the REST API. Relative by default: Vite and nginx proxy /api to the backend. */
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

export const APP_NAME = 'Coworking Admin';
