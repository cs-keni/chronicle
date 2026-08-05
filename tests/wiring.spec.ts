// T2b — live-chapter wiring completeness.
//
// The Vitest adjacency guard (tests/unit/transitions.test.ts) checks REGISTRY KEYS
// and nothing else. Codex #10 caught that a live chapter also needs a
// `#chapter-{id}` scene, a `.chapter-scroll-spacer` in the right order, and an
// `initX()` registration in main.ts — all still hand-wired across index.html and
// src/main.ts. Miss any one and the route is broken or blank while the adjacency
// test stays green.
//
// Together the two guards make a dead-end or blank chapter genuinely impossible to
// ship. (TODO-007 — generating chapter DOM from the manifest — would delete the
// need for this file entirely.)
//
// Deliberately NOT named browser-wars.spec.ts, though the Slice 2 plan proposed
// that: this guard is generic and must run for chapter 5, 6, 7 too. A generic
// invariant filed under one chapter's name is one nobody re-runs.

import { test, expect } from '@playwright/test';
import { MANIFEST } from '../src/data/manifest';

const LIVE = MANIFEST.filter((c) => c.live).sort((a, b) => a.order - b.order);

test.describe('live chapter wiring completeness', () => {
  test('every live chapter has a scene element in index.html', async ({ page }) => {
    await page.goto('/');
    for (const chapter of LIVE) {
      const scene = page.locator(`#chapter-${chapter.id}`);
      await expect(
        scene,
        `Chapter "${chapter.id}" is live in the manifest but has no #chapter-${chapter.id} ` +
          'scene in index.html. The route resolves and renders nothing.',
      ).toHaveCount(1);
    }
  });

  test('spacer order matches manifest order exactly', async ({ page }) => {
    await page.goto('/');
    const domOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.chapter-scroll-spacer')).map(
        (s) => s.dataset.chapterId,
      ),
    );

    expect(
      domOrder,
      'Spacer order in index.html has drifted from the manifest. The scroll engine ' +
        'derives "next chapter" from spacer index, so a mismatch silently sends the ' +
        'user to the wrong era.',
    ).toEqual(LIVE.map((c) => c.id));
  });

  test('every live chapter actually registers and renders', async ({ page }) => {
    for (const chapter of LIVE) {
      await page.goto(`/#${chapter.id}`);

      // Becoming truly active proves chapterManager.register() ran (main.ts wiring)
      // and that the router accepts the hash.
      await page.waitForFunction(
        (id) => {
          const el = document.getElementById(`chapter-${id}`);
          const t = el?.style.transform ?? '';
          return t === 'translateX(0)' || t === 'translateX(0px)';
        },
        chapter.id,
        { timeout: 10000 },
      );

      // Non-empty content proves createChapter's render() ran — a registered but
      // unrendered chapter is a blank screen with a working URL.
      const contentLength = await page.evaluate(
        (id) => document.getElementById(`chapter-${id}`)?.innerHTML.trim().length ?? 0,
        chapter.id,
      );
      expect(
        contentLength,
        `Chapter "${chapter.id}" activates but renders nothing. Check that main.ts ` +
          'calls its init() BEFORE initRouter(), and that data/chapters.ts has a ' +
          'content record for it.',
      ).toBeGreaterThan(50);
    }
  });

  test('every live chapter is reachable from the lobby', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.lobby-grid');

    for (const chapter of LIVE) {
      const card = page.locator(`.${chapter.cssClass}`);
      await expect(card, `No lobby card for live chapter "${chapter.id}"`).toHaveCount(1);
      await expect(
        card,
        `Lobby card for live chapter "${chapter.id}" is still marked not-live. ` +
          'Flipping `live` in the manifest must also make the card a real button.',
      ).toHaveAttribute('data-live', 'true');
      await expect(
        card,
        `Live lobby card "${chapter.id}" is not keyboard reachable.`,
      ).toHaveAttribute('tabindex', '0');
    }
  });
});
