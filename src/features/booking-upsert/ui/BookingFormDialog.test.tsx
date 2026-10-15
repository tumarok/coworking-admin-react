import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { notify, utcToZoned } from '@/shared/lib';
import { findBookedSlot, installMockApi, signIn } from '@test/mock-api';
import { renderWithProviders } from '@test/render';

import { BookingFormDialog } from './BookingFormDialog';

type User = ReturnType<typeof renderWithProviders>['user'];

const fillTime = async (user: User, date: string, from: string, to: string) => {
  const dateInput = screen.getByLabelText(/^Date/);
  await user.clear(dateInput);
  await user.type(dateInput, date);
  for (const [label, value] of [
    ['From', from],
    ['To', to],
  ] as const) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  }
};

describe('BookingFormDialog', () => {
  it('shows an overlapping booking in a banner and keeps the dialog open', async () => {
    const api = installMockApi();
    signIn();
    const { existing, room, location, member } = findBookedSlot(api);
    const start = utcToZoned(existing.startsAt, location.timezone);
    const end = utcToZoned(existing.endsAt, location.timezone);
    const emit = vi.spyOn(notify, 'emit');
    const onHide = vi.fn();
    const { user } = renderWithProviders(
      <BookingFormDialog
        defaults={{ roomId: room.id, memberId: member.id }}
        visible
        onHide={onHide}
      />,
    );
    await screen.findByText(new RegExp(`${location.name} local time`));

    await fillTime(user, start.date, start.time, end.time);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('The room is already booked for this time.'),
    ).toBeInTheDocument();
    expect(onHide).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('puts a capacity problem under the attendees field', async () => {
    const api = installMockApi();
    signIn();
    const { room, location, member } = findBookedSlot(api);
    const { user } = renderWithProviders(
      <BookingFormDialog
        defaults={{ roomId: room.id, memberId: member.id }}
        visible
        onHide={vi.fn()}
      />,
    );
    await screen.findByText(new RegExp(`${location.name} local time`));

    await fillTime(user, '2026-12-01', '10:00', '11:00');
    const attendees = screen.getByLabelText('Attendees');
    await user.clear(attendees);
    await user.type(attendees, String(room.capacity + 1));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(`This room seats up to ${room.capacity}`)).toBeInTheDocument();
  });
});
