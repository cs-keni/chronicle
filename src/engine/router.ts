// Hash router — static-deploy compatible (D routing architecture).
// Valid hashes: #arpanet, #figma-era. Empty or # → lobby.
// Direct-link entry: fade from black 0.5s ease-in; no preceding transition (captureFrom unavailable).
// Lobby→Chapter: same fade-from-black code path.

import { chapterManager } from './chapter';
import { scrollToChapter, suppressTransitionRequests } from './scroll';
import { validChapterIds } from '../data/manifest';

// Derived from the manifest's live subset — no longer hand-maintained here.
const VALID_CHAPTERS = new Set(validChapterIds());
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
  // Suppress GSAP-triggered transition requests for 200ms: the programmatic
  // scrollTo causes GSAP to fire onUpdate(progress≥1) for the preceding
  // chapter, which would otherwise start a spurious CRT transition.
  suppressTransitionRequests(200);
  chapterManager.activate(id);
  chapterManager.deactivate('lobby');
  scrollToChapter(id);

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
