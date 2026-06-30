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
import { startChapterAmbient, stopChapterAmbient } from './audio';

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

// Per-chapter dwell tracking in a Map so fireBackwardsNav can reset it.
// Closure variables can't be reset from outside — this lets backwards nav
// clear the flag so the next forward pass re-triggers dwell capture.
const dwellFiredMap = new Map<string, boolean>();

export function resetDwellState(chapterId: string) {
  dwellFiredMap.set(chapterId, false);
}

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

// Router calls this during direct-link / hash navigation to prevent
// GSAP's initial onUpdate (triggered by the programmatic scrollTo) from
// firing a spurious transition. 200ms covers the scroll event + first RAF.
let _suppressUntil = 0;
export function suppressTransitionRequests(durationMs: number) {
  _suppressUntil = performance.now() + durationMs;
}

// Spacer IDs in scroll order — used to determine next chapter
const CHAPTER_ORDER = ['arpanet', 'figma-era'];

export function initScrollEngine() {
  const spacers = document.querySelectorAll<HTMLElement>('.chapter-scroll-spacer');

  spacers.forEach((spacer, index) => {
    const chapterId = spacer.dataset.chapterId!;
    const nextId = CHAPTER_ORDER[index + 1] ?? null;
    dwellFiredMap.set(chapterId, false);

    ScrollTrigger.create({
      trigger: spacer,
      start: 'top top',
      end: 'bottom top',

      onEnter: (self) => {
        // Guard 1: ignore in lobby mode (scroll container not active).
        if (!document.getElementById('scroll-container')?.classList.contains('active')) return;
        // Guard 2: GSAP fires onEnter during initial state-reconciliation even
        // when the scroll is already past the trigger's end (progress≈1). Real
        // forward entry always starts at progress≈0. Skip spurious init calls.
        if (self.progress > 0.5) return;
        chapterManager.activate(chapterId);
        dwellFiredMap.set(chapterId, false);
      },

      onLeaveBack: () => {
        // Guard: only fire backwards nav when scroll container is active and
        // not mid-router-navigation (GSAP recalculates trigger positions on
        // display:none→block transition and spuriously fires onLeaveBack).
        if (index > 0
            && document.getElementById('scroll-container')?.classList.contains('active')
            && performance.now() > _suppressUntil) {
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
        if (progress >= DWELL_THRESHOLD && !dwellFiredMap.get(chapterId)) {
          dwellFiredMap.set(chapterId, true);
          dwellEnterListeners.forEach(cb => cb(chapterId));
        }

        // Dwell zone exit — request transition (suppressed during router nav)
        if (progress >= 1 && nextId && performance.now() > _suppressUntil) {
          transitionRequestListeners.forEach(cb => cb(chapterId, nextId));
        }
      },
    });
  });
}

let backwardsNavInFlight = false;

function fireBackwardsNav(fromId: string, toId: string) {
  // Guard: the instant scrollTo during this function can re-trigger onLeaveBack
  // for the chapter we're leaving, causing a second call before the first completes.
  if (backwardsNavInFlight) return;
  backwardsNavInFlight = true;

  const overlay = document.getElementById('transition-overlay')!;
  lockScroll();
  stopChapterAmbient(fromId); // begin fading out alongside the overlay

  overlay.style.transition = 'opacity 0.15s ease-in';
  overlay.style.opacity = '1';

  setTimeout(() => {
    chapterManager.activate(toId);
    startChapterAmbient(toId); // begin fading in as overlay clears

    // Land at 85% through the previous chapter — near the end but clear of the
    // dwell zone (which starts at ~99.8%). Gives the user room to re-explore
    // before the forward transition re-triggers.
    const prevSpacer = document.querySelector<HTMLElement>(
      `.chapter-scroll-spacer[data-chapter-id="${toId}"]`
    );
    if (prevSpacer) {
      window.scrollTo({
        top: prevSpacer.offsetTop + prevSpacer.offsetHeight * 0.85,
        behavior: 'instant',
      });
    }

    // Reset dwell so the next forward pass re-triggers capture at dwell entry.
    // Without this, scrolling forward again skips the dwell capture (dwellFiredMap
    // stays true from the previous pass, since onEnter only fires at the top boundary).
    resetDwellState(toId);

    overlay.style.transition = 'opacity 0.15s ease-out';
    overlay.style.opacity = '0';
    unlockScroll();

    setTimeout(() => {
      backwardsNavInFlight = false;
    }, 150);
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
