// ARPANET chapter — 1969–1982.
// Week 2: terminal.ts typing scheduler + scroll-triggered facts.
// Week 2: network-map.ts SVG node diagram (initNetworkMap stub below).

import './style.css';
import { chapterManager } from '../../engine/chapter';
import { onChapterProgress } from '../../engine/scroll';
import { getChapter } from '../../data/chapters';
import { ArpanetTerminal } from './terminal';
import { initNetworkMap } from './network-map';

const CHAPTER_ID = 'arpanet';

// Progress thresholds for each fact (0-indexed). 8 facts across 0–1 scroll.
// Fact 0 fires at activate (progress 0). Facts 1–7 at even intervals.
const FACT_THRESHOLDS = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84];

let terminal: ArpanetTerminal | null = null;
let lastProgress = 0;

export function initArpanet(container: HTMLElement) {
  mountPhosphorFilter();

  container.innerHTML = `
    <div class="arpanet-terminal">
      <div class="arpanet-terminal-output" id="arpanet-output"></div>
      <span class="arpanet-cursor" id="arpanet-cursor"></span>
    </div>
    <svg class="arpanet-network-map" id="arpanet-network-map" viewBox="0 0 340 260" aria-hidden="true">
      <!-- network-map.ts mounts content in Week 2 -->
    </svg>
    <div class="arpanet-progress" id="arpanet-progress">▓▓▓▓▒▒░░░░ 0%</div>
  `;

  chapterManager.register(CHAPTER_ID, container, () => onChapterInit(container));

  container.addEventListener('dwell-enter', () => {
    document.getElementById('arpanet-progress')?.classList.add('pulsing');
  });
}

function onChapterInit(container: HTMLElement) {
  const chapter = getChapter(CHAPTER_ID)!;
  const outputEl = document.getElementById('arpanet-output')!;
  const cursorEl = document.getElementById('arpanet-cursor')!;

  terminal = new ArpanetTerminal(outputEl, cursorEl);
  terminal.start(chapter.facts);

  // Reveal fact 0 immediately on chapter activate
  terminal.revealFact(chapter.facts[0], 0);
  lastProgress = 0;

  onChapterProgress(CHAPTER_ID, (progress) => {
    // Fast-forward any active typing when user is scrolling forward
    if (progress > lastProgress && terminal) {
      terminal.fastForward();
    }
    lastProgress = progress;

    // Trigger remaining facts at scroll thresholds
    FACT_THRESHOLDS.forEach((threshold, i) => {
      if (i === 0) return; // already revealed above
      if (progress >= threshold && terminal) {
        terminal.revealFact(chapter.facts[i], i);
      }
    });

    updateProgress(progress);
  });

  // Network map: inject content first (getTotalLength needs element in DOM),
  // fade parent in at 1s, then start line-draw animation at 2s.
  const mapEl = document.getElementById('arpanet-network-map') as SVGSVGElement | null;
  if (mapEl) {
    initNetworkMap(mapEl, 1.0); // 1.0s matches setTimeout below
    setTimeout(() => mapEl.classList.add('visible'), 1000);
  }
}

function updateProgress(progress: number) {
  const el = document.getElementById('arpanet-progress');
  if (!el) return;

  const pct = Math.round(progress * 100);
  const filled = Math.round(progress * 10);
  const bar =
    '▓'.repeat(Math.min(filled, 4)) +
    '▒'.repeat(Math.min(Math.max(filled - 4, 0), 2)) +
    '░'.repeat(Math.max(10 - filled, 0));

  el.textContent = `${bar} ${pct}%`;
}

function mountPhosphorFilter() {
  if (document.getElementById('phosphor-glow')) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = `
    <defs>
      <filter id="phosphor-glow" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="
          1.2  0    0    0    0
          0.3  0.8  0    0    0
          0    0    0.1  0    0
          0    0    0    1    0
        "/>
        <feGaussianBlur stdDeviation="3" result="glow"/>
        <feMerge>
          <feMergeNode in="SourceGraphic"/>
          <feMergeNode in="glow"/>
        </feMerge>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
}
