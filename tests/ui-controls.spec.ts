// Behavior tests for the code overlay + share controls (Phase 1 stretch).
// These assert DOM/interaction behavior (not pixels), so they're stable across
// the environmental anti-aliasing drift that plagues the visual snapshots.

import { test, expect } from '@playwright/test';

test.describe('UI controls', () => {
  test('cluster is hidden on the lobby, shown on a chapter', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.lobby-grid');
    const cluster = page.locator('.chronicle-controls');
    await expect(cluster).toHaveClass(/is-hidden/);

    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await expect(cluster).not.toHaveClass(/is-hidden/);
  });

  test('? opens the code overlay with real, highlighted source; Esc closes it', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600);

    await page.keyboard.press('?');
    const overlay = page.locator('.code-overlay');
    await expect(overlay).toHaveClass(/is-open/);
    // Real source is present (a token from arpanet/index.ts) and highlighted.
    await expect(overlay.locator('.code-pre')).toContainText('phosphor');
    await expect(overlay.locator('.hl-comment').first()).toBeVisible();
    // Two curated tabs for ARPANET.
    await expect(overlay.locator('.code-tab')).toHaveCount(2);

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/is-open/);
  });

  test('switching tabs swaps the file path', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600);
    await page.keyboard.press('?');

    const path = page.locator('.code-head-path');
    await expect(path).toHaveText(/index\.ts/);
    await page.locator('.code-tab', { hasText: 'terminal.ts' }).click();
    await expect(path).toHaveText(/terminal\.ts/);
  });

  test('s triggers the share flow and surfaces a toast (no crash)', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600);

    // Headless has no navigator.share and no clipboard image write, so the flow
    // falls through to the download path. We assert the toast renders and the
    // pipeline resolves to a terminal (non-pending) state without throwing.
    await page.keyboard.press('s');
    const toast = page.locator('.chronicle-toast');
    await expect(toast).toBeVisible();
    // Eventually leaves the "Rendering…" pending state.
    await expect(toast).not.toHaveClass(/toast--pending/, { timeout: 8000 });
  });
});
