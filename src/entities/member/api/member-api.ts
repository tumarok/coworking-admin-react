import {
  LIST_ID,
  type Member,
  type MemberInput,
  type MemberListQuery,
  type Page,
  baseApi,
  memberSchema,
  pageOf,
  validated,
} from '@/shared/api';

const TAG = 'Member' as const;

export const memberApi = baseApi.enhanceEndpoints({ addTagTypes: [TAG] }).injectEndpoints({
  endpoints: (build) => ({
    getMembers: build.query<Page<Member>, MemberListQuery>({
      query: (params) => ({ url: '/members', params }),
      transformResponse: validated(pageOf(memberSchema), 'GET /members'),
      providesTags: (result) => [
        { type: TAG, id: LIST_ID },
        ...(result?.items.map(({ id }) => ({ type: TAG, id })) ?? []),
      ],
    }),
    getMember: build.query<Member, string>({
      query: (id) => `/members/${id}`,
      transformResponse: validated(memberSchema, 'GET /members/:id'),
      providesTags: (_result, _error, id) => [{ type: TAG, id }],
    }),
    createMember: build.mutation<Member, MemberInput>({
      query: (body) => ({ url: '/members', method: 'POST', body }),
      extraOptions: { silent: true },
      invalidatesTags: [{ type: TAG, id: LIST_ID }],
    }),
    updateMember: build.mutation<Member, { id: string; body: MemberInput }>({
      query: ({ id, body }) => ({ url: `/members/${id}`, method: 'PATCH', body }),
      extraOptions: { silent: true },
      invalidatesTags: (_result, _error, { id }) => [
        { type: TAG, id },
        { type: TAG, id: LIST_ID },
      ],
    }),
    deleteMember: build.mutation<void, string>({
      query: (id) => ({ url: `/members/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: TAG, id: LIST_ID }],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useGetMemberQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
} = memberApi;
