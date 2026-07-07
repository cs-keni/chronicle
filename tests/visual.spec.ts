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

    // Release the router's nav latch with a genuine user gesture. The router
    // holds the active chapter until the user actually scrolls, so that stale
    // GSAP reconciliation callbacks during a hash-nav can't fire a spurious
    // transition (the #figma-era → ARPANET race). A real wheel event is what a
    // user does; a programmatic scrollTo alone no longer drives the transition.
    // (mouse.move first — a wheel at (0,0) isn't delivered to the window listener.)
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100); // let the wheel handler release the latch

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

  // Regression: direct/deep-link entry to #figma-era must land ON Figma Era.
  // The bug: on a networked host (Vercel), GSAP's reconciliation callbacks fired
  // after the old fixed 200ms suppression window, calling activate('arpanet')
  // and stranding Figma Era off-screen — so the Figma card's Explore button and
  // cold deep-links showed ARPANET instead. Intermittent (timing-dependent), so
  // this asserts the invariant that the router's target is the visible chapter.
  test('deep-link to #figma-era lands on Figma Era, not ARPANET', async ({ page }) => {
    await page.goto('/#figma-era');
    await page.waitForSelector('.figma-card');
    await page.waitForFunction(() => {
      const overlay = document.getElementById('transition-overlay');
      return overlay ? parseFloat(window.getComputedStyle(overlay).opacity) < 0.05 : true;
    });
    await page.waitForTimeout(300);

    const state = await page.evaluate(() => ({
      figma: getComputedStyle(document.getElementById('chapter-figma-era')!).transform,
      arpanet: getComputedStyle(document.getElementById('chapter-arpanet')!).transform,
    }));
    // Figma Era on-screen (identity matrix / translateX(0)), ARPANET off-screen.
    expect(state.figma).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
    expect(state.arpanet).not.toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
  });

  // Regression (deterministic): the nav latch holds the router's chapter until a
  // genuine user gesture. A programmatic scroll to the dwell zone must NOT fire
  // the transition on its own — only a real user scroll does. Without the fix,
  // the old time-based window expired and this programmatic scroll fired the
  // transition, which is the same mechanism that broke deep-link entry.
  test('nav latch: programmatic scroll does not fire transition until user gesture', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600);

    const { top, height } = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(
        '.chapter-scroll-spacer[data-chapter-id="arpanet"]'
      )!;
      return { top: s.offsetTop, height: s.offsetHeight };
    });
    const end = top + height;

    // Programmatic jump to dwell — no user gesture. Wait well past the old 200ms
    // window to prove the latch is state-based, not time-based.
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), end);
    await page.waitForTimeout(400);

    const figmaActiveBeforeGesture = await page.evaluate(() => {
      const t = document.getElementById('chapter-figma-era')!.style.transform;
      return t === 'translateX(0)' || t === 'translateX(0px)';
    });
    expect(figmaActiveBeforeGesture).toBe(false); // latch held → ARPANET still active

    // Reset to mid-chapter so the next forward jump re-crosses into the dwell
    // zone (onUpdate only fires the transition on a progress<1 → progress≥1 cross).
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height * 0.5);
    await page.waitForTimeout(50);

    // A genuine user gesture releases the latch; scrolling to dwell now transitions.
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100); // let the wheel handler release the latch
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), end);
    await page.waitForFunction(() => {
      const f = document.getElementById('chapter-figma-era');
      const t = f?.style.transform ?? '';
      return (t === 'translateX(0)' || t === 'translateX(0px)') && f!.style.visibility !== 'hidden';
    }, { timeout: 8000 });
  });
});
