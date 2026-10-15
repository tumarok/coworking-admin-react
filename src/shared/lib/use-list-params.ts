import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { DEFAULT_PAGE_SIZE } from '@/shared/api';

type Patch = Record<string, string | number | null | undefined>;

/**
 * List state (page, page size, search and filters) kept in the URL, so a list can be shared,
 * bookmarked and restored with the back button. `query` is ready to pass to a list endpoint:
 * empty filters are dropped. RTK Query keys its cache by value, so a new object per render
 * does not trigger a new request.
 */
export const useListParams = <F extends string>(
  filterKeys: readonly F[] = [],
  defaultLimit = DEFAULT_PAGE_SIZE,
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || defaultLimit;
  const q = searchParams.get('q') ?? '';

  const filters = useMemo(
    () =>
      Object.fromEntries(filterKeys.map((key) => [key, searchParams.get(key) ?? ''])) as Record<
        F,
        string
      >,
    // filterKeys is a static list declared next to the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  const query = useMemo(() => {
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    return { page, limit, ...(q ? { q } : {}), ...active } as {
      page: number;
      limit: number;
      q?: string;
    } & Partial<Record<F, string>>;
  }, [page, limit, q, filters]);

  /** Writes to the URL; any change other than the page itself returns to page 1. */
  const update = useCallback(
    (patch: Patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    page,
    limit,
    q,
    filters,
    query,
    setPage: useCallback((p: number) => update({ page: p > 1 ? p : null }), [update]),
    setLimit: useCallback(
      (l: number) => update({ limit: l === defaultLimit ? null : l }),
      [update, defaultLimit],
    ),
    setSearch: useCallback((value: string) => update({ q: value.trim() }), [update]),
    setFilter: useCallback((key: F, value: string | null) => update({ [key]: value }), [update]),
    reset: useCallback(
      () => update(Object.fromEntries(['q', ...filterKeys].map((k) => [k, null]))),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [update],
    ),
  };
};
