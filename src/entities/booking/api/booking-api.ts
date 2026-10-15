import {
  type Booking,
  type BookingInput,
  type BookingListQuery,
  type BookingStatus,
  type BulkBookingRequest,
  type BulkBookingResult,
  LIST_ID,
  type Page,
  baseApi,
  bookingSchema,
  pageOf,
  validated,
} from '@/shared/api';

const TAG = 'Booking' as const;
/** The dashboard aggregates bookings, so any booking change makes it stale. */
const DASHBOARD_TAG = 'Dashboard' as const;

export const bookingApi = baseApi
  .enhanceEndpoints({ addTagTypes: [TAG, DASHBOARD_TAG] })
  .injectEndpoints({
    endpoints: (build) => ({
      getBookings: build.query<Page<Booking>, BookingListQuery>({
        query: (params) => ({ url: '/bookings', params }),
        transformResponse: validated(pageOf(bookingSchema), 'GET /bookings'),
        providesTags: (result) => [
          { type: TAG, id: LIST_ID },
          ...(result?.items.map(({ id }) => ({ type: TAG, id })) ?? []),
        ],
      }),
      getBooking: build.query<Booking, string>({
        query: (id) => `/bookings/${id}`,
        transformResponse: validated(bookingSchema, 'GET /bookings/:id'),
        providesTags: (_result, _error, id) => [{ type: TAG, id }],
      }),
      createBooking: build.mutation<Booking, BookingInput>({
        query: (body) => ({ url: '/bookings', method: 'POST', body }),
        // Conflicts and rule violations are shown inside the form.
        extraOptions: { silent: true },
        invalidatesTags: [{ type: TAG, id: LIST_ID }, DASHBOARD_TAG],
      }),
      updateBooking: build.mutation<Booking, { id: string; body: BookingInput }>({
        query: ({ id, body }) => ({ url: `/bookings/${id}`, method: 'PATCH', body }),
        extraOptions: { silent: true },
        invalidatesTags: (_result, _error, { id }) => [
          { type: TAG, id },
          { type: TAG, id: LIST_ID },
          DASHBOARD_TAG,
        ],
      }),
      changeBookingStatus: build.mutation<Booking, { id: string; status: BookingStatus }>({
        query: ({ id, status }) => ({
          url: `/bookings/${id}/status`,
          method: 'POST',
          body: { status },
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: TAG, id },
          { type: TAG, id: LIST_ID },
          DASHBOARD_TAG,
        ],
      }),
      bulkUpdateBookings: build.mutation<BulkBookingResult, BulkBookingRequest>({
        query: (body) => ({ url: '/bookings/bulk', method: 'POST', body }),
        invalidatesTags: (_result, _error, { ids }) => [
          { type: TAG, id: LIST_ID },
          ...ids.map((id) => ({ type: TAG, id })),
          DASHBOARD_TAG,
        ],
      }),
    }),
  });

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useChangeBookingStatusMutation,
  useBulkUpdateBookingsMutation,
} = bookingApi;
