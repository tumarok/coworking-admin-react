import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { useListParams } from './use-list-params';

const setup = (url: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => ({ list: useListParams(['type', 'status'] as const), location: useLocation() }),
    { wrapper },
  );
};

describe('useListParams', () => {
  it('reads page, search and filters from the URL and drops empty filters', () => {
    const { result } = setup('/rooms?page=3&q=aurora&type=hot_desk&status=');
    expect(result.current.list.query).toEqual({
      page: 3,
      limit: 20,
      q: 'aurora',
      type: 'hot_desk',
    });
  });

  it('falls back to defaults for a clean URL', () => {
    const { result } = setup('/rooms');
    expect(result.current.list.query).toEqual({ page: 1, limit: 20 });
  });

  it('returns to the first page when a filter changes', () => {
    const { result } = setup('/rooms?page=4');
    act(() => result.current.list.setFilter('status', 'available'));
    expect(result.current.location.search).toBe('?status=available');
    expect(result.current.list.page).toBe(1);
  });

  it('keeps other params when paging and omits page 1 from the URL', () => {
    const { result } = setup('/rooms?type=meeting_room');
    act(() => result.current.list.setPage(2));
    expect(result.current.location.search).toBe('?type=meeting_room&page=2');
    act(() => result.current.list.setPage(1));
    expect(result.current.location.search).toBe('?type=meeting_room');
  });

  it('clears search and filters on reset', () => {
    const { result } = setup('/rooms?q=x&type=hot_desk&limit=50');
    act(() => result.current.list.reset());
    expect(result.current.location.search).toBe('?limit=50');
  });
});
