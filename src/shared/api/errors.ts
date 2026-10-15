import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { type ApiErrorBody, type BookingConflict, apiErrorSchema } from './contract';

/** What a failed request resolves to. `silent` marks calls whose UI shows the error itself. */
export type ApiError = FetchBaseQueryError & { silent?: boolean };

const body = (error: unknown): ApiErrorBody | null => {
  if (!error || typeof error !== 'object' || !('data' in error)) return null;
  const parsed = apiErrorSchema.safeParse((error as { data: unknown }).data);
  return parsed.success ? parsed.data : null;
};

export const errorStatus = (error: unknown): number | string | null =>
  error && typeof error === 'object' && 'status' in error
    ? (error as { status: number | string }).status
    : null;

export const errorMessage = (error: unknown): string => {
  const message = body(error)?.message;
  if (message) return message;
  switch (errorStatus(error)) {
    case 'FETCH_ERROR':
      return 'Cannot reach the server. Check your connection and try again.';
    case 'TIMEOUT_ERROR':
      return 'The server took too long to respond.';
    case 'PARSING_ERROR':
      return 'The server sent an unexpected response.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export const fieldErrors = (error: unknown): Record<string, string> =>
  body(error)?.fieldErrors ?? {};

export const bookingConflicts = (error: unknown): BookingConflict[] => body(error)?.conflicts ?? [];
