import { choose, daysFromToday, expect, test } from './fixtures';

test('creates a location, a room and a member, then books and confirms', async ({
  signedInPage: page,
}) => {
  // Location
  await page.goto('/locations');
  await page.getByRole('button', { name: 'New location' }).click();
  await page.getByLabel(/^Name/).fill('Test Harbour');
  await page.getByLabel(/^City/).fill('Kyiv');
  await page.getByLabel(/^Address/).fill('5 Test Embankment');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Test Harbour' })).toBeVisible();

  // Room, added from the location page
  await page.getByRole('button', { name: 'Add room' }).click();
  await page.getByLabel(/^Name/).fill('Quartz');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('link', { name: 'Quartz' })).toBeVisible();

  // Member
  await page.goto('/members');
  await page.getByRole('button', { name: 'New member' }).click();
  await page.getByLabel(/^First name/).fill('Dana');
  await page.getByLabel(/^Last name/).fill('Testova');
  await page.getByLabel(/^Email/).fill('dana.testova@example.com');
  await page.getByLabel(/^Phone/).fill('+380 44 000 00 00');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Dana Testova' })).toBeVisible();

  // Booking, started from the member page
  await page.getByRole('button', { name: 'New booking' }).click();
  await choose(page, 'booking-room', 'Quartz');
  await page.getByLabel(/^Date/).fill(daysFromToday(30));
  await page.getByLabel('From', { exact: true }).fill('10:00');
  await page.getByLabel('To', { exact: true }).fill('11:30');
  await page.getByRole('button', { name: 'Save' }).click();

  // The booking appears in the member's bookings; open it from there.
  await expect(page.locator('.p-toast-message', { hasText: 'Booking created' })).toBeVisible();
  await page.locator('.p-datatable-tbody tr').first().getByRole('link').first().click();

  await expect(page).toHaveURL(/\/bookings\/bk_/);
  await expect(page.locator('.p-tag', { hasText: 'Pending' })).toBeVisible();
  await expect(page.getByText('Test Harbour')).toBeVisible();

  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('.p-tag', { hasText: 'Confirmed' })).toBeVisible();
});
