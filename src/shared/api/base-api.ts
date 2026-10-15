import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from './base-query';

/**
 * The single RTK Query API. Entities inject their endpoints and declare their own tag types with
 * `enhanceEndpoints({ addTagTypes })`, so this file stays free of domain knowledge.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  endpoints: () => ({}),
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
});

/** Tag for "any list of this type" — invalidated by every create, update and delete. */
export const LIST_ID = 'LIST';
