import {
  type LoginRequest,
  type LoginResponse,
  type User,
  baseApi,
  loginResponseSchema,
  userSchema,
} from '@/shared/api';
import { sessionToken } from '@/shared/lib';

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      // The form shows a wrong password in place; no global toast.
      extraOptions: { silent: true },
      transformResponse: (raw: unknown) => loginResponseSchema.parse(raw),
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          sessionToken.set(data.token);
        } catch {
          // the form reports the failure
        }
      },
    }),
    me: build.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (raw: unknown) => userSchema.parse(raw),
    }),
  }),
});

export const { useLoginMutation, useMeQuery } = sessionApi;
