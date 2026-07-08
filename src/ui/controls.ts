// Global UI controls — a minimal bottom-right cluster (view-source + share) plus
// keyboard shortcuts (`?` source, `s` share, `Esc` close). Eager-loaded from
// main.ts because it's tiny; the heavy modules (raw source strings, html2canvas)
// are dynamically imported on first use so they stay out of the initial bundle.

import './ui.css';
import { chapterManager } from '../engine/chapter';

// Lazy module handles — fetched once, reused after.
let codeMod: Promise<typeof import('./code-overlay')> | null = null;
const code = () => (codeMod ??= import('./code-overlay'));

let shareMod: Promise<typeof import('./share-card')> | null = null;
const share = () => (shareMod ??= import('./share-card'));

let cluster: HTMLElement | null = null;

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

  const shareBtn = document.createElement('button');
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
    // Close the source panel when leaving to the lobby.
    if (!activeChapter()) void closeCode();
  });
  window.addEventListener('keydown', onKeydown);
}
