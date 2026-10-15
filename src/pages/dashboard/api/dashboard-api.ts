import { type Dashboard, baseApi, dashboardSchema, validated } from '@/shared/api';

const TAG = 'Dashboard' as const;

/** A read model of this page only, so it lives in the page slice rather than in an entity. */
export const dashboardApi = baseApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query<Dashboard, { date?: string }>({
      query: (params) => ({ url: '/dashboard', params }),
      transformResponse: validated(dashboardSchema, 'GET /dashboard'),
      providesTags: [TAG],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
