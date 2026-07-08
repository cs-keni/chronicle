// Share card — renders a purpose-built, off-screen 1200×630 branded card for the
// active chapter, rasterizes it with html2canvas (reusing the transition engine's
// cached loader), then shares it: Web Share API (mobile) → clipboard image
// (desktop) → file download (last resort). Lazy-loaded from controls.ts.
//
// Why a purpose-built card and not a screenshot of the live chapter: html2canvas
// cannot render the ARPANET phosphor SVG filter or any WebGL, and the Figma glass
// uses backdrop-filter (also uncapturable). A hand-built card sidesteps all three,
// always looks right, and — critically — bakes the URL into every share so the
// image carries its own link back.

import { getChapter, type Chapter } from '../data/chapters';
import { loadHtml2canvas } from '../engine/transition';

const SITE_URL = 'chronicle-topaz-ten.vercel.app';
const CARD_W = 1200;
const CARD_H = 630;

function buildCard(chapter: Chapter): HTMLElement {
  const { palette, name, yearRange } = chapter;
  const fact = chapter.facts[0];

  const card = document.createElement('div');
  card.className = 'chronicle-share-card';
  // Off-screen but fully laid out (html2canvas needs real geometry).
  Object.assign(card.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${CARD_W}px`,
    height: `${CARD_H}px`,
    zIndex: '-1',
    background: palette.bg,
    color: palette.text,
    fontFamily: chapter.fontFamily,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '64px 72px',
    boxSizing: 'border-box',
  });

  const accent = palette.accent ?? palette.text;
  const isArpanet = chapter.id === 'arpanet';

  // A chapter-flavored centerpiece. ARPANET: amber terminal lines with a CSS glow
  // (text-shadow DOES capture, unlike the SVG filter). Figma: a glass-ish card.
  const centerpiece = isArpanet
    ? `
      <div style="font-family:${chapter.fontFamily};color:${palette.text};text-shadow:0 0 8px rgba(255,149,0,0.55);font-size:26px;line-height:1.7;letter-spacing:0.02em;">
        <div style="opacity:0.65;">CONNECTED TO IMP NODE 1 — UCLA</div>
        <div style="margin-top:18px;">[${fact.year}] ${fact.headline.toUpperCase()}</div>
        <div style="font-size:19px;opacity:0.85;margin-top:14px;max-width:900px;line-height:1.6;">${truncate(fact.body, 180)}</div>
        <div style="margin-top:16px;">&gt;<span style="display:inline-block;width:11px;height:22px;background:${palette.text};margin-left:8px;vertical-align:middle;box-shadow:0 0 8px rgba(255,149,0,0.7);"></span></div>
      </div>`
    : `
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:20px;padding:40px 44px;max-width:920px;">
        <span style="display:inline-block;padding:6px 16px;border-radius:100px;font-size:16px;font-weight:500;color:${accent};background:rgba(0,212,255,0.10);border:1px solid rgba(0,212,255,0.25);letter-spacing:0.04em;">${fact.year}</span>
        <div style="font-size:34px;font-weight:600;line-height:1.25;margin-top:20px;color:${palette.text};">${fact.headline}</div>
        <div style="font-size:19px;line-height:1.6;margin-top:16px;color:rgba(255,255,255,0.62);">${truncate(fact.body, 200)}</div>
      </div>`;

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:baseline;gap:16px;">
        <span style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:0.22em;color:${accent};">CHRONICLE</span>
        <span style="font-family:'Courier New',monospace;font-size:14px;letter-spacing:0.18em;opacity:0.5;">A HISTORY OF INTERFACE DESIGN</span>
      </div>
      <span style="font-family:'Courier New',monospace;font-size:15px;letter-spacing:0.1em;opacity:0.55;">${yearRange}</span>
    </div>

    ${centerpiece}

    <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid ${hexToRgba(accent, 0.18)};padding-top:24px;">
      <span style="font-size:30px;font-weight:600;letter-spacing:0.02em;">${name}</span>
      <span style="font-family:'Courier New',monospace;font-size:17px;letter-spacing:0.06em;color:${accent};">${SITE_URL}/#${chapter.id}</span>
    </div>
  `;

  return card;
}

export async function shareChapter(chapterId: string): Promise<void> {
  const chapter = getChapter(chapterId);
  if (!chapter) return;

  showToast('Rendering share card…', 'pending');
  const card = buildCard(chapter);
  document.body.appendChild(card);

  try {
    const html2canvas = await loadHtml2canvas();
    const canvas = await html2canvas(card, {
      width: CARD_W,
      height: CARD_H,
      windowWidth: CARD_W,
      windowHeight: CARD_H,
      scale: 2,
      backgroundColor: chapter.palette.bg,
      logging: false,
    });

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/png')
    );
    if (!blob) throw new Error('canvas.toBlob returned null');

    const file = new File([blob], `chronicle-${chapterId}.png`, { type: 'image/png' });
    const text = `${chapter.name} (${chapter.yearRange}) — a scroll-through history of interface design. ${SITE_URL}`;

    // 1) Native share sheet (mobile) with the image file.
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], title: `Chronicle — ${chapter.name}`, text });
        hideToast();
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') { hideToast(); return; } // user dismissed sheet
        // fall through to clipboard/download
      }
    }

    // 2) Copy the PNG to the clipboard (desktop).
    if (navigator.clipboard && typeof (navigator.clipboard as Clipboard).write === 'function' && typeof ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Share card copied to clipboard', 'success');
        return;
      } catch {
        // fall through to download
      }
    }

    // 3) Download the file.
    downloadBlob(blob, file.name);
    showToast('Share card downloaded', 'success');
  } catch (err) {
    console.warn('[share] failed:', err);
    showToast('Could not render share card', 'error');
  } finally {
    card.remove();
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── toast ──────────────────────────────────────────────────────────────────

let toastEl: HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

type ToastKind = 'pending' | 'success' | 'error';

function showToast(message: string, kind: ToastKind): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'chronicle-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }

  const spinner = kind === 'pending' ? '<span class="toast-spinner"></span>' : '';
  toastEl.className = `chronicle-toast toast--${kind}`;
  toastEl.innerHTML = `${spinner}<span>${message}</span>`;
  requestAnimationFrame(() => toastEl!.classList.add('is-visible'));

  if (kind !== 'pending') {
    toastTimer = setTimeout(hideToast, 2600);
  }
}

function hideToast(): void {
  if (!toastEl) return;
  toastEl.classList.remove('is-visible');
}
