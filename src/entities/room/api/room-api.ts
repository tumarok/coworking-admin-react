import {
  LIST_ID,
  type Page,
  type Room,
  type RoomInput,
  type RoomListQuery,
  baseApi,
  pageOf,
  roomSchema,
  validated,
} from '@/shared/api';

const TAG = 'Room' as const;
/** Locations show a room count, so room changes refresh location lists too. */
const LOCATION_TAG = 'Location' as const;

export const roomApi = baseApi
  .enhanceEndpoints({ addTagTypes: [TAG, LOCATION_TAG] })
  .injectEndpoints({
    endpoints: (build) => ({
      getRooms: build.query<Page<Room>, RoomListQuery>({
        query: (params) => ({ url: '/rooms', params }),
        transformResponse: validated(pageOf(roomSchema), 'GET /rooms'),
        providesTags: (result) => [
          { type: TAG, id: LIST_ID },
          ...(result?.items.map(({ id }) => ({ type: TAG, id })) ?? []),
        ],
      }),
      getRoom: build.query<Room, string>({
        query: (id) => `/rooms/${id}`,
        transformResponse: validated(roomSchema, 'GET /rooms/:id'),
        providesTags: (_result, _error, id) => [{ type: TAG, id }],
      }),
      createRoom: build.mutation<Room, RoomInput>({
        query: (body) => ({ url: '/rooms', method: 'POST', body }),
        extraOptions: { silent: true },
        invalidatesTags: (result) => [
          { type: TAG, id: LIST_ID },
          { type: LOCATION_TAG, id: LIST_ID },
          ...(result ? [{ type: LOCATION_TAG, id: result.locationId }] : []),
        ],
      }),
      updateRoom: build.mutation<Room, { id: string; body: RoomInput }>({
        query: ({ id, body }) => ({ url: `/rooms/${id}`, method: 'PATCH', body }),
        extraOptions: { silent: true },
        invalidatesTags: (_result, _error, { id }) => [
          { type: TAG, id },
          { type: TAG, id: LIST_ID },
          { type: LOCATION_TAG, id: LIST_ID },
        ],
      }),
      deleteRoom: build.mutation<void, { id: string; locationId: string }>({
        query: ({ id }) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
        invalidatesTags: (_result, _error, { locationId }) => [
          { type: TAG, id: LIST_ID },
          { type: LOCATION_TAG, id: LIST_ID },
          { type: LOCATION_TAG, id: locationId },
        ],
      }),
    }),
  });

export const {
  useGetRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
} = roomApi;
