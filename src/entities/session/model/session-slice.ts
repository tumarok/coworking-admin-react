import { type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type User, baseApi, sessionExpired } from '@/shared/api';
import { sessionToken } from '@/shared/lib';

import { sessionApi } from '../api/session-api';

export interface SessionState {
  token: string | null;
  user: User | null;
}

/** Selectors receive only the part of the state they need, so no layer depends on RootState. */
type WithSession = { session: SessionState };

const signedOutState = (): SessionState => ({ token: null, user: null });

export const sessionSlice = createSlice({
  name: 'session',
  initialState: (): SessionState => ({ token: sessionToken.get(), user: null }),
  reducers: {
    signedOut: signedOutState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sessionExpired, signedOutState)
      .addMatcher(sessionApi.endpoints.login.matchFulfilled, (_state, { payload }) => ({
        token: payload.token,
        user: payload.user,
      }))
      .addMatcher(sessionApi.endpoints.me.matchFulfilled, (state, { payload }) => {
        state.user = payload;
      });
  },
});

export const { signedOut } = sessionSlice.actions;

export const selectIsAuthenticated = (state: WithSession) => state.session.token !== null;
export const selectCurrentUser = (state: WithSession) => state.session.user;

/** Forgets the token and drops every cached response, so the next user starts clean. */
export const logout = (): ThunkAction<void, unknown, unknown, UnknownAction> => (dispatch) => {
  sessionToken.clear();
  dispatch(signedOut());
  dispatch(baseApi.util.resetApiState());
};
