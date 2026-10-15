import {
  LIST_ID,
  type Location,
  type LocationInput,
  type LocationListQuery,
  type Page,
  baseApi,
  locationSchema,
  pageOf,
  validated,
} from '@/shared/api';

const TAG = 'Location' as const;

export const locationApi = baseApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
  endpoints: (build) => ({
    getLocations: build.query<Page<Location>, LocationListQuery>({
      query: (params) => ({ url: '/locations', params }),
      transformResponse: validated(pageOf(locationSchema), 'GET /locations'),
      providesTags: (result) => [
        { type: TAG, id: LIST_ID },
        ...(result?.items.map(({ id }) => ({ type: TAG, id })) ?? []),
      ],
    }),
    getLocation: build.query<Location, string>({
      query: (id) => `/locations/${id}`,
      transformResponse: validated(locationSchema, 'GET /locations/:id'),
      providesTags: (_result, _error, id) => [{ type: TAG, id }],
    }),
    createLocation: build.mutation<Location, LocationInput>({
      query: (body) => ({ url: '/locations', method: 'POST', body }),
      // The form shows validation problems next to the fields.
      extraOptions: { silent: true },
      invalidatesTags: [{ type: TAG, id: LIST_ID }],
    }),
    updateLocation: build.mutation<Location, { id: string; body: LocationInput }>({
      query: ({ id, body }) => ({ url: `/locations/${id}`, method: 'PATCH', body }),
      extraOptions: { silent: true },
      invalidatesTags: (_result, _error, { id }) => [
        { type: TAG, id },
        { type: TAG, id: LIST_ID },
      ],
    }),
    deleteLocation: build.mutation<void, string>({
      query: (id) => ({ url: `/locations/${id}`, method: 'DELETE' }),
      // Only the lists: invalidating the deleted id would refetch it straight into a 404.
      invalidatesTags: [{ type: TAG, id: LIST_ID }],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationApi;
