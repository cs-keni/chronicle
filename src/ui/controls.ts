// Global UI controls — a minimal bottom-right cluster (view-source + share) plus
// keyboard shortcuts (`?` source, `s` share, `Esc` close). Eager-loaded from
// main.ts because it's tiny; the heavy modules (raw source strings, html2canvas)
// are dynamically imported on first use so they stay out of the initial bundle.

import './ui.css';
import { chapterManager } from '../engine/chapter';
import { isTouchDevice } from '../engine/scroll';

// Lazy module handles — fetched once, reused after.
let codeMod: Promise<typeof import('./code-overlay')> | null = null;
const code = () => (codeMod ??= import('./code-overlay'));

let shareMod: Promise<typeof import('./share-card')> | null = null;
const share = () => (shareMod ??= import('./share-card'));

let cluster: HTMLElement | null = null;
let shareBtn: HTMLButtonElement | null = null;

// One-time share nudge, offered when the Figma Era closing beat fires. Shown
// once per browser session, and never if the user already discovered sharing.
const NUDGE_SEEN_KEY = 'chronicle:share-nudge-seen';
let hasShared = false;
let nudgeEl: HTMLElement | null = null;
let nudgeTimer: ReturnType<typeof setTimeout> | null = null;

/** Chapters where the controls make sense (not the lobby). */
function activeChapter(): string | null {
  const id = chapterManager.getActiveId();
  return id && id !== 'lobby' ? id : null;
}

async function openCode() {
  const id = activeChapter();
  if (!id) return;
  (await code()).toggleCodeOverlay(id);
}

async function closeCode() {
  const mod = await code();
  if (mod.isCodeOverlayOpen()) mod.closeCodeOverlay();
}

async function doShare() {
  const id = activeChapter();
  if (!id) return;
  hasShared = true; // user found sharing on their own — don't nudge later
  dismissNudge();
  (await share()).shareChapter(id);
}

function buildCluster() {
  cluster = document.createElement('div');
  cluster.className = 'chronicle-controls';

  const codeBtn = document.createElement('button');
  codeBtn.type = 'button';
  codeBtn.className = 'ctrl-btn';
  codeBtn.setAttribute('aria-label', 'View source for this chapter (press ?)');
  codeBtn.setAttribute('data-tip', 'View source  ?');
  codeBtn.innerHTML = '&lt;/&gt;';
  codeBtn.addEventListener('click', openCode);

  shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'ctrl-btn';
  shareBtn.setAttribute('aria-label', 'Share this chapter as an image (press S)');
  shareBtn.setAttribute('data-tip', 'Share card  S');
  // simple share glyph (arrow out of tray)
  shareBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
  shareBtn.addEventListener('click', doShare);

  cluster.append(codeBtn, shareBtn);
  document.body.appendChild(cluster);
}

function updateVisibility() {
  if (!cluster) return;
  // Lobby is hash '' or '#'. Any chapter hash shows the cluster.
  const hash = location.hash.replace('#', '');
  const onLobby = hash === '' || hash === 'lobby';
  cluster.classList.toggle('is-hidden', onLobby);
}

// ── Share nudge ─────────────────────────────────────────────────────────────

function onClosingBeat() {
  if (hasShared) return; // they already share — don't teach what they know
  try {
    if (sessionStorage.getItem(NUDGE_SEEN_KEY)) return;
    sessionStorage.setItem(NUDGE_SEEN_KEY, '1');
  } catch {
    // sessionStorage blocked (private mode). The figma-era latch already fires
    // the beat once per entry and hasShared guards repeats, so showing without
    // persistence is fine.
  }
  // Let the closing beat breathe for a moment before the hint lands.
  setTimeout(showNudge, 1200);
}

function showNudge() {
  if (hasShared || nudgeEl) return; // shared during the delay, or already up
  if (!activeChapter()) return; // user scrolled/navigated away while we waited

  nudgeEl = document.createElement('div');
  nudgeEl.className = 'chronicle-nudge';
  nudgeEl.setAttribute('role', 'status');
  nudgeEl.setAttribute('aria-live', 'polite');

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'nudge-action';
  // Touch has no `S` key — say "tap" and let the pill itself be the target.
  const label = isTouchDevice
    ? 'Tap to share this chapter'
    : 'Press <kbd class="nudge-key">S</kbd> to share this';
  action.innerHTML =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>' +
    `<span>${label}</span>`;
  action.addEventListener('click', () => void doShare());

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'nudge-dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss');
  dismiss.innerHTML = '&times;';
  dismiss.addEventListener('click', dismissNudge);

  nudgeEl.append(action, dismiss);
  document.body.appendChild(nudgeEl);

  // Pulse the real share button so the eye connects the hint to its target.
  shareBtn?.classList.add('is-pulsing');

  requestAnimationFrame(() =>
    requestAnimationFrame(() => nudgeEl?.classList.add('is-visible'))
  );

  nudgeTimer = setTimeout(dismissNudge, 6000);
}

function dismissNudge() {
  if (nudgeTimer) {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }
  shareBtn?.classList.remove('is-pulsing');
  if (!nudgeEl) return;
  const el = nudgeEl;
  nudgeEl = null;
  el.classList.remove('is-visible');
  // Remove after the exit transition; fallback covers reduced-motion (~0ms).
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 500);
}

function onKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;

  if (e.key === '?') {
    e.preventDefault();
    void openCode();
  } else if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    void doShare();
  } else if (e.key === 'Escape') {
    void closeCode();
  }
}

export function initControls() {
  buildCluster();
  updateVisibility();
  // Trigger the entrance transition a frame after mount (double rAF so the
  // initial hidden state paints first, then transitions in).
  requestAnimationFrame(() =>
    requestAnimationFrame(() => cluster?.classList.add('is-ready'))
  );
  window.addEventListener('hashchange', () => {
    updateVisibility();
    // Close the source panel and drop the nudge when leaving to the lobby.
    if (!activeChapter()) {
      void closeCode();
      dismissNudge();
    }
  });
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('chronicle:closing-beat', onClosingBeat);
}
