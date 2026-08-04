// Shared chapter scaffold (T10). Extracted from arpanet + early-web + figma-era
// only once all three existed — rule of three, per CQ1 / Codex T2 in
// docs/PHASE2-EARLY-WEB-PLAN.md. Extracting from two would have frozen the
// wrong abstraction (both early chapters happened to be text-reveal chapters).
//
// Every chapter repeated the same spine: look up its content record, write a
// template into its scene element, register with chapterManager for lazy init,
// start its ambient bed, then subscribe to scroll progress and the dwell-enter
// event. createChapter owns that spine; a chapter supplies only what differs.

import { chapterManager } from './chapter';
import { onChapterProgress } from './scroll';
import { startChapterAmbient } from './audio';
import { getChapter, type Chapter } from '../data/chapters';

export interface ChapterContext {
  /** Manifest id — also the chapterManager + scroll-progress registration key. */
  id: string;
  /** The chapter's fixed-position scene element, already populated by render(). */
  container: HTMLElement;
  /** Content record from data/chapters.ts (facts, palette, fonts). */
  chapter: Chapter;
}

export interface ChapterSpec {
  id: string;
  /** Returns the chapter's markup. Keep it pure — no DOM reads, no side effects. */
  render(ctx: ChapterContext): string;
  /** Runs right after the markup is written: static listeners, one-time DOM setup. */
  onMount?(ctx: ChapterContext): void;
  /** Lazy init — runs once, on first activation or intersection, never on mount. */
  onInit?(ctx: ChapterContext): void;
  /** Within-chapter scroll progress (0–1). Wired only when provided. */
  onProgress?(progress: number, ctx: ChapterContext): void;
  /** Dwell-zone entry, dispatched by the transition engine. Wired only when provided. */
  onDwellEnter?(ctx: ChapterContext): void;
  /**
   * Start this chapter's ambient audio layer on init. Defaults to true; chapters
   * with no bed authored yet still pass through (startChapterAmbient no-ops), which
   * keeps the audio wiring uniform instead of something each chapter remembers.
   */
  ambient?: boolean;
}

/**
 * Build a chapter's `init(container)` entry point from its spec. The returned
 * function is what main.ts calls once per chapter, before initRouter().
 */
export function createChapter(spec: ChapterSpec): (container: HTMLElement) => void {
  return function initChapter(container: HTMLElement) {
    const chapter = getChapter(spec.id);
    if (!chapter) {
      // Loud on purpose: a chapter flipped `live` in the manifest without a
      // matching content record would otherwise fail deep inside render().
      throw new Error(
        `createChapter: no content record for "${spec.id}" in data/chapters.ts. ` +
          'Every chapter marked live in the manifest needs one.',
      );
    }

    const ctx: ChapterContext = { id: spec.id, container, chapter };

    container.innerHTML = spec.render(ctx);
    spec.onMount?.(ctx);

    // Progress is subscribed inside the init callback, not at mount: every
    // chapter's progress handler assumes init already built its elements.
    chapterManager.register(spec.id, container, () => {
      if (spec.ambient !== false) startChapterAmbient(spec.id);
      spec.onInit?.(ctx);
      if (spec.onProgress) {
        onChapterProgress(spec.id, (progress) => spec.onProgress!(progress, ctx));
      }
    });

    if (spec.onDwellEnter) {
      container.addEventListener('dwell-enter', () => spec.onDwellEnter!(ctx));
    }
  };
}
