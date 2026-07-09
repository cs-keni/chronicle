// Code overlay — the "view source" panel. Press `?` on any chapter to slide in a
// panel showing the REAL source behind the effect you're looking at. Source is
// imported via Vite's `?raw` so it can never drift from what actually ships;
// the curation is only which files lead and a one-line caption on the technique.
//
// Lazy-loaded (dynamic import from controls.ts) so the raw source strings and the
// highlighter stay out of the initial paint bundle.

import { highlight, type Lang } from './highlight';

// Real source, inlined at build time — never goes stale.
import arpanetIndexSrc from '../chapters/arpanet/index.ts?raw';
import arpanetTerminalSrc from '../chapters/arpanet/terminal.ts?raw';
import earlyWebIndexSrc from '../chapters/early-web/index.ts?raw';
import earlyWebStyleSrc from '../chapters/early-web/style.css?raw';
import figmaStyleSrc from '../chapters/figma-era/style.css?raw';
import figmaIndexSrc from '../chapters/figma-era/index.ts?raw';

interface SourceFile {
  label: string;
  path: string;
  lang: Lang;
  caption: string;
  code: string;
}

const REGISTRY: Record<string, SourceFile[]> = {
  arpanet: [
    {
      label: 'index.ts',
      path: 'src/chapters/arpanet/index.ts',
      lang: 'ts',
      caption: 'The phosphor-glow SVG filter — a blurred copy composited UNDER the crisp text, not over it.',
      code: arpanetIndexSrc,
    },
    {
      label: 'terminal.ts',
      path: 'src/chapters/arpanet/terminal.ts',
      lang: 'ts',
      caption: 'The typing scheduler: per-character delays, and a scroll gesture fast-forwards the whole queue.',
      code: arpanetTerminalSrc,
    },
  ],
  'early-web': [
    {
      label: 'style.css',
      path: 'src/chapters/early-web/style.css',
      lang: 'css',
      caption: 'The Netscape 1.0 window in pure CSS: outset/inset bevels from four-color borders, a web-safe palette, and a hazard-bar gradient — no images.',
      code: earlyWebStyleSrc,
    },
    {
      label: 'index.ts',
      path: 'src/chapters/early-web/index.ts',
      lang: 'ts',
      caption: 'Facts reveal on scroll into the framed page, and the green odometer hit-counter ticks up as the visitor scrolls — the era’s own progress bar.',
      code: earlyWebIndexSrc,
    },
  ],
  'figma-era': [
    {
      label: 'style.css',
      path: 'src/chapters/figma-era/style.css',
      lang: 'css',
      caption: 'Glassmorphism: a translucent card over a backdrop-filter blur, with a hard fallback for older browsers.',
      code: figmaStyleSrc,
    },
    {
      label: 'index.ts',
      path: 'src/chapters/figma-era/index.ts',
      lang: 'ts',
      caption: 'The GSAP card restack — A/B/C depth swap at 33% scroll progress, accent border migrating to the new front card.',
      code: figmaIndexSrc,
    },
  ],
};

let root: HTMLElement | null = null;
let backdrop: HTMLElement | null = null;
let isOpen = false;
let currentChapter: string | null = null;
let activeFileIdx = 0;
let lastFocused: HTMLElement | null = null;

function build(): HTMLElement {
  backdrop = document.createElement('div');
  backdrop.className = 'code-backdrop';
  backdrop.addEventListener('click', close);

  root = document.createElement('aside');
  root.className = 'code-overlay';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Source code for this chapter');
  root.tabIndex = -1;

  document.body.appendChild(backdrop);
  document.body.appendChild(root);
  return root;
}

function render(chapterId: string) {
  if (!root) build();
  const files = REGISTRY[chapterId] ?? [];
  if (files.length === 0) return;
  activeFileIdx = Math.min(activeFileIdx, files.length - 1);
  const file = files[activeFileIdx];

  const tabs = files
    .map(
      (f, idx) =>
        `<button class="code-tab${idx === activeFileIdx ? ' is-active' : ''}" data-idx="${idx}" type="button">${f.label}</button>`
    )
    .join('');

  root!.innerHTML = `
    <header class="code-head">
      <div class="code-head-title">
        <span class="code-head-badge">VIEW SOURCE</span>
        <span class="code-head-path">${file.path}</span>
      </div>
      <button class="code-close" type="button" aria-label="Close source panel (Esc)">esc ✕</button>
    </header>
    <nav class="code-tabs" role="tablist">${tabs}</nav>
    <p class="code-caption">${file.caption}</p>
    <div class="code-scroll"><pre class="code-pre"><code>${highlight(file.code, file.lang)}</code></pre></div>
    <footer class="code-foot">Real source, imported at build time — this is exactly what ships.</footer>
  `;

  root!.querySelector('.code-close')!.addEventListener('click', close);
  root!.querySelectorAll<HTMLButtonElement>('.code-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      if (idx !== activeFileIdx) {
        activeFileIdx = idx;
        render(chapterId);
        root!.querySelector('.code-scroll')!.scrollTop = 0;
      }
    });
  });
}

export function openCodeOverlay(chapterId: string) {
  if (isOpen && currentChapter === chapterId) return;
  if (currentChapter !== chapterId) activeFileIdx = 0;
  currentChapter = chapterId;
  lastFocused = document.activeElement as HTMLElement;
  render(chapterId);
  requestAnimationFrame(() => {
    backdrop!.classList.add('is-open');
    root!.classList.add('is-open');
    root!.focus();
  });
  isOpen = true;
}

export function closeCodeOverlay() {
  close();
}

function close() {
  if (!isOpen || !root || !backdrop) return;
  root.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  isOpen = false;
  lastFocused?.focus?.();
}

export function toggleCodeOverlay(chapterId: string) {
  if (isOpen) close();
  else openCodeOverlay(chapterId);
}

export function isCodeOverlayOpen(): boolean {
  return isOpen;
}
