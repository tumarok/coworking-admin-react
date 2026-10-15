import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
const API = 'http://localhost:4010/api/v1';

/**
 * End-to-end tests against a production build and the TypeScript mock API. The mock keeps state in
 * memory, so tests run one at a time and reset it before each test.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-GB',
    timezoneId: 'Europe/Kyiv',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'npm run mock',
      url: `${API}/auth/me`,
      env: { PORT: '4010', MOCK_LATENCY_MS: '0' },
      reuseExistingServer: !CI,
    },
    {
      command: 'npm run build && npm run preview',
      url: 'http://localhost:4173',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
