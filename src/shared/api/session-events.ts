import { createAction } from '@reduxjs/toolkit';

/**
 * Dispatched by the base query when the server rejects the token. Declared here, in the lowest
 * layer, so the API layer can announce it and the session entity can react to it.
 */
export const sessionExpired = createAction('session/expired');
