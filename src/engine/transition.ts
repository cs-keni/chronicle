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

import html2canvas from 'html2canvas';
import { gsap } from 'gsap';
import { webgl } from './webgl';
import { chapterManager } from './chapter';
import { lockScroll, unlockScroll, isTouchDevice, onDwellEnter, onTransitionRequest } from './scroll';
import { getTransition } from '../data/transitions';

const CAPTURE_TIMEOUT_MS = 500; // max extra scroll lock if capture is slow

// Pending capture promise per chapter
const pendingCaptures = new Map<string, Promise<HTMLCanvasElement>>();

export function initTransitionEngine() {
  onDwellEnter(handleDwellEnter);
  onTransitionRequest(handleTransitionRequest);
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

  const transitionDef = getTransition(fromId, toId);
  if (!transitionDef) return;

  // Touch devices: skip shader, use fade-to-black (Pass 6A decision)
  if (isTouchDevice) {
    await fadeSwap(fromId, toId);
    return;
  }

  // Reduced motion: same as touch fallback
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await fadeSwap(fromId, toId);
    return;
  }

  transitionInFlight = true;
  lockScroll();

  try {
    // Ensure we have capture for fromId (should already be running from dwell entry)
    const fromEl = chapterManager.getElement(fromId)!;
    const toEl = chapterManager.getElement(toId)!;

    // Pre-activate toId off-screen so html2canvas can capture it
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

    // Restore toId off-screen (chapter.ts will activate it after transition)
    toEl.style.transform = 'translateX(-100vw)';
    toEl.style.visibility = '';

    // Upload textures and run shader
    webgl.resizeForTransition();
    webgl.uploadTexture(0, textureFrom);
    webgl.uploadTexture(1, textureTo);

    await runShader(transitionDef.shader, transitionDef.duration);

    // Transition complete
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

async function captureChapter(el: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    scale: Math.min(window.devicePixelRatio, 2),
    logging: false,
  });
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

// Audio crossfade — driven by GSAP onUpdate, NOT Tone Transport (avoids clock drift).
// Called by the shader rAF loop progress; scheduled once at transition start.
export function scheduleAudioCrossfade(
  fromFade: () => void,
  toFade: () => void,
  durationMs: number,
) {
  // ARPANET audio fades out over first 1s of transition
  gsap.to({}, {
    duration: Math.min(1, durationMs / 1000),
    onUpdate() { fromFade(); },
  });

  // Figma Era audio fades in starting at 60% of transition
  gsap.delayedCall(durationMs * 0.6 / 1000, () => {
    gsap.to({}, {
      duration: (durationMs * 0.4) / 1000,
      onUpdate() { toFade(); },
    });
  });
}
