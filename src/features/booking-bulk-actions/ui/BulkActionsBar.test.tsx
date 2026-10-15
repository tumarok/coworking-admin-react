import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Booking, Page } from '@/shared/api';
import { notify } from '@/shared/lib';
import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { BulkActionsBar } from './BulkActionsBar';

describe('BulkActionsBar', () => {
  it('confirms what it can and explains each refused booking', async () => {
    const api = installMockApi();
    signIn();
    const firstWith = (status: string) =>
      (
        api.handle({
          method: 'GET',
          path: '/bookings',
          query: { status, limit: '1' },
          authorization: 'Bearer demo-token.usr_admin',
        }).body as Page<Booking>
      ).items;
    const selected = [...firstWith('pending'), ...firstWith('completed')];
    const success = vi.spyOn(notify, 'success');
    const onDone = vi.fn();

    const { user } = renderWithProviders(<BulkActionsBar selected={selected} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(success).toHaveBeenCalledWith('1 booking confirmed');
    expect(await screen.findByText('Some bookings were not confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cannot confirm a booking that is completed')).toBeInTheDocument();
  });
});
