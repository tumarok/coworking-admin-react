import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { RoomFormDialog } from './RoomFormDialog';

describe('RoomFormDialog', () => {
  it('edits the rate in euros and sends cents to the API', async () => {
    const api = installMockApi();
    signIn();
    const locationId = api.db.locations[0]?.id ?? '';
    const onHide = vi.fn();
    const { user } = renderWithProviders(
      <RoomFormDialog locationId={locationId} visible onHide={onHide} />,
    );

    await user.type(screen.getByLabelText(/^Name/), 'Quartz');
    const rate = screen.getByLabelText('Hourly rate');
    await user.clear(rate);
    await user.type(rate, '32.5');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onHide).toHaveBeenCalled());
    const created = api.db.rooms.find((r) => r.name === 'Quartz');
    expect(created).toMatchObject({ locationId, hourlyRate: 3250 });
  });
});
