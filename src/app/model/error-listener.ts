import { createListenerMiddleware, isRejectedWithValue } from '@reduxjs/toolkit';

import { type ApiError, errorMessage } from '@/shared/api';
import { notify } from '@/shared/lib';

const SESSION_NOTICE_COOLDOWN_MS = 3_000;

/**
 * Turns every failed request into a toast, except calls marked `silent`: forms that render their
 * own error (login, validation, booking conflicts) opt out per endpoint call.
 */
export const errorListener = createListenerMiddleware();

let lastSessionNotice = 0;

errorListener.startListening({
  predicate: (action) => isRejectedWithValue(action),
  effect: (action) => {
    const error = (action as { payload?: ApiError }).payload;
    if (!error || error.silent) return;

    if (error.status === 401) {
      // Parallel requests all fail at once when a session expires; show the notice once.
      const now = Date.now();
      if (now - lastSessionNotice > SESSION_NOTICE_COOLDOWN_MS) {
        lastSessionNotice = now;
        notify.error('Session expired', 'Please sign in again.');
      }
      return;
    }
    notify.error('Request failed', errorMessage(error));
  },
});
