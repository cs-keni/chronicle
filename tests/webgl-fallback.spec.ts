// TODO-006 — WebGL2-absent hardening.
//
// `webgl.ts` builds its engine eagerly at module scope (`export const webgl = new
// WebGLEngine()`), and `main.ts` imports it. If `getContext('webgl2')` returns null,
// a throw there happens during module *evaluation* — which kills the entire module
// graph. The user doesn't lose transitions, they lose the whole site: a blank page.
//
// That's not hypothetical. WebGL2 is absent on Safari before 15, on browsers where the
// user disabled WebGL, on blocklisted GPUs, and routinely inside VMs and remote
// desktops. Chronicle should degrade to its existing `fadeSwap` path there, exactly as
// it already does for touch devices and reduced-motion users.
//
// These tests simulate that by nulling the webgl/webgl2 contexts before any app code
// runs. The 2d context is left alone — html2canvas needs it.

import { test, expect } from '@playwright/test';

// Null out WebGL before the app's module graph evaluates.
async function disableWebGL(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
        return null;
      }
      // eslint-disable-next-line prefer-spread
      return (original as (...a: unknown[]) => unknown).apply(this, [type, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

test.describe('WebGL2 absent', () => {
  test('the site still boots — no module-graph crash', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await disableWebGL(page);
    await page.goto('/');

    // The lobby renders, which means main.ts finished evaluating.
    await expect(page.locator('.lobby-grid')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('a chapter deep-link still renders', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await disableWebGL(page);
    await page.goto('/#arpanet');

    await expect(page.locator('.arpanet-terminal')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('transitions degrade to fadeSwap instead of hanging the scroll lock', async ({
    page,
  }) => {
    await disableWebGL(page);
    await page.goto('/#arpanet');
    await page.waitForSelector('.arpanet-terminal');
    await page.waitForTimeout(600); // overlay fade

    // Genuine gesture releases the nav latch (see visual.spec.ts).
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);

    const { top, height } = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>(
        '.chapter-scroll-spacer[data-chapter-id="arpanet"]',
      )!;
      return { top: s.offsetTop, height: s.offsetHeight };
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height);

    // Early Web becomes genuinely active — the fade path completed the swap.
    await page.waitForFunction(
      () => {
        const el = document.getElementById('chapter-early-web');
        const t = el?.style.transform ?? '';
        return (
          (t === 'translateX(0)' || t === 'translateX(0px)') && el!.style.visibility !== 'hidden'
        );
      },
      undefined,
      { timeout: 8000 },
    );

    await expect(page.locator('.ew-browser')).toBeVisible();

    // Scroll lock released promptly. The chapter goes active at fadeSwap's midpoint,
    // so the unlock lands ~150ms later in the `finally` — hence a bounded wait rather
    // than an instantaneous read. A hung lock (the failure mode this guards) still fails.
    await page.waitForFunction(
      () => !document.body.classList.contains('scroll-locked'),
      undefined,
      { timeout: 3000 },
    );
  });
});
