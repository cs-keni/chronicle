// ARPANET chapter — 1969–1982.
// Full implementation in Week 2 (terminal.ts, network-map.ts).
// This file: registers chapter, mounts SVG phosphor filter, stubs progress indicator.

import './style.css';
import { chapterManager } from '../../engine/chapter';
import { onChapterProgress } from '../../engine/scroll';
import { getChapter } from '../../data/chapters';

const CHAPTER_ID = 'arpanet';

export function initArpanet(container: HTMLElement) {
  // Mount phosphor glow SVG filter (applied to the chapter via CSS filter: url(#phosphor-glow))
  mountPhosphorFilter();

  // Stub layout — Week 2 replaces with terminal.ts and network-map.ts
  container.innerHTML = `
    <div class="arpanet-terminal">
      <div class="arpanet-terminal-output" id="arpanet-output"></div>
      <span class="arpanet-cursor" id="arpanet-cursor"></span>
    </div>
    <svg class="arpanet-network-map" id="arpanet-network-map" viewBox="0 0 340 260" aria-hidden="true">
      <!-- Network map SVG — mounted by network-map.ts in Week 2 -->
    </svg>
    <div class="arpanet-progress" id="arpanet-progress">▓▓▓▓▒▒░░░░ 0%</div>
  `;

  // Register with chapter manager
  chapterManager.register(CHAPTER_ID, container, () => onChapterInit(container));

  // Wire dwell-enter event → pulse progress indicator
  container.addEventListener('dwell-enter', () => {
    document.getElementById('arpanet-progress')?.classList.add('pulsing');
  });
}

function onChapterInit(container: HTMLElement) {
  // Populate opening text (Week 2: terminal.ts takes over with full typing scheduler)
  const output = document.getElementById('arpanet-output');
  if (output) {
    const chapter = getChapter(CHAPTER_ID)!;
    output.textContent = `CONNECTED TO ARPANET NODE 1 — ${chapter.yearRange.split('–')[0]}\n`;
  }

  // Progress indicator wired to scroll
  onChapterProgress(CHAPTER_ID, updateProgress);

  // Network map glows in after a short delay
  setTimeout(() => {
    document.getElementById('arpanet-network-map')?.classList.add('visible');
  }, 2000);
}

function updateProgress(progress: number) {
  const el = document.getElementById('arpanet-progress');
  if (!el) return;

  const pct = Math.round(progress * 100);
  const filled = Math.round(progress * 10);
  const bar = '▓'.repeat(Math.min(filled, 4))
    + '▒'.repeat(Math.min(Math.max(filled - 4, 0), 2))
    + '░'.repeat(Math.max(10 - filled, 0));

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
