import { choose, daysFromToday, expect, test } from './fixtures';

interface Created {
  id: string;
}

test.describe('booking rules', () => {
  test('refuses an overlapping booking and keeps the form open', async ({
    signedInPage: page,
    api,
  }) => {
    const location = await api.post<Created>('/locations', {
      name: 'Rules Hub',
      city: 'Kyiv',
      address: '9 Rules Street',
      timezone: 'Europe/Kyiv',
      opensAt: '08:00',
      closesAt: '20:00',
      status: 'active',
    });
    const room = await api.post<Created>('/rooms', {
      locationId: location.id,
      name: 'Onyx',
      type: 'meeting_room',
      capacity: 6,
      hourlyRate: 2500,
      amenities: [],
      status: 'available',
    });
    const members = await api.get<{ items: { id: string; lastName: string }[] }>(
      '/members?status=active&limit=1',
    );
    const member = members.items[0];
    if (!member) throw new Error('no active member');

    // Book through the UI twice: the second attempt must hit the first one.
    const book = async () => {
      await page.goto(`/rooms/${room.id}`);
      await page.getByRole('button', { name: 'Book this room' }).click();
      await choose(page, 'booking-member', member.lastName);
      await page.getByLabel(/^Date/).fill(daysFromToday(20));
      await page.getByLabel('From', { exact: true }).fill('12:00');
      await page.getByLabel('To', { exact: true }).fill('13:00');
      await page.getByRole('button', { name: 'Save' }).click();
    };

    await book();
    await expect(page.locator('.p-toast-message', { hasText: 'Booking created' })).toBeVisible();

    await book();
    await expect(page.getByText('The room is already booked for this time.')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'New booking' })).toBeVisible();
  });

  test('cancels bookings in bulk', async ({ signedInPage: page }) => {
    await page.goto('/bookings?status=pending');
    const rows = page.locator('.p-datatable-tbody tr');
    await expect(rows.first()).toBeVisible();
    const before = await page.locator('.p-paginator-current').textContent();

    await rows.nth(0).locator('.p-checkbox').click();
    await rows.nth(1).locator('.p-checkbox').click();
    await expect(page.getByText('2 selected')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel bookings' }).click();

    await expect(
      page.locator('.p-toast-message', { hasText: '2 bookings cancelled' }),
    ).toBeVisible();
    await expect(page.locator('.p-paginator-current')).not.toHaveText(before ?? '');
  });
});
