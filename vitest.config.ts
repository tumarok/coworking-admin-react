import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
      // fetch in Node needs an absolute URL; the app itself talks to a relative /api/v1.
      env: { VITE_API_URL: 'http://localhost/api/v1' },
      css: { modules: { classNameStrategy: 'non-scoped' } },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
        exclude: ['**/*.test.{ts,tsx}', 'src/app/main.tsx', 'server/index.ts'],
      },
    },
  }),
);
