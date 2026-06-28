// Hash router — static-deploy compatible (D routing architecture).
// Valid hashes: #arpanet, #figma-era. Empty or # → lobby.
// Direct-link entry: fade from black 0.5s ease-in; no preceding transition (captureFrom unavailable).
// Lobby→Chapter: same fade-from-black code path.

import { chapterManager } from './chapter';
import { scrollToChapter } from './scroll';

const VALID_CHAPTERS = new Set(['arpanet', 'figma-era']);
const SCROLL_CONTAINER = document.getElementById('scroll-container')!;
const OVERLAY = document.getElementById('transition-overlay')!;

export function initRouter() {
  window.addEventListener('hashchange', () => handleRoute(window.location.hash));
  handleRoute(window.location.hash);
}

function handleRoute(hash: string) {
  const id = hash.replace('#', '').trim();

  if (!id || !VALID_CHAPTERS.has(id)) {
    showLobby();
  } else {
    showChapter(id);
  }
}

function showLobby() {
  hideScrollContainer();
  chapterManager.activate('lobby');
}

function showChapter(id: string) {
  // Fade to black immediately (covers any flash during DOM swap)
  OVERLAY.style.transition = 'none';
  OVERLAY.style.opacity = '1';

  showScrollContainer();
  scrollToChapter(id);
  chapterManager.activate(id);
  chapterManager.deactivate('lobby');

  // Fade from black — 0.5s ease-in per spec
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      OVERLAY.style.transition = 'opacity 0.5s ease-in';
      OVERLAY.style.opacity = '0';
    });
  });
}

export function navigateTo(id: string) {
  if (!id || id === 'lobby') {
    window.location.hash = '';
  } else {
    window.location.hash = id;
  }
}

function showScrollContainer() {
  SCROLL_CONTAINER.classList.add('active');
  document.body.style.overflow = '';
}

function hideScrollContainer() {
  SCROLL_CONTAINER.classList.remove('active');
  document.body.style.overflow = 'hidden';
}
