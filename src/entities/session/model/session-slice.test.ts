import { describe, expect, it } from 'vitest';

import { sessionExpired } from '@/shared/api';

import { selectIsAuthenticated, sessionSlice, signedOut } from './session-slice';

const user = { id: 'u1', name: 'Alex', email: 'a@example.com', role: 'admin' as const };

describe('session slice', () => {
  it('starts signed in when a token is stored', () => {
    sessionStorage.setItem('coworking-admin.token', 'abc');
    const state = sessionSlice.reducer(undefined, { type: 'init' });
    expect(selectIsAuthenticated({ session: state })).toBe(true);
  });

  it('forgets the user when the session expires', () => {
    const state = sessionSlice.reducer({ token: 't', user }, sessionExpired());
    expect(state).toEqual({ token: null, user: null });
  });

  it('forgets the user on sign out', () => {
    const state = sessionSlice.reducer({ token: 't', user }, signedOut());
    expect(selectIsAuthenticated({ session: state })).toBe(false);
  });
});
