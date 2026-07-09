// Figma Era chapter — 2019–2023.
// Card restack at 1/3 progress: A exits, B→A, C→B, fact3 enters as new C.
// GSAP drives all card positioning (removes nth-child CSS dependency).

import './style.css';
import { gsap } from 'gsap';
import { chapterManager } from '../../engine/chapter';
import { onChapterProgress } from '../../engine/scroll';
import { navigateTo } from '../../engine/router';
import { getChapter } from '../../data/chapters';
import { startChapterAmbient } from '../../engine/audio';

const CHAPTER_ID = 'figma-era';
const TOTAL_PIPS = 7;

// Card positions — match FIGMA-ERA-BRIEF.md layout spec
const POS_A  = { x: -120, y: 20,   rotation: -1.5, zIndex: 2, opacity: 1 } as const;
const POS_B  = { x:   60, y: -10,  rotation: 0,    zIndex: 3, opacity: 1 } as const;
const POS_C  = { x:  -80, y: 60,   rotation: 1,    zIndex: 1, opacity: 1 } as const;
const POS_OFF = { x: 280, y: -20,  rotation: 2,    zIndex: 0, opacity: 0 } as const;

const RESTACK_DURATION = 0.6;
const RESTACK_EASE = 'power2.inOut';
const RESTACK_THRESHOLD = 0.33;

let currentScene = 0;
let cardEls: HTMLElement[] = [];
// Latch so the closing-beat event fires once per chapter entry, not every tick.
let closingBeatFired = false;

export function initFigmaEra(container: HTMLElement) {
  const chapter = getChapter(CHAPTER_ID)!;

  container.innerHTML = `
    <div class="figma-cards-container" id="figma-cards"></div>
    <div class="figma-progress" id="figma-progress" aria-hidden="true">
      ${Array.from({ length: TOTAL_PIPS }, (_, i) =>
        `<div class="figma-pip${i === 0 ? ' active' : ''}"></div>`
      ).join('')}
    </div>
    <div class="figma-end-state" id="figma-end-state">
      <span class="figma-end-text">End of Known History. More Chapters Loading.</span>
      <a class="figma-back-pill" role="button" tabindex="0">Explore more →</a>
    </div>
  `;

  container.querySelector('.figma-back-pill')?.addEventListener('click', () => navigateTo(''));

  chapterManager.register(CHAPTER_ID, container, () => onChapterInit(container, chapter));

  container.addEventListener('dwell-enter', () => {
    document.getElementById('figma-progress')?.style.setProperty('opacity', '0.5');
  });
}

function onChapterInit(container: HTMLElement, chapter: ReturnType<typeof getChapter>) {
  if (!chapter) return;

  const cardsContainer = document.getElementById('figma-cards')!;
  currentScene = 0;
  closingBeatFired = false;
  cardEls = [];

  // Create all 4 cards upfront — fact3 starts off-screen
  for (const fact of chapter.facts) {
    const card = document.createElement('div');
    card.className = 'figma-card';
    card.innerHTML = `
      <div class="figma-card-year">${fact.year}</div>
      <div class="figma-card-headline">${fact.headline}</div>
      <div class="figma-card-body">${fact.body}</div>
    `;
    cardsContainer.appendChild(card);
    cardEls.push(card);
  }

  // Place cards at initial positions (instant, no animation)
  gsap.set(cardEls[0], POS_A);
  gsap.set(cardEls[1], { ...POS_B });
  gsap.set(cardEls[2], POS_C);
  gsap.set(cardEls[3], POS_OFF);

  // Card B starts with accent border
  cardEls[1].classList.add('figma-card--accent');

  startChapterAmbient('figma-era');
  playBootAnimation(container);
  onChapterProgress(CHAPTER_ID, (progress) => updateChapter(progress, chapter));
}

function playBootAnimation(container: HTMLElement) {
  const pixel = document.createElement('div');
  pixel.className = 'figma-boot-pixel';
  container.appendChild(pixel);
  pixel.addEventListener('animationend', () => pixel.remove(), { once: true });
}

function updateChapter(progress: number, chapter: NonNullable<ReturnType<typeof getChapter>>) {
  updatePips(progress);
  updateCards(progress);

  if (progress > 0.85) {
    document.getElementById('figma-end-state')?.classList.add('visible');
    if (!closingBeatFired) {
      closingBeatFired = true;
      // The emotional payoff has landed. Tell the global UI layer so it can
      // offer a one-time nudge to share — the chapter stays ignorant of the
      // share affordance; controls.ts owns that discovery UX.
      window.dispatchEvent(
        new CustomEvent('chronicle:closing-beat', { detail: { chapter: CHAPTER_ID } })
      );
    }
  }
}

function updatePips(progress: number) {
  const pips = document.querySelectorAll<HTMLElement>('#figma-progress .figma-pip');
  const activePip = Math.floor(progress * TOTAL_PIPS);

  pips.forEach((pip, i) => {
    pip.classList.remove('active', 'visited');
    if (i < activePip) pip.classList.add('visited');
    else if (i === activePip) pip.classList.add('active');
  });
}

function updateCards(progress: number) {
  const newScene = progress >= RESTACK_THRESHOLD ? 1 : 0;
  if (newScene === currentScene || cardEls.length < 4) return;
  currentScene = newScene;

  if (newScene === 1) {
    restackCards();
  }
}

function restackCards() {
  const [c0, c1, c2, c3] = cardEls;

  // c0 (was A) exits to the left
  gsap.to(c0, {
    x: -340, y: 100, rotation: -6, scale: 0.85, opacity: 0,
    duration: 0.5, ease: 'power2.in',
    onComplete: () => c0.remove(),
  });

  // c1 (was B) moves to A
  gsap.to(c1, { ...POS_A, duration: RESTACK_DURATION, ease: RESTACK_EASE });
  c1.classList.remove('figma-card--accent');

  // c2 (was C) rises to B (front) — slight delay so c1 clears the way
  gsap.to(c2, { ...POS_B, duration: RESTACK_DURATION, ease: RESTACK_EASE, delay: 0.1 });
  c2.classList.add('figma-card--accent');

  // c3 (was off-screen right) slides in to C
  gsap.to(c3, { ...POS_C, duration: RESTACK_DURATION, ease: RESTACK_EASE, delay: 0.2 });
}
