import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { notify } from '@/shared/lib';
import { installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { MemberFormDialog } from './MemberFormDialog';

describe('MemberFormDialog', () => {
  it('shows a duplicate email from the server under the email field', async () => {
    const api = installMockApi();
    signIn();
    const taken = api.db.members[0]?.email ?? '';
    const emit = vi.spyOn(notify, 'emit');
    const onHide = vi.fn();
    const { user } = renderWithProviders(<MemberFormDialog visible onHide={onHide} />);

    await user.type(screen.getByLabelText(/^First name/), 'Dana');
    await user.type(screen.getByLabelText(/^Last name/), 'Kovalenko');
    await user.type(screen.getByLabelText(/^Email/), taken);
    await user.type(screen.getByLabelText(/^Phone/), '+380 44 123 45 67');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('This email is already registered')).toBeInTheDocument();
    expect(onHide).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});
