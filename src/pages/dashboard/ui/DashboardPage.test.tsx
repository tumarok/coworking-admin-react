import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { DashboardPage } from './DashboardPage';

describe('DashboardPage', () => {
  it('shows the figures for the date in the URL', async () => {
    const api = installMockApi();
    signIn();
    const activeMembers = api.db.members.filter((m) => m.status === 'active').length;

    renderWithProviders(<DashboardPage />, { route: '/?date=2026-10-14', path: '/' });

    expect(await screen.findByText('Active members')).toBeInTheDocument();
    expect(screen.getByText(String(activeMembers))).toBeInTheDocument();
    expect(screen.getByText(/Across all locations on 14 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Riverside Hub' })).toBeInTheDocument();
  });
});
