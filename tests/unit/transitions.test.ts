import { describe, it, expect } from 'vitest';
import { chapterOrder, liveChapters } from '../../src/data/manifest';
import { getTransition, hasTransition, transitionKeys } from '../../src/data/transitions';

// T2 — the CRITICAL GAP guard.
//
// The glass-shatter relocation is Slice 2's only non-additive registry edit: remove
// 'early-web->figma-era', add 'early-web->browser-wars', move glass-shatter to
// 'browser-wars->figma-era'. If any key is wrong, or a chapter is flipped live in the
// manifest without its transition, getTransition returns null,
// handleTransitionRequest returns early, and the user reaches the end of a chapter
// with NO WAY FORWARD AND NO ERROR.
//
// Silent dead ends are the exact failure class the manifest drift-guard exists to
// prevent. This is its transition-registry counterpart.

describe('transition registry drift guards', () => {
  it('every adjacent live chapter pair has a registered transition', () => {
    const order = chapterOrder();
    const missing: string[] = [];

    for (let i = 0; i < order.length - 1; i++) {
      if (!hasTransition(order[i], order[i + 1])) {
        missing.push(`${order[i]}->${order[i + 1]}`);
      }
    }

    expect(
      missing,
      `Live chapters with no way forward: ${missing.join(', ')}. ` +
        'A missing key is a silent dead end — getTransition returns null and the ' +
        'user simply cannot advance. Add the transition or unflip the chapter.',
    ).toEqual([]);
  });

  it('every registry key names two chapters that exist in the manifest', () => {
    const ids = new Set(liveChapters().map((c) => c.id));
    // Not-live chapters are legitimate registry targets only if they are also not
    // reachable, so we check against the FULL manifest for existence and against
    // the live set for reachability in the test above.
    const unknown = transitionKeys().filter((key) => {
      const [from, to] = key.split('->');
      return !ids.has(from) || !ids.has(to);
    });

    expect(
      unknown,
      `Registry keys pointing at non-live chapters: ${unknown.join(', ')}. ` +
        'A transition to a chapter nobody can reach is dead config; a transition ' +
        'FROM one is a typo waiting to become a dead end.',
    ).toEqual([]);
  });

  it('shader entries carry a shader and a duration', () => {
    for (const key of transitionKeys()) {
      const [from, to] = key.split('->');
      const def = getTransition(from, to)!;
      if (def.kind !== 'shader') continue;
      expect(def.shader, `${key} has no shader`).toBeTruthy();
      expect(def.duration, `${key} has a non-positive duration`).toBeGreaterThan(0);
    }
  });

  it('dom entries carry a known runner and enterMs, never a duration', () => {
    const KNOWN_RUNNERS = ['win31-dialog'];
    for (const key of transitionKeys()) {
      const [from, to] = key.split('->');
      const def = getTransition(from, to)!;
      if (def.kind !== 'dom') continue;

      expect(KNOWN_RUNNERS, `${key} names an unknown runner`).toContain(def.runner);
      expect(def.enterMs, `${key} has a non-positive enterMs`).toBeGreaterThan(0);

      // A user-gated transition has NO fixed duration — it ends when a human acts.
      // A `duration` field here would invite someone to write a timer against it,
      // which is exactly how the rejected 15s auto-advance would creep back in.
      expect(
        'duration' in def,
        `${key} is a dom transition carrying a "duration" field. Use enterMs. ` +
          'A duration on a user-gated transition invites an auto-advance timer.',
      ).toBe(false);
    }
  });

  it('every transition kind is one the engine can actually run', () => {
    for (const key of transitionKeys()) {
      const [from, to] = key.split('->');
      expect(['shader', 'dom']).toContain(getTransition(from, to)!.kind);
    }
  });
});
