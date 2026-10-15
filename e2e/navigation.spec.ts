import { expect, test } from './fixtures';

test.describe('navigation', () => {
  test('shows the dashboard with figures', async ({ signedInPage: page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Active members')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Occupancy by location' })).toBeVisible();
  });

  test('keeps list filters in the URL', async ({ signedInPage: page }) => {
    await page.goto('/rooms');
    await page.getByRole('searchbox', { name: 'Search rooms' }).fill('aurora');
    await expect(page).toHaveURL(/\?q=aurora$/);
    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Search rooms' })).toHaveValue('aurora');
  });

  test('shows a not-found page for unknown routes and records', async ({ signedInPage: page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

    await page.goto('/bookings/bk_missing');
    await expect(page.getByRole('heading', { name: 'Booking not found' })).toBeVisible();
  });
});
