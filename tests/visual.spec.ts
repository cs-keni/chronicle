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
  // Scroll a chapter's spacer to its end to fire its onward transition, then wait
  // for `toId` to become the truly-active chapter (transform=translateX(0) AND not
  // the temporary visibility=hidden capture position the transition engine uses).
  async function scrollChapterToEnd(page: import('@playwright/test').Page, fromId: string, toId: string) {
    const { top, height } = await page.evaluate((id) => {
      const s = document.querySelector<HTMLElement>(
        `.chapter-scroll-spacer[data-chapter-id="${id}"]`
      )!;
      return { top: s.offsetTop, height: s.offsetHeight };
    }, fromId);

    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height);

    await page.waitForFunction((id) => {
      const el = document.getElementById(`chapter-${id}`);
      const transform = el?.style.transform ?? '';
      const visibility = el?.style.visibility ?? '';
      return (transform === 'translateX(0)' || transform === 'translateX(0px)')
             && visibility !== 'hidden';
    }, toId, { timeout: 8000 });
  }

  // R1 — the Phase 1 direct ARPANET → Figma Era transition no longer exists. The
  // canonical path is now a THREE-chapter chain:
  //   ARPANET → (CRT power-off) → Early Web → (glass-shatter) → Figma Era.
  // WebGL output isn't screenshot-compared (headless compositing limit), but the DOM
  // state after each transition is verified.
  test('ARPANET → Early Web → Figma Era transition chain', async ({ page }) => {
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600); // overlay fade

    // Release the router's nav latch with a genuine user gesture (see nav-latch
    // test below). Once released it stays released for the rest of the session, so
    // both onward transitions in the chain fire on plain programmatic scrolls.
    // (mouse.move first — a wheel at (0,0) isn't delivered to the window listener.)
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);

    // Leg 1: ARPANET → Early Web (CRT power-off).
    await scrollChapterToEnd(page, 'arpanet', 'early-web');
    expect(await page.locator('.ew-browser').count()).toBeGreaterThanOrEqual(1);

    // Leg 2: Early Web → Figma Era (glass-shatter).
    await scrollChapterToEnd(page, 'early-web', 'figma-era');
    const cardCount = await page.locator('.figma-card').count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Both prior chapters are off-screen; scroll lock released.
    const state = await page.evaluate(() => ({
      arpanet: document.getElementById('chapter-arpanet')?.style.transform,
      earlyWeb: document.getElementById('chapter-early-web')?.style.transform,
      locked: document.body.classList.contains('scroll-locked'),
    }));
    expect(state.arpanet).toMatch(/translateX\(-100vw\)/);
    expect(state.earlyWeb).toMatch(/translateX\(-100vw\)/);
    expect(state.locked).toBe(false);
  });

  // The Early Web chapter renders its period frame + revealed facts on entry.
  test('Early Web renders the Mosaic frame and facts', async ({ page }) => {
    await page.goto('/#early-web');
    await page.waitForSelector('.ew-browser');
    await page.waitForFunction(() => {
      const overlay = document.getElementById('transition-overlay');
      return overlay ? parseFloat(window.getComputedStyle(overlay).opacity) < 0.05 : true;
    });
    await page.waitForTimeout(700); // arrival assembly + first fact reveal

    // Browser chrome is present.
    await expect(page.locator('.ew-location-field')).toContainText('chronicle.net/early-web');
    // At least the first fact has revealed.
    await expect(page.locator('.ew-fact.is-revealed').first()).toBeVisible();
    // The hit-counter (progress indicator) exists.
    await expect(page.locator('#ew-counter-digits')).toBeVisible();
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

  // R2 — deep-link entry to the INSERTED middle chapter must land on Early Web, not
  // strand on a neighbor. Same nav-latch invariant as the #figma-era regression, but
  // proves the guard holds now that a third chapter sits between the two originals.
  test('deep-link to #early-web lands on Early Web', async ({ page }) => {
    await page.goto('/#early-web');
    await page.waitForSelector('.ew-browser');
    await page.waitForFunction(() => {
      const overlay = document.getElementById('transition-overlay');
      return overlay ? parseFloat(window.getComputedStyle(overlay).opacity) < 0.05 : true;
    });
    await page.waitForTimeout(300);

    const state = await page.evaluate(() => ({
      earlyWeb: getComputedStyle(document.getElementById('chapter-early-web')!).transform,
      arpanet: getComputedStyle(document.getElementById('chapter-arpanet')!).transform,
      figma: getComputedStyle(document.getElementById('chapter-figma-era')!).transform,
    }));
    // Early Web on-screen; both neighbors off-screen.
    expect(state.earlyWeb).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
    expect(state.arpanet).not.toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
    expect(state.figma).not.toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/);
  });

  // R2 (deterministic): the nav latch holds the router's chapter until a genuine
  // user gesture. A programmatic scroll to the dwell zone must NOT fire the
  // transition on its own — only a real user scroll does. Now that ARPANET's onward
  // target is Early Web (not Figma), this asserts the latch still guards the FIRST
  // hop of the three-chapter chain.
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

    const earlyWebActiveBeforeGesture = await page.evaluate(() => {
      const t = document.getElementById('chapter-early-web')!.style.transform;
      return t === 'translateX(0)' || t === 'translateX(0px)';
    });
    expect(earlyWebActiveBeforeGesture).toBe(false); // latch held → ARPANET still active

    // Reset to mid-chapter so the next forward jump re-crosses into the dwell
    // zone (onUpdate only fires the transition on a progress<1 → progress≥1 cross).
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height * 0.5);
    await page.waitForTimeout(50);

    // A genuine user gesture releases the latch; scrolling to dwell now transitions
    // ARPANET → Early Web.
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100); // let the wheel handler release the latch
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), end);
    await page.waitForFunction(() => {
      const el = document.getElementById('chapter-early-web');
      const t = el?.style.transform ?? '';
      return (t === 'translateX(0)' || t === 'translateX(0px)') && el!.style.visibility !== 'hidden';
    }, { timeout: 8000 });
  });
});
