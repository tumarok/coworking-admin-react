import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { notify } from '@/shared/lib';
import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { LocationFormDialog } from './LocationFormDialog';

describe('LocationFormDialog', () => {
  it('refuses closing hours that come before opening hours', async () => {
    const { user } = renderWithProviders(<LocationFormDialog visible onHide={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Name/), 'Test Space');
    await user.type(screen.getByLabelText(/^City/), 'Kyiv');
    await user.type(screen.getByLabelText(/^Address/), '1 Test Street');
    const closes = screen.getByLabelText('Closes at');
    await user.clear(closes);
    await user.type(closes, '07:00');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Closing time must be after opening time')).toBeInTheDocument();
  });

  it('creates a location and reports success', async () => {
    const api = installMockApi();
    signIn();
    const success = vi.spyOn(notify, 'success');
    const onHide = vi.fn();
    const { user } = renderWithProviders(<LocationFormDialog visible onHide={onHide} />);

    await user.type(screen.getByLabelText(/^Name/), 'Test Space');
    await user.type(screen.getByLabelText(/^City/), 'Kyiv');
    await user.type(screen.getByLabelText(/^Address/), '1 Test Street');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onHide).toHaveBeenCalled());
    expect(success).toHaveBeenCalledWith('Location created', 'Test Space');
    expect(api.db.locations.some((l) => l.name === 'Test Space')).toBe(true);
  });
});
