// Early Web chapter — 1983–1994.
// A real 1993 web page viewed in NCSA Mosaic / early Netscape, framed inside the
// dark museum shell. Facts render as titled sections (navy headline + red Courier
// year + Times body) separated by <hr> groove rules, revealed sequentially on
// scroll — the same scroll-driven reveal ARPANET uses for terminal output.
//
// Period artifacts (browser chrome, dithered banner, under-construction hazard bar,
// green odometer hit-counter) are CSS, not sourced GIFs (EARLY-WEB-BRIEF.md).
// The hit-counter doubles as the scroll-progress indicator — Early Web's equivalent
// of ARPANET's amber ASCII bar.
//
// Phase 2 T10: built by hand on the ARPANET/Figma pattern, then refactored onto the
// shared createChapter scaffold once it existed as the third real example.

import './style.css';
import { createChapter } from '../../engine/create-chapter';

const CHAPTER_ID = 'early-web';

// Progress thresholds for each fact (0-indexed). 6 facts across 0–1 scroll.
// Fact 0 reveals during the arrival assembly; 1–5 at even scroll intervals.
const FACT_THRESHOLDS = [0, 0.16, 0.32, 0.48, 0.64, 0.8];

// The hit-counter odometer runs 000000 → this as the visitor scrolls (period trope).
const COUNTER_MAX = 427;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let pageEl: HTMLElement | null = null;
let counterEl: HTMLElement | null = null;
let revealed = new Set<number>();

export const initEarlyWeb = createChapter({
  id: CHAPTER_ID,
  // No ambient bed authored for this era yet — the scaffold's startChapterAmbient
  // call is a no-op today, and keeping it wired means the bed lands for free.

  render: ({ chapter }) => {
    const factsHtml = chapter.facts
      .map(
        (fact, i) => `
      <section class="ew-fact" data-fact="${i}">
        <h2 class="ew-fact-headline">${fact.headline}</h2>
        <span class="ew-fact-year">${fact.year}</span>
        <p class="ew-fact-body">${linkifyTags(fact.body)}</p>
        <hr class="ew-rule" />
      </section>`,
      )
      .join('');

    return `
    <div class="ew-shell">
      <div class="ew-browser is-booting" id="ew-browser">
        <div class="ew-titlebar">
          <span class="ew-title">Chronicle — The Early Web — Netscape</span>
          <span class="ew-winctl" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span>
        </div>
        <div class="ew-toolbar" aria-hidden="true">
          <button class="ew-tbtn" tabindex="-1">Back</button>
          <button class="ew-tbtn" tabindex="-1">Forward</button>
          <button class="ew-tbtn" tabindex="-1">Home</button>
          <button class="ew-tbtn" tabindex="-1">Reload</button>
          <button class="ew-tbtn" tabindex="-1">Images</button>
        </div>
        <div class="ew-location">
          <span class="ew-location-label">Location:</span>
          <span class="ew-location-field">http://www.chronicle.net/early-web.html</span>
        </div>
        <div class="ew-page" id="ew-page">
          <div class="ew-banner">
            <span class="ew-banner-title">The Early Web</span>
            <span class="ew-banner-new">NEW!</span>
          </div>
          <div class="ew-facts" id="ew-facts">${factsHtml}</div>
          <footer class="ew-footer" aria-hidden="true">
            <div class="ew-construction"><span>UNDER CONSTRUCTION</span></div>
            <div class="ew-webring">
              <span class="ew-webring-link">&laquo; prev</span>
              <span class="ew-webring-sep">|</span>
              <span class="ew-webring-link">webring</span>
              <span class="ew-webring-sep">|</span>
              <span class="ew-webring-link">next &raquo;</span>
            </div>
            <div class="ew-lastmod">Last updated: December 1994</div>
          </footer>
        </div>
      </div>
      <div class="ew-counter" id="ew-counter" aria-hidden="true">
        <span class="ew-counter-label">Visitors</span>
        <span class="ew-counter-digits" id="ew-counter-digits">000000</span>
      </div>
    </div>
  `;
  },

  onInit: ({ container }) => {
    pageEl = container.querySelector('#ew-page');
    counterEl = container.querySelector('#ew-counter-digits');
    revealed = new Set();

    const browser = container.querySelector('#ew-browser');
    if (prefersReducedMotion()) {
      // Assembly collapses to an instant paint (brief: reduced-motion → instant).
      browser?.classList.remove('is-booting');
      revealFact(0);
    } else {
      // Mosaic page-load assembly: banner paints, text streams, counter pops —
      // driven by staggered CSS reveal off `.is-booting` removal. Fact 0 lands as
      // the "text streams in" beat. Whole assembly under ~1.2s (brief P7.3).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => browser?.classList.remove('is-booting'));
      });
      setTimeout(() => revealFact(0), 520);
    }

    updateCounter(0);
  },

  onProgress: (progress) => {
    // Reveal facts as their scroll thresholds are crossed.
    FACT_THRESHOLDS.forEach((threshold, i) => {
      if (progress >= threshold) revealFact(i);
    });
    updateCounter(progress);
  },

  onDwellEnter: () => {
    document.getElementById('ew-counter')?.classList.add('is-pulsing');
  },
});

// Reveal fact i and scroll it into view within the page (mirrors ARPANET's
// auto-scroll to the newest revealed line). Idempotent per fact.
function revealFact(i: number) {
  if (revealed.has(i)) return;
  revealed.add(i);
  const section = pageEl?.querySelector<HTMLElement>(`.ew-fact[data-fact="${i}"]`);
  if (!section) return;
  section.classList.add('is-revealed');
  // Scroll the newest fact into the browser viewport. Skip for fact 0 so the
  // banner stays in frame at the top during the arrival beat.
  if (i > 0 && pageEl) {
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    pageEl.scrollTo({ top: section.offsetTop - 120, behavior });
  }
}

function updateCounter(progress: number) {
  if (!counterEl) return;
  const count = Math.round(progress * COUNTER_MAX);
  counterEl.textContent = String(count).padStart(6, '0');
}

// The fact bodies contain literal HTML tag names (<img>, <table>) as prose. Escape
// them so they render as text, not as elements, then re-style them as inline code.
function linkifyTags(body: string): string {
  return body.replace(/<([a-z]+)>/g, '<code class="ew-tag">&lt;$1&gt;</code>');
}
