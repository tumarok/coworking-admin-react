import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { notify } from '@/shared/lib';

import { installMockApi } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { LoginForm } from './LoginForm';

const fill = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  email: string,
  password: string,
) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('LoginForm', () => {
  it('validates the fields before calling the server', async () => {
    const onSuccess = vi.fn();
    const { user } = renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a wrong password inside the form and raises no toast', async () => {
    installMockApi();
    const emit = vi.spyOn(notify, 'emit');
    const { user } = renderWithProviders(<LoginForm onSuccess={vi.fn()} />);

    await fill(user, 'admin@coworking.test', 'wrong-password');

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(emit).not.toHaveBeenCalled();
  });

  it('stores the token and signs the user in', async () => {
    installMockApi();
    const onSuccess = vi.fn();
    const { user, store } = renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    await fill(user, 'admin@coworking.test', 'demo1234');

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(sessionStorage.getItem('coworking-admin.token')).toMatch(/^demo-token\./);
    expect(store.getState().session.user?.email).toBe('admin@coworking.test');
  });
});
