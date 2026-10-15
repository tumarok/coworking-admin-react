import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { errorMessage, errorStatus, fieldErrors } from '@/shared/api/errors';

/**
 * Puts a server rejection where the user will see it: 422 field errors go under their fields,
 * anything else (or a field the form does not have) comes back as a message for a banner.
 *
 * @param rename maps API field names to form field names, e.g. { startsAt: 'startTime' }.
 */
export const applyServerErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
  rename: Record<string, string> = {},
): string | null => {
  const byField = fieldErrors(error);
  let unmatched = false;
  for (const [apiField, message] of Object.entries(byField)) {
    const field = rename[apiField] ?? apiField;
    if (knownFields.includes(field)) setError(field as Path<T>, { type: 'server', message });
    else unmatched = true;
  }
  if (errorStatus(error) === 422 && !unmatched && Object.keys(byField).length > 0) return null;
  return errorMessage(error);
};
