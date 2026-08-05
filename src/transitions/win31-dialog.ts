// Win 3.1 dialog — Chronicle's first USER-GATED transition (Slice 2 T3b).
//
// SPEC.md:71 specs Early Web → Browser Wars as "a Windows 3.1 dialog box appears
// mid-screen: 'Are you sure you want to proceed?' OK button launches next chapter."
// That single word — button — is the whole slice. Every other transition runs on a
// timer under a scroll lock; this one holds for an UNBOUNDED time while it waits for
// a human.
//
// Visual spec (dimensions, bevels, the solid #000080 title bar, the 4px backdrop
// blur): docs/BROWSER-WARS-BRIEF.md, "The Windows 3.1 dialog — exact spec".
//
// Three things here are load-bearing and easy to break:
//
//   1. body.transition-paused, NOT lockScroll(). body.scroll-locked sets
//      pointer-events:none (global.css:90), so reusing it renders a perfect dialog
//      that accepts no clicks. See the pitfall in docs/HANDOFF.md.
//   2. Settlement is THREE-valued. 'advance' | 'cancel' alone cannot express a
//      hashchange: the router already owns the active chapter, so both values would
//      stomp its target. 'abort' means teardown only — no swap, no restore.
//   3. ONE settlement, ever. transitionInFlight guards a second transition *request*;
//      it does nothing about two callbacks racing inside an already-running dialog
//      (OK clicked as the abort fires). The latch below is what stops that.

import './win31-dialog.css';
import { returnToChapter, RETURN_LANDING_PCT } from '../engine/scroll';

export type Settlement = 'advance' | 'cancel' | 'abort';

export interface DomRunnerCtx {
  fromId: string;
  toId: string;
  /** Appear-animation duration. NOT a timeout — nothing here is time-based. */
  enterMs: number;
  /** Fired by the transition engine on hashchange. */
  signal: AbortSignal;
}

const PAUSED_CLASS = 'transition-paused';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildDialog(): HTMLDialogElement {
  const dialog = document.createElement('dialog');
  dialog.className = 'win31';
  // aria-modal + role=dialog are implicit on <dialog> opened with showModal().
  // The accessible name comes from aria-labelledby → the title bar text.
  dialog.setAttribute('aria-labelledby', 'win31-title');
  dialog.setAttribute('aria-describedby', 'win31-msg');
  dialog.innerHTML = `
    <div class="win31-title">
      <span class="win31-sysbox" aria-hidden="true"><i></i></span>
      <span class="win31-title-text" id="win31-title">Chronicle</span>
    </div>
    <div class="win31-body">
      <span class="win31-icon" aria-hidden="true">?</span>
      <p class="win31-msg" id="win31-msg">Are you sure you want to proceed?</p>
    </div>
    <div class="win31-btns">
      <button type="button" class="win31-btn win31-default" data-act="advance">OK</button>
      <button type="button" class="win31-btn" data-act="cancel">Cancel</button>
    </div>
  `;
  return dialog;
}

/**
 * Show the dialog and resolve with how the user settled it.
 *
 * Never rejects: a failure to mount throws synchronously BEFORE any pause state is
 * applied, so the caller's try/catch falls through to fadeSwap with the page still
 * fully interactive.
 */
export function runWin31Dialog(ctx: DomRunnerCtx): Promise<Settlement> {
  const dialog = buildDialog();
  document.body.appendChild(dialog);

  // showModal() promotes the dialog into the TOP LAYER, which gives us for free:
  // z-index irrelevance, ::backdrop, an inert background, Esc, and focus management.
  // The W3C APA group concluded manual focus trapping is unnecessary here.
  dialog.showModal();

  // Mount confirmation gate. Pause state is applied ONLY once the dialog is really
  // in the DOM and really open — a mount failure must never leave the page paused
  // with nothing on screen to un-pause it. This is the structural half of the
  // no-trap guarantee (the other half is that no exit is time-based).
  if (!document.body.contains(dialog) || !dialog.open) {
    dialog.remove();
    throw new Error('win31-dialog: failed to mount');
  }

  if (prefersReducedMotion() || ctx.enterMs <= 0) {
    dialog.classList.add('is-instant');
  } else {
    dialog.style.setProperty('--win31-enter-ms', `${ctx.enterMs}ms`);
  }

  document.body.classList.add(PAUSED_CLASS);

  return new Promise<Settlement>((resolve) => {
    // ── the single-settlement latch ──────────────────────────────────────────
    let settled = false;
    const settle = (outcome: Settlement) => {
      if (settled) return;
      settled = true;
      teardown();
      resolve(outcome);
    };

    const okBtn = dialog.querySelector<HTMLButtonElement>('[data-act="advance"]')!;
    const cancelBtn = dialog.querySelector<HTMLButtonElement>('[data-act="cancel"]')!;

    const onClick = (e: Event) => {
      const act = (e.currentTarget as HTMLElement).dataset.act;
      // Disable immediately so a 5-click mash cannot queue further work even
      // before the latch is consulted.
      okBtn.disabled = true;
      cancelBtn.disabled = true;
      settle(act === 'advance' ? 'advance' : 'cancel');
    };

    // Forward-scroll intent advances. The page itself stays pinned (the pause state
    // holds overflow:hidden) — we only read the INTENT. This is the second
    // independent user-driven exit, and it is why the natural instinct works.
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) settle('advance');
      else if (e.deltaY < 0) settle('cancel');
    };

    let touchStartY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return;
      const dy = touchStartY - (e.touches[0]?.clientY ?? touchStartY);
      if (Math.abs(dy) < 24) return; // ignore jitter
      settle(dy > 0 ? 'advance' : 'cancel');
    };

    const onKeydown = (e: KeyboardEvent) => {
      // Enter/Space on a focused button are handled by the click path; only treat
      // them as advance when focus is NOT on Cancel, so keyboard users can actually
      // choose Cancel.
      if (e.key === 'PageDown' || e.key === 'ArrowDown') {
        e.preventDefault();
        settle('advance');
      } else if (e.key === 'PageUp' || e.key === 'ArrowUp') {
        e.preventDefault();
        settle('cancel');
      }
    };

    // Esc is delivered by <dialog> as a 'cancel' event. Prevent the default close
    // so teardown stays the single path that removes the element.
    const onDialogCancel = (e: Event) => {
      e.preventDefault();
      settle('cancel');
    };

    // Router navigated elsewhere. Teardown ONLY — the router already owns the
    // active chapter, and swapping or restoring here would stomp its target
    // (the nav-latch-race class of bug).
    const onAbort = () => settle('abort');

    function teardown() {
      okBtn.removeEventListener('click', onClick);
      cancelBtn.removeEventListener('click', onClick);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeydown);
      dialog.removeEventListener('cancel', onDialogCancel);
      ctx.signal.removeEventListener('abort', onAbort);

      document.body.classList.remove(PAUSED_CLASS);
      if (dialog.open) dialog.close();
      dialog.remove();
    }

    okBtn.addEventListener('click', onClick);
    cancelBtn.addEventListener('click', onClick);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeydown);
    dialog.addEventListener('cancel', onDialogCancel);
    ctx.signal.addEventListener('abort', onAbort, { once: true });

    // Already aborted before we finished wiring (hashchange during mount).
    if (ctx.signal.aborted) settle('abort');

    okBtn.focus();
  });
}

/**
 * Cancel path: put the user back where they were.
 *
 * Lands at 85% through the origin chapter — near the end but clear of the dwell zone
 * (~99.8%), so the dialog does not immediately re-fire. Shares `returnToChapter` with
 * scroll-driven backwards nav (T3a) precisely so the two cannot drift.
 */
export function returnFromDialog(fromId: string): Promise<void> {
  return returnToChapter(fromId, RETURN_LANDING_PCT);
}
