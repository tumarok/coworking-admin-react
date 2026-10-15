import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { LocationsPage } from './LocationsPage';

describe('LocationsPage', () => {
  it('lists locations from the API', async () => {
    installMockApi();
    signIn();
    renderWithProviders(<LocationsPage />, { route: '/locations', path: '/locations' });

    expect(await screen.findByRole('link', { name: 'Canal Yard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Riverside Hub' })).toBeInTheDocument();
  });

  it('keeps the search in the URL and narrows the list', async () => {
    installMockApi();
    signIn();
    const { user, router } = renderWithProviders(<LocationsPage />, {
      route: '/locations',
      path: '/locations',
    });
    await screen.findByRole('link', { name: 'Canal Yard' });

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'harbour');

    await waitFor(() => expect(router.state.location.search).toBe('?q=harbour'));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Canal Yard' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Harbour Studio' })).toBeInTheDocument();
  });
});
