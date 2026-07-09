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
  // Tolerate sub-2% environmental anti-aliasing drift on idle snapshots (the
  // known ARPANET/lobby AA flake that failed on a clean tree). Real content
  // regressions move far more than 2% of pixels; this only absorbs GPU/font AA
  // noise between environments. (T12)
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
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
