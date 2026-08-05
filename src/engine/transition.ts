// Transition engine — orchestrates html2canvas capture, WebGL shader, audio crossfade.
// Wired in Week 3 (CRT shader implementation). This file is the integration point.
//
// Flow:
//   dwell zone entry
//     → html2canvas capture (fires on dwell entry, NOT at transition moment)
//     → progress indicator pulses
//   dwell zone exit
//     → scroll lock
//     → canvas resize to fullscreen
//     → Promise.all([captureFrom, captureTo]) — gate on both textures ready (D16)
//     → rAF loop: render shader at progress 0→1 over transition.duration ms
//     → transition complete: canvas reset, chapter swap, scroll unlock

import type html2canvasType from 'html2canvas';
import { webgl } from './webgl';
import { chapterManager } from './chapter';
import { lockScroll, unlockScroll, isTouchDevice, onDwellEnter, onTransitionRequest, setDomTransitionOpen } from './scroll';
import { getTransition, type TransitionDef } from '../data/transitions';
import { crossfadeForTransition } from './audio';

const CAPTURE_TIMEOUT_MS = 500; // max extra scroll lock if capture is slow

// Pending capture promise per chapter
const pendingCaptures = new Map<string, Promise<HTMLCanvasElement>>();

// html2canvas (~large) is only needed for the DOM→texture capture that feeds
// the CRT shader — which can't fire until the user has scrolled a full chapter.
// So it's dynamically imported (its own async chunk) instead of shipped in the
// initial paint bundle. `loadHtml2canvas()` caches the module promise; the first
// caller triggers the fetch, everyone after reuses it. Exported so the share-card
// UI reuses the same cached chunk instead of pulling a second copy of html2canvas.
let html2canvasPromise: Promise<typeof html2canvasType> | null = null;
export function loadHtml2canvas(): Promise<typeof html2canvasType> {
  if (!html2canvasPromise) {
    html2canvasPromise = import('html2canvas').then((m) => m.default);
  }
  return html2canvasPromise;
}

export function initTransitionEngine() {
  onDwellEnter(handleDwellEnter);
  onTransitionRequest(handleTransitionRequest);

  // Warm the html2canvas chunk during the first idle window after paint. The
  // lobby → chapter → scroll-to-dwell path takes seconds, so this is loaded well
  // before any capture — no first-transition stutter — without blocking paint.
  const preload = () => void loadHtml2canvas();
  if ('requestIdleCallback' in window) {
    (window as typeof window & {
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback(preload, { timeout: 4000 });
  } else {
    setTimeout(preload, 2000);
  }
}

function handleDwellEnter(chapterId: string) {
  // Start capture immediately on dwell entry (~500ms head start before transition fires)
  if (!pendingCaptures.has(chapterId)) {
    const el = chapterManager.getElement(chapterId);
    if (el) {
      // Signal progress indicator to pulse (custom event)
      el.dispatchEvent(new CustomEvent('dwell-enter'));
      pendingCaptures.set(chapterId, captureChapter(el));
    }
  }
}

let transitionInFlight = false;

async function handleTransitionRequest(fromId: string, toId: string) {
  if (transitionInFlight) return;
  // Guard: if the router already navigated directly to toId (or anywhere else),
  // fromId is no longer the active chapter. Skip this stale trigger from the
  // scroll engine firing onUpdate(progress≥1) during a programmatic scrollTo.
  if (chapterManager.getActiveId() !== fromId) return;

  const transitionDef = getTransition(fromId, toId);
  if (!transitionDef) return;

  // ── DOM (user-gated) transitions branch BEFORE the scroll lock ────────────
  // They must not take lockScroll() at all: it sets pointer-events:none, which
  // would render a perfect dialog that accepts no clicks (global.css:90). The
  // runner owns its own body.transition-paused state instead.
  if (transitionDef.kind === 'dom') {
    transitionInFlight = true;
    try {
      await runDomTransition(fromId, toId, transitionDef);
    } finally {
      pendingCaptures.delete(fromId);
      pendingCaptures.delete(toId);
      transitionInFlight = false;
    }
    return;
  }

  // Set guard and lock scroll before any async work — prevents double-fire on both
  // WebGL and touch/reduced-motion paths.
  transitionInFlight = true;
  lockScroll();

  try {
    // No shader path available: touch devices (Pass 6A decision), reduced-motion
    // users, and browsers without WebGL2 (TODO-006 — Safari < 15, disabled WebGL,
    // blocklisted GPUs, VMs). All three get the same clean fade.
    if (
      isTouchDevice ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !webgl.supported
    ) {
      await fadeSwap(fromId, toId);
      return;
    }

    // Shader-missing guard (fold #4): if the shader failed to compile (or hasn't
    // yet), runShader would render nothing and hold the scroll lock for the full
    // duration on a blank canvas. Skip straight to a clean fade instead.
    if (!webgl.getShader(transitionDef.shader)) {
      await fadeSwap(fromId, toId);
      return;
    }

    const fromEl = chapterManager.getElement(fromId)!;
    const toEl = chapterManager.getElement(toId)!;

    // T2c — the target-initialized check, ACTUALLY implemented this time.
    // The Slice 1 plan described this mitigation as intent and it was never built:
    // isInitialized() (chapter.ts:70) was defined and called from nowhere, so
    // capturing an uninitialized chapter yielded a blank destination texture.
    // Codex #9 caught that the Slice 2 plan had inherited the claim without
    // verifying it. It matters more here than it did in Slice 1: Browser Wars is
    // the first chapter whose visual identity depends on image assets.
    if (!chapterManager.isInitialized(toId)) {
      // activate() runs the lazy init synchronously, then a frame lets layout and
      // any decoded images land before html2canvas reads the DOM.
      chapterManager.activate(toId);
      chapterManager.deactivate(toId);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (!chapterManager.isInitialized(toId)) {
        console.warn(`[transition] ${toId} still uninitialized before capture — fading instead of risking a blank texture`);
        await fadeSwap(fromId, toId);
        return;
      }
    }

    // Bring toId into viewport (hidden) so html2canvas can capture its rendered state
    toEl.style.visibility = 'hidden';
    toEl.style.transform = 'translateX(0)';

    const captureFrom = pendingCaptures.get(fromId) ?? captureChapter(fromEl);
    const captureTo = captureChapter(toEl);

    // Gate transition on both textures — prevents null-texture black screen (D16)
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('capture timeout')), CAPTURE_TIMEOUT_MS)
    );

    let textureFrom: HTMLCanvasElement;
    let textureTo: HTMLCanvasElement;

    try {
      [textureFrom, textureTo] = await Promise.race([
        Promise.all([captureFrom, captureTo]),
        timeout,
      ]) as [HTMLCanvasElement, HTMLCanvasElement];
    } catch {
      // Timeout or capture failure — fall back to fade swap
      toEl.style.transform = 'translateX(-100vw)';
      toEl.style.visibility = '';
      await fadeSwap(fromId, toId);
      return;
    }

    // Restore toId off-screen — chapter.ts activate() handles the final swap
    toEl.style.transform = 'translateX(-100vw)';
    toEl.style.visibility = '';

    // Upload textures and run shader
    webgl.resizeForTransition();
    webgl.uploadTexture(0, textureFrom);
    webgl.uploadTexture(1, textureTo);

    // Schedule audio crossfade via Tone.now() before the shader starts
    crossfadeForTransition(fromId, toId, transitionDef.duration);

    await runShader(transitionDef.shader, transitionDef.duration);

    // Transition complete — swap chapters, reset canvas
    chapterManager.activate(toId);
    chapterManager.deactivate(fromId);
    webgl.resetAfterTransition();
  } finally {
    pendingCaptures.delete(fromId);
    pendingCaptures.delete(toId);
    transitionInFlight = false;
    unlockScroll();
  }
}

/**
 * User-gated DOM transition. Unlike the shader path this has NO fixed duration —
 * it ends when a human acts, or when the router navigates away.
 *
 * Three-valued settlement, because 'advance' | 'cancel' alone cannot express a
 * hashchange: the router already owns the active chapter by then, so both values
 * would stomp its target (the nav-latch-race class of bug).
 *
 * The runner is imported dynamically so its DOM + CSS stay out of the entry chunk —
 * it cannot be needed until the user has scrolled a full chapter, and the chunk is
 * warmed on dwell entry the same way html2canvas is.
 */
async function runDomTransition(
  fromId: string,
  toId: string,
  def: Extract<TransitionDef, { kind: 'dom' }>,
): Promise<void> {
  const controller = new AbortController();
  const onHashChange = () => controller.abort();
  window.addEventListener('hashchange', onHashChange);
  setDomTransitionOpen(true);

  // The triggering scroll has usually already crossed into the destination spacer, so
  // onEnter may have activated the destination before we got here. Re-assert the
  // ORIGIN as active: the dialog must sit over the chapter the user is leaving.
  chapterManager.activate(fromId);

  try {
    const { runWin31Dialog, returnFromDialog } = await import('../transitions/win31-dialog');

    // Only one runner exists (rule of three — no plugin architecture until a second
    // DOM transition does). The switch is here so adding BSOD is a visible edit.
    if (def.runner !== 'win31-dialog') {
      throw new Error(`runDomTransition: unknown runner "${def.runner}"`);
    }

    const settlement = await runWin31Dialog({
      fromId,
      toId,
      enterMs: def.enterMs,
      signal: controller.signal,
    });

    if (settlement === 'advance') {
      // Audio crossfade fires HERE, on 'advance' only — never at dialog open.
      // Firing it at open (as transition.ts:143 does for shaders) would leave the
      // destination chapter's ambient bed playing over an on-screen origin chapter
      // when the user cancels. Eng review finding 3, which neither the CEO review
      // nor Codex caught.
      crossfadeForTransition(fromId, toId, def.enterMs);
      chapterManager.activate(toId);
      chapterManager.deactivate(fromId);
    } else if (settlement === 'cancel') {
      // Put the user back where they were, clear of the dwell zone so the dialog
      // does not immediately re-fire. Ambient bed for fromId is untouched — it
      // never faded, because the crossfade above never ran.
      await returnFromDialog(fromId);
    }
    // settlement === 'abort': teardown only. No swap, no restore — the router
    // already owns the active chapter and touching it here would fight it.
  } catch (err) {
    // Any throw — mount failure, bad runner id, chunk load failure — falls through
    // to a clean fade. The pause state is never applied on the mount-failure path,
    // so the page is still fully interactive when we get here.
    console.warn('[transition] DOM runner failed, falling back to fadeSwap', err);
    document.body.classList.remove('transition-paused');
    await fadeSwap(fromId, toId);
  } finally {
    setDomTransitionOpen(false);
    window.removeEventListener('hashchange', onHashChange);
  }
}

async function captureChapter(el: HTMLElement): Promise<HTMLCanvasElement> {
  // Resolves instantly if the idle preload already loaded the chunk; otherwise
  // this awaits the dynamic import (still gated by the dwell head start + the
  // CAPTURE_TIMEOUT_MS fallback to fadeSwap).
  const html2canvas = await loadHtml2canvas();

  // html2canvas cannot resolve SVG filter URL references (e.g. filter:url(#phosphor-glow)).
  // Strip inline filter during capture and restore afterward to avoid rendering artifacts.
  const savedFilter = el.style.filter;
  el.style.filter = 'none';

  const t0 = performance.now();
  try {
    const canvas = await html2canvas(el, {
      useCORS: true,
      allowTaint: true,
      scale: Math.min(window.devicePixelRatio, 2),
      logging: false,
    });
    const ms = performance.now() - t0;
    // Spike measurement — Week 3 TODO-001: main-thread block target < 16ms
    console.debug(`[transition] captureChapter(#${el.id}) ${ms.toFixed(1)}ms`);
    if (ms > 16) console.warn(`[transition] html2canvas blocked main thread ${ms.toFixed(1)}ms (>16ms frame budget)`);
    return canvas;
  } finally {
    el.style.filter = savedFilter;
  }
}

function runShader(shaderName: string, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    function frame() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      webgl.render(shaderName, progress);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

async function fadeSwap(fromId: string, toId: string) {
  const overlay = document.getElementById('transition-overlay')!;

  await new Promise<void>((resolve) => {
    overlay.style.transition = 'opacity 0.15s ease-in';
    overlay.style.opacity = '1';
    setTimeout(resolve, 150);
  });

  chapterManager.activate(toId);
  chapterManager.deactivate(fromId);

  await new Promise<void>((resolve) => {
    overlay.style.transition = 'opacity 0.15s ease-out';
    overlay.style.opacity = '0';
    setTimeout(resolve, 150);
  });
}

