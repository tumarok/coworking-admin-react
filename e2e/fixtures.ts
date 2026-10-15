import { type APIRequestContext, type Page, test as base, expect } from '@playwright/test';

export const API = 'http://localhost:4010/api/v1';
export const ADMIN = { email: 'admin@coworking.test', password: 'demo1234' };
const TOKEN_KEY = 'coworking-admin.token';

/** A small client for arranging data through the API instead of clicking through the UI. */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    readonly token: string,
  ) {}

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await this.request.post(`${API}${path}`, {
      data,
      headers: { Authorization: `Bearer ${this.token}` },
    });
    expect(res.ok(), `POST ${path}: ${res.status()} ${await res.text()}`).toBe(true);
    return (await res.json()) as T;
  }

  async get<T>(path: string): Promise<T> {
    const res = await this.request.get(`${API}${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    expect(res.ok(), `GET ${path}: ${res.status()}`).toBe(true);
    return (await res.json()) as T;
  }
}

interface Fixtures {
  /** API client authenticated as the demo admin; the mock data is reset before each test. */
  api: ApiClient;
  /** A page already signed in as the demo admin. */
  signedInPage: Page;
}

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await request.post(`${API}/__reset`);
    const login = await request.post(`${API}/auth/login`, { data: ADMIN });
    const { token } = (await login.json()) as { token: string };
    await use(new ApiClient(request, token));
  },
  signedInPage: async ({ page, api }, use) => {
    await page.addInitScript(([key, token]) => sessionStorage.setItem(key, token), [
      TOKEN_KEY,
      api.token,
    ] as const);
    await use(page);
  },
});

export { expect };

/** "YYYY-MM-DD" a number of days from today (UTC). */
export const daysFromToday = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/** Picks an option in a PrimeReact dropdown with a filter box. */
export const choose = async (page: Page, inputId: string, text: string) => {
  await page.locator(`.p-dropdown:has(#${inputId})`).click();
  await page.locator('.p-dropdown-filter').fill(text);
  await page
    .getByRole('option', { name: new RegExp(text) })
    .first()
    .click();
  await expect(page.locator('.p-dropdown-panel')).toBeHidden();
};
