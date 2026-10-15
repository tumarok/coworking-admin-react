import type { z } from 'zod';

/**
 * transformResponse that checks a response against the contract without blocking it: a mismatch
 * is logged with the exact path, and the data still reaches the UI. A throw here would surface as
 * a generic failure far away from the cause.
 */
export const validated =
  <S extends z.ZodType>(schema: S, label: string) =>
  (raw: unknown): z.output<S> => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.error(`Contract mismatch in ${label}`, result.error.issues);
      return raw as z.output<S>;
    }
    return result.data;
  };
