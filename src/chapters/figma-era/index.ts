// Figma Era chapter — 2019–2023.
// Full floating card layout and boot animation implemented here.
// Week 2: wire remaining content from chapters data model.

import './style.css';
import { chapterManager } from '../../engine/chapter';
import { onChapterProgress } from '../../engine/scroll';
import { navigateTo } from '../../engine/router';
import { getChapter } from '../../data/chapters';

const CHAPTER_ID = 'figma-era';
const TOTAL_PIPS = 7;

export function initFigmaEra(container: HTMLElement) {
  const chapter = getChapter(CHAPTER_ID)!;

  // Build chapter DOM
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

  // Wire back-to-lobby pill
  container.querySelector('.figma-back-pill')?.addEventListener('click', () => navigateTo(''));

  // Register with chapter manager
  chapterManager.register(CHAPTER_ID, container, () => onChapterInit(container, chapter));

  // Wire dwell-enter event (progress indicator pulses — handled by CSS class)
  container.addEventListener('dwell-enter', () => {
    document.getElementById('figma-progress')?.style.setProperty('opacity', '0.5');
  });
}

function onChapterInit(container: HTMLElement, chapter: ReturnType<typeof getChapter>) {
  if (!chapter) return;

  // Mount cards for the first 3 facts (initial visible set)
  const cardsContainer = document.getElementById('figma-cards')!;
  const initialFacts = chapter.facts.slice(0, 3);

  for (const fact of initialFacts) {
    const card = document.createElement('div');
    card.className = 'figma-card';
    card.innerHTML = `
      <div class="figma-card-year">${fact.year}</div>
      <div class="figma-card-headline">${fact.headline}</div>
      <div class="figma-card-body">${fact.body}</div>
    `;
    cardsContainer.appendChild(card);
  }

  // Boot arrival animation — plays when entering from CRT transition
  playBootAnimation(container);

  // Wire scroll progress
  onChapterProgress(CHAPTER_ID, (progress) => updateChapter(progress, chapter));
}

function playBootAnimation(container: HTMLElement) {
  const pixel = document.createElement('div');
  pixel.className = 'figma-boot-pixel';
  container.appendChild(pixel);

  // Remove pixel element after animation completes
  pixel.addEventListener('animationend', () => pixel.remove(), { once: true });
}

function updateChapter(progress: number, chapter: NonNullable<ReturnType<typeof getChapter>>) {
  updatePips(progress);
  updateCards(progress, chapter);

  // Show end state when near chapter bottom
  if (progress > 0.85) {
    document.getElementById('figma-end-state')?.classList.add('visible');
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

function updateCards(progress: number, chapter: NonNullable<ReturnType<typeof getChapter>>) {
  // Swap card sets at 1/3 and 2/3 progress
  const container = document.getElementById('figma-cards');
  if (!container) return;

  const factGroup = Math.floor(progress * 3); // 0, 1, or 2
  const startIdx = factGroup * 1; // show 1 new card per segment (supplement the initial 3)

  // This is a stub for Week 2's full card restack animation.
  // For now: just fade in additional facts when reached
  const existingCards = container.querySelectorAll('.figma-card');
  if (existingCards.length < chapter.facts.length && startIdx >= existingCards.length) {
    const fact = chapter.facts[startIdx];
    if (fact) {
      const card = document.createElement('div');
      card.className = 'figma-card';
      card.style.cssText = 'opacity:0;transition:opacity 0.5s ease;transform:translateX(100px) translateY(-20px) rotate(-0.5deg);z-index:4';
      card.innerHTML = `
        <div class="figma-card-year">${fact.year}</div>
        <div class="figma-card-headline">${fact.headline}</div>
        <div class="figma-card-body">${fact.body}</div>
      `;
      container.appendChild(card);
      requestAnimationFrame(() => {
        card.style.opacity = '1';
      });
    }
  }
}
