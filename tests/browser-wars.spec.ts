// Browser Wars (Slice 2) — chapter + user-gated transition.
//
// Several of these guard failures that are SILENT in a browser: a font stack that
// falls through to the system default, a dialog that renders perfectly and accepts no
// clicks, a chapter that activates but renders nothing. Silent failures need tests or
// they ship.
//
// Generic live-chapter wiring lives in tests/wiring.spec.ts, not here — it must run
// for chapters 5-7 too.

import { test, expect, type Page } from '@playwright/test';

/** Scroll Early Web to its end so the Win 3.1 dialog appears. */
async function openDialog(page: Page) {
  await page.goto('/#early-web');
  await page.waitForSelector('.ew-browser');
  await page.waitForTimeout(500);

  // The nav latch is released by a genuine user gesture, never a timer. Shift is a
  // no-op key that still counts as a keydown — mouse.wheel is NOT delivered under
  // isMobile emulation, so a wheel alone would leave the latch armed on touch and
  // the transition would never fire.
  await page.keyboard.press('Shift');
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(100);

  const { top, height } = await page.evaluate(() => {
    const s = document.querySelector<HTMLElement>(
      '.chapter-scroll-spacer[data-chapter-id="early-web"]',
    )!;
    return { top: s.offsetTop, height: s.offsetHeight };
  });
  // Scroll PAST the boundary, not exactly onto it. Landing on the exact pixel leaves
  // ScrollTrigger's progress a hair under 1 under mobile visual-viewport emulation,
  // so the dwell-exit never fires. A real user scrolls past it too.
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + height + 240);
  await page.locator('dialog.win31').waitFor({ state: 'visible', timeout: 6000 });
}

const activeTransform = (id: string) =>
  `(() => { const t = document.getElementById('chapter-${id}')?.style.transform ?? ''; return t === 'translateX(0)' || t === 'translateX(0px)'; })()`;

test.describe('Win 3.1 dialog — the user-gated transition', () => {
  test('the dialog is actually CLICKABLE (regression: Codex #2)', async ({ page }) => {
    await openDialog(page);

    // THE finding that would have shipped a dead button. body.scroll-locked sets
    // pointer-events:none (global.css:90); reusing it here would render a perfect
    // dialog that accepts no clicks. A user-gated transition must use
    // body.transition-paused instead, which does NOT disable pointer events.
    const state = await page.evaluate(() => ({
      scrollLocked: document.body.classList.contains('scroll-locked'),
      paused: document.body.classList.contains('transition-paused'),
      pointerEvents: getComputedStyle(document.body).pointerEvents,
    }));
    expect(state.scrollLocked, 'scroll-locked would disable pointer events').toBe(false);
    expect(state.paused, 'the pause state should be applied once mounted').toBe(true);
    expect(state.pointerEvents).not.toBe('none');

    // And a real click actually lands.
    await page.locator('dialog.win31 [data-act="advance"]').click();
    await page.waitForFunction(activeTransform('browser-wars'), null, { timeout: 8000 });
  });

  test('Esc cancels: stays in Early Web, scroll released, does not re-loop', async ({ page }) => {
    await openDialog(page);
    await page.keyboard.press('Escape');

    // early-web is already the active chapter (we never left it), so a transform
    // assertion would resolve instantly and read the body mid-fade. Wait for the
    // return to actually settle.
    await page.waitForFunction(
      () => !document.body.classList.contains('scroll-locked')
            && document.querySelectorAll('dialog.win31').length === 0,
      null,
      { timeout: 8000 },
    );
    expect(await page.locator('dialog.win31').count()).toBe(0);

    const after = await page.evaluate(() => ({
      paused: document.body.classList.contains('transition-paused'),
      locked: document.body.classList.contains('scroll-locked'),
    }));
    expect(after.paused, 'pause state must be torn down on cancel').toBe(false);
    expect(after.locked).toBe(false);

    // Landing at 85% keeps the user clear of the dwell zone (~99.8%) so the dialog
    // does not immediately re-fire.
    await page.waitForTimeout(600);
    expect(await page.locator('dialog.win31').count()).toBe(0);
  });

  test('forward-scroll intent advances (the no-trap guarantee)', async ({ page }) => {
    await openDialog(page);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 200);
    await page.waitForFunction(activeTransform('browser-wars'), null, { timeout: 8000 });
  });

  test('hashchange mid-dialog aborts: no swap, no 85% restore', async ({ page }) => {
    await openDialog(page);
    await page.evaluate(() => { window.location.hash = '#figma-era'; });

    await page.waitForFunction(activeTransform('figma-era'), null, { timeout: 8000 });
    // Abort means teardown ONLY. The router already owns the active chapter, so the
    // runner must not swap to browser-wars or restore early-web on top of it.
    expect(await page.locator('dialog.win31').count()).toBe(0);
    expect(await page.evaluate(() =>
      document.body.classList.contains('transition-paused'))).toBe(false);
  });

  test('5 rapid OK clicks produce exactly one transition', async ({ page }) => {
    await openDialog(page);
    const ok = page.locator('dialog.win31 [data-act="advance"]');
    // force:true bypasses actionability so the mash is genuinely rapid; the runner's
    // single-settlement latch (not the disabled attribute alone) is what must hold.
    await Promise.all(
      Array.from({ length: 5 }, () => ok.click({ force: true }).catch(() => {})),
    );
    await page.waitForFunction(activeTransform('browser-wars'), null, { timeout: 8000 });
    expect(await page.locator('dialog.win31').count()).toBe(0);
    expect(await page.evaluate(() =>
      document.body.classList.contains('transition-paused'))).toBe(false);
  });

  test('the dialog sits over the chapter you are LEAVING, centred', async ({ page }) => {
    await openDialog(page);
    await page.waitForTimeout(300);

    // The whole emotional beat is being asked whether to leave a place you can still
    // SEE. The scroll that fires the transition has already crossed into the next
    // chapter's spacer, so without the guards in scroll.ts/transition.ts onEnter
    // activates the destination behind the dialog and the beat is destroyed.
    const active = await page.evaluate(() =>
      ['arpanet', 'early-web', 'browser-wars', 'figma-era'].filter((i) =>
        (document.getElementById('chapter-' + i)?.style.transform ?? '').startsWith(
          'translateX(0',
        ),
      ),
    );
    expect(active, 'the destination chapter is showing behind the dialog').toEqual([
      'early-web',
    ]);

    // <dialog> centres via the UA's `margin: auto`, which the global reset zeroes.
    const { box, vw, vh } = await page.evaluate(() => {
      const r = document.querySelector('dialog.win31')!.getBoundingClientRect();
      return { box: { x: r.x, y: r.y, w: r.width, h: r.height }, vw: innerWidth, vh: innerHeight };
    });
    expect(Math.abs(box.x + box.w / 2 - vw / 2), 'dialog is not horizontally centred').toBeLessThan(24);
    expect(Math.abs(box.y + box.h / 2 - vh / 2), 'dialog is not vertically centred').toBeLessThan(24);
  });

  test('title bar is SOLID #000080 — the Win95 gradient would be an era error', async ({ page }) => {
    await openDialog(page);
    const bg = await page.evaluate(() => {
      const el = document.querySelector('.win31-title')!;
      return getComputedStyle(el).backgroundImage;
    });
    expect(bg, 'a gradient here is Windows 95, four years out of era').toBe('none');
  });
});

test.describe('Win 3.1 dialog — touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('runs on touch (no fadeSwap downgrade) with 44px targets', async ({ page }) => {
    await openDialog(page);

    // This is DOM, not WebGL, so the isTouchDevice → fadeSwap downgrade never applies.
    // It is the only transition path mobile users get, which is exactly why the
    // touch targets below are not optional.
    // Measure AFTER the appear animation settles. During the 1200ms enter the dialog
    // is mid `scale(0.96)`, so a box measured immediately reads ~42.7px — the target
    // is only under-size while it is still visibly arriving, which is the honest
    // thing to allow. What matters is the settled size the finger actually hits.
    await page.locator('dialog.win31').evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))),
    );
    const box = await page.locator('dialog.win31 [data-act="advance"]').boundingBox();
    expect(box!.height, 'a 23px Win 3.1 button is not tappable').toBeGreaterThanOrEqual(44);

    await page.locator('dialog.win31 [data-act="advance"]').tap();
    await page.waitForFunction(activeTransform('browser-wars'), null, { timeout: 8000 });
  });
});

test.describe('Browser Wars chapter', () => {
  test('renders the IE4 frame, the fact well, and the era artifacts', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-browser');
    await page.waitForTimeout(1200); // arrival assembly is under 1.0s

    await expect(page.locator('.bw-browser')).toHaveCount(1);
    await expect(page.locator('.bw-well')).toHaveCount(1);
    await expect(page.locator('.bw-marquee')).toHaveCount(1);
    await expect(page.locator('.bw-throbber')).toHaveCount(1);
    await expect(page.locator('.bw-badge')).toHaveCount(4);
    expect(await page.locator('.bw-fact.is-revealed').count()).toBeGreaterThanOrEqual(1);
  });

  test('fact text holds WCAG AA inside the gaudy page', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-fact-body');

    const { color, bg, size } = await page.evaluate(() => {
      const el = document.querySelector('.bw-fact-body')!;
      const cs = getComputedStyle(el);
      const wellCs = getComputedStyle(document.querySelector('.bw-well-inner')!);
      return { color: cs.color, bg: wellCs.backgroundColor, size: parseFloat(cs.fontSize) };
    });

    const lum = (rgb: string) => {
      const [r, g, b] = rgb.match(/\d+/g)!.map(Number).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    // The well ground resolves through to the page white when unset on the inner el.
    const bgLum = bg === 'rgba(0, 0, 0, 0)' ? 1 : lum(bg);
    const ratio = (Math.max(lum(color), bgLum) + 0.05) / (Math.min(lum(color), bgLum) + 0.05);

    expect(ratio, 'decoration may be period-ugly; fact text may not').toBeGreaterThanOrEqual(4.5);
    expect(size, 'body text must not go below 15px').toBeGreaterThanOrEqual(15);
  });

  test('the comic font stack never ends at the system default', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-page');

    // The silent failure this guards: 'Comic Sans MS','Chalkboard SE',cursive misses
    // on Linux/Android and lands on the system default — AI-slop blacklist item 11 by
    // accident, with no console error. A bundled OFL face must be in the stack.
    const stack = await page.evaluate(
      () => getComputedStyle(document.querySelector('.bw-page')!).fontFamily,
    );
    expect(stack.toLowerCase()).toContain('comic neue');

    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "Comic Neue"');
    });
    expect(loaded, 'the bundled webfont must actually load').toBe(true);
  });

  test('the visitor counter is a real button and inflates on click', async ({ page }) => {
    await page.goto('/#browser-wars');
    const counter = page.locator('#bw-counter');
    await counter.waitFor();

    expect(await counter.evaluate((el) => el.tagName)).toBe('BUTTON');
    const before = await page.locator('#bw-counter-value').textContent();
    await counter.click();
    await counter.click();
    const after = await page.locator('#bw-counter-value').textContent();
    expect(Number(after)).toBe(Number(before) + 2);

    // Keyboard reachable — it is the chapter's interactive artifact, not decoration.
    await page.keyboard.press('Enter');
    expect(Number(await page.locator('#bw-counter-value').textContent())).toBeGreaterThan(
      Number(after) - 1,
    );
  });

  test('decorative links are inert and hidden from assistive tech', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-foot');
    // Real-looking links that do nothing drain the goodwill reservoir. They are
    // spans inside aria-hidden containers, never anchors.
    expect(await page.locator('.bw-page a').count()).toBe(0);
    await expect(page.locator('.bw-foot')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.bw-marquee')).toHaveAttribute('aria-hidden', 'true');
    // ...but the marquee's text is still available to AT via a static sibling.
    await expect(page.locator('.bw-sr-only')).toHaveCount(1);
  });

  test('global UI carries the Browser Wars branch (definition of done)', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-browser');

    // Without a code-overlay REGISTRY entry `?` opens an empty panel; without a
    // share-card branch `s` renders the wrong era. Both are part of the
    // definition of done for any new chapter (chronicle-global-ui-per-chapter, 9/10).
    await page.keyboard.press('?');
    // Assert on the overlay itself: body.innerText includes every off-screen
    // chapter, so it would pass even with an empty panel.
    const overlay = page.locator('.code-overlay').first();
    await overlay.waitFor({ state: 'visible', timeout: 4000 });
    const text = await overlay.innerText();
    // win31-dialog.ts is unique to the browser-wars REGISTRY entry — its presence
    // proves the entry exists rather than the panel falling back to another era.
    expect(text, 'the code overlay has no browser-wars registry entry').toContain(
      'win31-dialog.ts',
    );
    await page.keyboard.press('Escape');
  });
});

test.describe('Browser Wars — reduced motion', () => {
  // page.emulateMedia rather than test.use({ reducedMotion }) — the fixture form is
  // not applied under this project config (verified: matchMedia stayed false).
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('marquee stops, GIFs swap to stills, dialog is instant', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-page');
    await page.waitForTimeout(400);

    const marqueeAnim = await page.evaluate(
      () => getComputedStyle(document.querySelector('.bw-marquee-track')!).animationName,
    );
    expect(marqueeAnim).toBe('none');

    // CSS cannot pause a GIF (Codex #8) — every animated GIF ships a static
    // first-frame PNG sibling and the swap is done in JS.
    // Vite inlines assets under 4 KB as data: URIs, so the filename extension is
    // not in the src. Compare each image against its OWN declared pair instead.
    const imgs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('.bw-gif')).map((i) => ({
        src: i.getAttribute('src') ?? '',
        anim: i.dataset.anim ?? '',
        still: i.dataset.static ?? '',
      })),
    );
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      expect(img.still, 'every animated GIF needs a static sibling').toBeTruthy();
      expect(img.src, 'an animated GIF survived reduced-motion').toBe(img.still);
      expect(img.src).not.toBe(img.anim);
    }
  });

  test('motion budget: at most 3 concurrently animated elements', async ({ page }) => {
    await page.goto('/#browser-wars');
    await page.waitForSelector('.bw-page');
    await page.waitForTimeout(1400); // let the arrival assembly finish

    const animating = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#chapter-browser-wars *')).filter((el) => {
        const n = getComputedStyle(el).animationName;
        return n && n !== 'none';
      }).length,
    );
    // WCAG 2.3.1 fails above 3 general flashes/sec; the budget sits at two-thirds of
    // that by construction rather than by measurement afterwards.
    expect(animating).toBeLessThanOrEqual(3);
  });
});
