// DOM-only visual regression baselines for Chronicle Phase 1.
// No WebGL pixel comparison — headless Chrome does not composite the WebGL
// canvas through the GPU path, so shader output cannot be screenshot-tested.
//
// Tone.js audio is silently skipped in headless (AudioContext suspended,
// no user gesture, audioUnlocked stays false). No effect on visual output.
//
// To create baselines:   npx playwright test --update-snapshots
// To run comparisons:    npx playwright test

import { test, expect } from '@playwright/test';

test.describe('visual regression', () => {
  test('lobby idle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.lobby-grid');
    // Entry stagger animation completes in ~0.4s
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('lobby-idle.png');
  });

  test('ARPANET idle', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    // Overlay fade-from-black: 0.5s ease-in
    await page.waitForTimeout(600);
    // Scroll 100px → triggers onChapterProgress (progress > lastProgress=0)
    // → terminal.fastForward() → entire typing queue flushed to DOM instantly
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('arpanet-idle.png');
  });

  test('Figma Era idle', async ({ page }) => {
    await page.goto('/#figma-era');
    await page.waitForSelector('.figma-card');
    // Wait for transition overlay to be fully transparent (opacity → 0 over 0.5s)
    await page.waitForFunction(() => {
      const overlay = document.getElementById('transition-overlay');
      return overlay ? parseFloat(window.getComputedStyle(overlay).opacity) < 0.05 : true;
    });
    // Extra buffer for boot pixel animation (600ms) to complete and be removed
    await page.waitForTimeout(700);
    await expect(page).toHaveScreenshot('figma-era-idle.png');
  });
});
