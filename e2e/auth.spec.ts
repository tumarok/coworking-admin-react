import { ADMIN, expect, test } from './fixtures';

test.describe('authentication', () => {
  test('sends a signed-out visitor to the login page and back after signing in', async ({
    page,
    api,
  }) => {
    void api; // resets the mock
    await page.goto('/members');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/members$/);
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
  });

  test('shows a wrong password inside the form', async ({ page, api }) => {
    void api;
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password', { exact: true }).fill('not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page.locator('.p-toast-message')).toHaveCount(0);
  });

  test('signs out', async ({ page, api }) => {
    void api;
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password', { exact: true }).fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/bookings');
    await expect(page).toHaveURL(/\/login$/);
  });
});
