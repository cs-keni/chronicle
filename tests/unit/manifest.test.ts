import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MANIFEST,
  liveChapters,
  validChapterIds,
  chapterOrder,
} from '../../src/data/manifest';

describe('manifest derivation', () => {
  it('derives the router valid-hash set from live chapters only', () => {
    expect(validChapterIds()).toEqual(['arpanet', 'early-web', 'figma-era']);
  });

  it('derives scroll order from live chapters sorted by order', () => {
    expect(chapterOrder()).toEqual(['arpanet', 'early-web', 'figma-era']);
  });

  it('liveChapters excludes every non-live era', () => {
    const live = liveChapters();
    expect(live.every((c) => c.live)).toBe(true);
    // A known not-live era stays out of the derived set.
    expect(live.map((c) => c.id)).not.toContain('browser-wars');
  });

  it('sorts by order, not array position', () => {
    const orders = liveChapters().map((c) => c.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });
});

describe('manifest integrity', () => {
  it('has unique ids', () => {
    const ids = MANIFEST.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique, contiguous order values (no collisions or gaps)', () => {
    const orders = MANIFEST.map((c) => c.order).sort((a, b) => a - b);
    expect(new Set(orders).size).toBe(orders.length); // no collisions
    orders.forEach((o, i) => {
      expect(o).toBe(i + 1); // 1..N contiguous — a gap/collision would break CHAPTER_ORDER
    });
  });
});

describe('drift guard: DOM spacer order must match derived CHAPTER_ORDER', () => {
  // The scroll engine pairs DOM spacers to CHAPTER_ORDER *by index*. If the
  // hand-authored index.html spacer order ever diverges from the manifest-derived
  // order, the wrong "next chapter" fires with no other signal. This is the one
  // silent failure mode the manifest was built to close — assert it here.
  it('index.html spacer order equals chapterOrder()', () => {
    const html = readFileSync(
      fileURLToPath(new URL('../../index.html', import.meta.url)),
      'utf-8',
    );
    const spacerIds = [
      ...html.matchAll(/chapter-scroll-spacer[^>]*data-chapter-id="([^"]+)"/g),
    ].map((m) => m[1]);
    expect(spacerIds).toEqual(chapterOrder());
  });
});
