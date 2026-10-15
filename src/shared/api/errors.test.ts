import { describe, expect, it } from 'vitest';

import { bookingConflicts, errorMessage, fieldErrors } from './errors';

describe('API error helpers', () => {
  it('prefers the message sent by the server', () => {
    expect(errorMessage({ status: 409, data: { message: 'Room is busy' } })).toBe('Room is busy');
  });

  it('explains transport failures in plain words', () => {
    expect(errorMessage({ status: 'FETCH_ERROR', error: 'TypeError' })).toMatch(/Cannot reach/);
  });

  it('extracts field errors and conflicts when present', () => {
    const error = {
      status: 422,
      data: {
        message: 'Validation failed',
        fieldErrors: { email: 'Taken' },
        conflicts: [
          { id: 'bk_1', startsAt: '2026-10-01T09:00:00.000Z', endsAt: '2026-10-01T10:00:00.000Z' },
        ],
      },
    };
    expect(fieldErrors(error)).toEqual({ email: 'Taken' });
    expect(bookingConflicts(error)).toHaveLength(1);
  });

  it('returns empty results for anything that is not an API error', () => {
    expect(fieldErrors(new Error('boom'))).toEqual({});
    expect(bookingConflicts(undefined)).toEqual([]);
  });
});
