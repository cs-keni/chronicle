// GSAP ScrollTrigger engine (D3).
// Each chapter has a scroll spacer div in document flow (creates scroll height).
// The chapter scene is position:fixed — always full-viewport when active.
// ScrollTrigger observes the spacer and reports progress (0–1) to drive within-chapter animations.
//
// Dwell zone: the last 0.4vh of the 200.4vh spacer (progress > ~0.998).
// At dwell entry: starts html2canvas capture + progress indicator pulses.
// At dwell exit (progress=1): fires transition gated on Promise.all([captureFrom, captureTo]).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapterManager } from './chapter';

gsap.registerPlugin(ScrollTrigger);

const DWELL_THRESHOLD = 200 / 200.4; // ~0.998 — first pixel of dwell zone
export const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Callbacks registered by chapter modules and transition engine
type ProgressCallback = (progress: number) => void;
type DwellCallback = (chapterId: string) => void;
type TransitionCallback = (from: string, to: string) => void;

const progressListeners = new Map<string, ProgressCallback[]>();
const dwellEnterListeners: DwellCallback[] = [];
const transitionRequestListeners: TransitionCallback[] = [];

export function onChapterProgress(id: string, cb: ProgressCallback) {
  if (!progressListeners.has(id)) progressListeners.set(id, []);
  progressListeners.get(id)!.push(cb);
}

export function onDwellEnter(cb: DwellCallback) {
  dwellEnterListeners.push(cb);
}

export function onTransitionRequest(cb: TransitionCallback) {
  transitionRequestListeners.push(cb);
}

// Spacer IDs in scroll order — used to determine next chapter
const CHAPTER_ORDER = ['arpanet', 'figma-era'];

export function initScrollEngine() {
  const spacers = document.querySelectorAll<HTMLElement>('.chapter-scroll-spacer');

  spacers.forEach((spacer, index) => {
    const chapterId = spacer.dataset.chapterId!;
    const nextId = CHAPTER_ORDER[index + 1] ?? null;
    let dwellFired = false;

    ScrollTrigger.create({
      trigger: spacer,
      start: 'top top',
      end: 'bottom top',

      onEnter: () => {
        chapterManager.activate(chapterId);
        dwellFired = false;
      },

      onLeaveBack: () => {
        // Backwards navigation — handled by router's fade-to-black
        if (index > 0) {
          const prevId = CHAPTER_ORDER[index - 1];
          fireBackwardsNav(chapterId, prevId);
        }
      },

      onUpdate: (self) => {
        const { progress } = self;
        const chapterProgress = Math.min(progress / DWELL_THRESHOLD, 1);

        // Notify chapter modules of within-chapter progress
        progressListeners.get(chapterId)?.forEach(cb => cb(chapterProgress));

        // Dwell zone entry
        if (progress >= DWELL_THRESHOLD && !dwellFired) {
          dwellFired = true;
          dwellEnterListeners.forEach(cb => cb(chapterId));
        }

        // Dwell zone exit — request transition
        if (progress >= 1 && nextId) {
          transitionRequestListeners.forEach(cb => cb(chapterId, nextId));
        }
      },
    });
  });
}

function fireBackwardsNav(fromId: string, toId: string) {
  // Backwards nav: 0.15s fade-to-black → swap → 0.15s fade-from-black (no shader)
  const overlay = document.getElementById('transition-overlay')!;
  lockScroll();

  overlay.style.transition = 'opacity 0.15s ease-in';
  overlay.style.opacity = '1';

  setTimeout(() => {
    chapterManager.activate(toId);
    // Scroll to top of the previous chapter's spacer
    const prevSpacer = document.querySelector<HTMLElement>(
      `.chapter-scroll-spacer[data-chapter-id="${toId}"]`
    );
    if (prevSpacer) {
      window.scrollTo({ top: prevSpacer.offsetTop, behavior: 'instant' });
    }

    overlay.style.transition = 'opacity 0.15s ease-out';
    overlay.style.opacity = '0';
    unlockScroll();
  }, 150);
}

export function lockScroll() {
  document.body.classList.add('scroll-locked');
}

export function unlockScroll() {
  document.body.classList.remove('scroll-locked');
}

export function scrollToChapter(id: string) {
  const spacer = document.querySelector<HTMLElement>(
    `.chapter-scroll-spacer[data-chapter-id="${id}"]`
  );
  if (spacer) {
    window.scrollTo({ top: spacer.offsetTop, behavior: 'instant' });
  }
}
