import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import { API_URL } from '@/shared/config';
import { sessionToken } from '@/shared/lib/session-token';

import type { ApiError } from './errors';
import { sessionExpired } from './session-events';

export interface ApiExtraOptions {
  /** The calling UI renders the error itself; the global toast stays quiet. */
  silent?: boolean;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: 30_000,
  prepareHeaders: (headers) => {
    const token = sessionToken.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const isLogin = (args: string | FetchArgs) =>
  (typeof args === 'string' ? args : args.url).startsWith('/auth/login');

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  ApiError,
  ApiExtraOptions
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions ?? {});
  if (!result.error) return result;

  const error: FetchBaseQueryError = result.error;
  // A 401 on anything but the login form means the token is no longer valid.
  if (error.status === 401 && !isLogin(args)) {
    sessionToken.clear();
    api.dispatch(sessionExpired());
  }
  return { ...result, error: extraOptions?.silent ? { ...error, silent: true } : error };
};
