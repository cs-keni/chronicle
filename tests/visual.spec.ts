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

test.describe('e2e flow', () => {
  // Verifies the full Phase 1 critical path:
  // ARPANET → scroll to dwell zone → CRT transition fires → Figma Era active.
  // WebGL canvas output is not screenshot-compared (headless compositing limitation),
  // but DOM state after the transition is verified.
  test('ARPANET → Figma Era transition', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600); // overlay fade

    // Get the ARPANET spacer's full scroll range from the DOM
    const { spacerTop, spacerHeight } = await page.evaluate(() => {
      const spacer = document.querySelector<HTMLElement>(
        '.chapter-scroll-spacer[data-chapter-id="arpanet"]'
      )!;
      return {
        spacerTop: spacer.offsetTop,
        spacerHeight: spacer.offsetHeight,
      };
    });

    // Scroll to the very end of the ARPANET spacer to fire the transition.
    // progress=1 fires transitionRequest('arpanet', 'figma-era').
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), spacerTop + spacerHeight);

    // Wait for Figma Era to become active (final chapter swap, not the temporary
    // capture position). The transition engine sets transform='translateX(0)' +
    // visibility='hidden' during html2canvas capture, then restores visibility=''
    // after capture. The real activation sets transform='translateX(0)' with no
    // visibility override, so we gate on both conditions.
    await page.waitForFunction(() => {
      const figmaEl = document.getElementById('chapter-figma-era');
      const transform = figmaEl?.style.transform ?? '';
      const visibility = figmaEl?.style.visibility ?? '';
      return (transform === 'translateX(0)' || transform === 'translateX(0px)')
             && visibility !== 'hidden';
    }, { timeout: 8000 });

    // Verify Figma Era card content is in the DOM
    const cardCount = await page.locator('.figma-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Verify ARPANET is off-screen
    const arpanetTransform = await page.evaluate(() =>
      document.getElementById('chapter-arpanet')?.style.transform
    );
    expect(arpanetTransform).toMatch(/translateX\(-100vw\)/);

    // Verify scroll lock was released (transition completed)
    const scrollLocked = await page.evaluate(() =>
      document.body.classList.contains('scroll-locked')
    );
    expect(scrollLocked).toBe(false);
  });
});
