import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Playwright owns *.spec.ts; Vitest owns tests/unit/*.test.ts. Without this,
  // Playwright's default testMatch also grabs *.test.ts and tries to run the
  // Vitest suite, which explodes (Vitest internal-state error).
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    // Reuse an already-running dev server in development
    reuseExistingServer: true,
  },
});
