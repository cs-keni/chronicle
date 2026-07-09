import { defineConfig } from 'vitest/config';

// Pure-logic unit layer (Phase 2, Codex T3). Node env, no browser/DOM — those
// stay in Playwright. Kept narrow: only tests/unit/** so it never collides with
// the Playwright specs under tests/.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
