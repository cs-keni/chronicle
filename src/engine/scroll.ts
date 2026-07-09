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
import { chapterOrder } from '../data/manifest';

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

// Router calls this during direct-link / hash navigation to prevent GSAP's
// reconciliation callbacks (fired by the programmatic scrollTo + the
// display:none→block layout change) from overriding the router's chosen
// chapter or firing a spurious transition.
//
// This used to be a fixed 200ms time window. That was a race: GSAP's settle
// time depends on how long layout/assets take, which on a networked host
// (CDN latency, cold cache) routinely exceeds 200ms. When the callbacks fired
// late, onEnter would call activate() on the previous chapter — flipping the
// active chapter away from the router's target and stranding it off-screen
// (e.g. direct nav to #figma-era showed ARPANET). Intermittent by nature:
// fast loads won the race, slow loads lost it.
//
// The latch is now released by the first *genuine user scroll*, not a timer.
// The router owns the active chapter until the user actually interacts, so no
// amount of network delay can let a stale GSAP callback override it.
let _navLatch = false;
let _releaseNavLatch: (() => void) | null = null;

export function isNavSuppressed(): boolean {
  return _navLatch;
}

// Kept for API compatibility with the router. Duration is ignored — see below.
export function suppressTransitionRequests(_durationMs?: number) {
  beginNavLatch();
}

// Set the latch and arm a one-shot release on the first real user scroll
// (wheel / touch / keyboard). Re-arming during an existing latch is a no-op.
export function beginNavLatch() {
  _navLatch = true;
  if (_releaseNavLatch) return;

  const release = () => {
    _navLatch = false;
    _releaseNavLatch = null;
    window.removeEventListener('wheel', release);
    window.removeEventListener('touchstart', release);
    window.removeEventListener('keydown', release);
  };
  _releaseNavLatch = release;
  window.addEventListener('wheel', release, { passive: true });
  window.addEventListener('touchstart', release, { passive: true });
  window.addEventListener('keydown', release);
}

// Spacer IDs in scroll order — used to determine next chapter.
// Derived from the manifest's live subset (sorted by order); the DOM spacer
// order in index.html must match this (drift-guarded by tests/unit/manifest.test.ts).
const CHAPTER_ORDER = chapterOrder();

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
        // Guard 2: during router navigation the router owns the active chapter.
        // GSAP's reconciliation can fire onEnter for a chapter the scroll jumped
        // past; without this guard it would call activate() and flip the active
        // chapter away from the router's target (the #figma-era → ARPANET bug).
        if (isNavSuppressed()) return;
        // Guard 3: GSAP fires onEnter during initial state-reconciliation even
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
            && !isNavSuppressed()) {
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
        if (progress >= 1 && nextId && !isNavSuppressed()) {
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
