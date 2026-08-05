// Browser Wars chapter — 1995–2001.
//
// A real 1998 personal homepage viewed in Internet Explorer 4, framed inside the dark
// museum shell. Correctly ugly, which takes more craft than tastefully ugly.
// Full visual spec: docs/BROWSER-WARS-BRIEF.md. Build to the BRIEF, not to prose.
//
// THE ONE IDEA THIS CHAPTER IS BUILT ON:
//   The page inside the fiction has no hierarchy. The chapter does.
//   The fact well is the widest, most central, calmest object; every loud thing lives
//   in the rails and never occludes content. Decoration is period-ugly; fact text
//   holds WCAG AA (#1A1A1A on #FFFFFF = 17.4:1).
//
// Frame continuity: Early Web is framed in Netscape 1.0, this in IE4, so the two
// chapters together tell the browser war in two window chromes with no copy. The
// throbber is therefore IE4's own — the plan's D3.1 Netscape throbber was reversed by
// design review, because an IE4 window cannot carry an N-comet. Netscape survives as
// a badge in the cluster: the loser reduced to a button, which is what happened.

import './style.css';
import { createChapter } from '../../engine/create-chapter';

import tileGif from './assets/tile.gif';
import wordartSvg from './assets/wordart-browser-wars.svg';
import constructionGif from './assets/under-construction.gif';
import constructionPng from './assets/under-construction-static.png';
import emailGif from './assets/email.gif';
import emailPng from './assets/email-static.png';
import newGif from './assets/new.gif';
import newPng from './assets/new-static.png';
import badgeNetscape from './assets/badge-netscape.png';
import badgeIe from './assets/badge-ie.png';
import badgeNotepad from './assets/badge-notepad.png';
import badgeHosted from './assets/badge-hosted.png';

const CHAPTER_ID = 'browser-wars';

// 6 facts across 0–1 scroll. Fact 0 lands during the arrival assembly.
const FACT_THRESHOLDS = [0, 0.16, 0.32, 0.48, 0.64, 0.8];

// The counter is SEEDED, not scroll-driven — scroll progress belongs to the throbber
// now, which frees the counter to be the interactive artifact SPEC:83/108 assigns it.
const COUNTER_SEED = 1482;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let pageEl: HTMLElement | null = null;
let counterValue = COUNTER_SEED;
let revealed = new Set<number>();

export const initBrowserWars = createChapter({
  id: CHAPTER_ID,

  render: ({ chapter }) => {
    const factsHtml = chapter.facts
      .map(
        (fact, i) => `
        <section class="bw-fact" data-fact="${i}">
          <h2 class="bw-fact-headline">${fact.headline}</h2>
          <span class="bw-fact-year">${fact.year}</span>
          <p class="bw-fact-body">${escapeTags(fact.body)}</p>
          ${i < chapter.facts.length - 1 ? '<hr class="bw-rule" />' : ''}
        </section>`,
      )
      .join('');

    // Every <img> carries explicit width/height. The arrival beat's jank is TIMING,
    // never layout — reserved space means no CLS and no motion-sickness risk.
    const badge = (src: string, alt: string) =>
      `<img class="bw-badge" src="${src}" alt="${alt}" width="88" height="31" loading="lazy" decoding="async">`;

    // Animated GIFs ship a static first-frame sibling in data-static. CSS cannot
    // pause a GIF (Codex #8), so reduced-motion swaps the src in JS.
    const gif = (src: string, still: string, alt: string, cls: string) =>
      `<img class="bw-gif ${cls}" src="${src}" data-anim="${src}" data-static="${still}"
            alt="${alt}" width="64" height="64" loading="lazy" decoding="async">`;

    return `
    <div class="bw-shell">
      <div class="bw-browser" id="bw-browser" style="--bw-tile:url(${tileGif})">
        <div class="bw-titlebar">
          <span class="bw-winctl" aria-hidden="true">&minus;</span>
          <span class="bw-title">Browser Wars — Microsoft Internet Explorer</span>
          <span class="bw-winctl" aria-hidden="true">&square;</span>
          <span class="bw-winctl" aria-hidden="true">&times;</span>
        </div>
        <div class="bw-menubar" aria-hidden="true">
          <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span>
          <span><u>G</u>o</span><span>F<u>a</u>vorites</span><span><u>H</u>elp</span>
        </div>
        <div class="bw-toolbar" aria-hidden="true">
          <span class="bw-tbtn"><i class="bw-ico bw-ico-back"></i>Back</span>
          <span class="bw-tbtn is-off"><i class="bw-ico bw-ico-fwd"></i>Forward</span>
          <span class="bw-tsep"></span>
          <span class="bw-tbtn"><i class="bw-ico bw-ico-stop"></i>Stop</span>
          <span class="bw-tbtn"><i class="bw-ico bw-ico-refresh"></i>Refresh</span>
          <span class="bw-tbtn"><i class="bw-ico bw-ico-home"></i>Home</span>
          <span class="bw-tsep"></span>
          <span class="bw-tbtn"><i class="bw-ico bw-ico-search"></i>Search</span>
          <span class="bw-tbtn"><i class="bw-ico bw-ico-fav"></i>Favorites</span>
          <!-- Scroll-progress indicator. Every chapter's is a period-native artifact
               of its own era, never a generic bar (see docs/HANDOFF.md). -->
          <span class="bw-throbber" id="bw-throbber"><i class="bw-ico bw-ico-e"></i></span>
        </div>
        <div class="bw-address" aria-hidden="true">
          <span class="bw-address-label">Address</span>
          <span class="bw-address-field">http://www.chronicle.net/~browserwars/index.html</span>
        </div>

        <div class="bw-page" id="bw-page">
          <!-- <marquee> is deprecated and screen-reader handling is unreliable, so the
               visible bar is aria-hidden and the text is repeated in a visually-hidden
               static element for AT. -->
          <div class="bw-marquee bw-stagger" aria-hidden="true"><span class="bw-marquee-track">★ ★ ★ WELCOME TO MY HOMEPAGE ★ ★ ★ THIS SITE IS BEST VIEWED IN 800×600 ★ ★ ★ SIGN MY GUESTBOOK ★ ★ ★ LAST UPDATED 11/18/98 ★ ★ ★</span></div>
          <p class="bw-sr-only">Welcome to my homepage. This site is best viewed in 800 by 600. Last updated 18 November 1998.</p>

          <div class="bw-hero bw-stagger">
            <img class="bw-wordart" src="${wordartSvg}" alt="Browser Wars" width="560" height="96">
          </div>

          <div class="bw-cols">
            <aside class="bw-rail bw-stagger" aria-hidden="true">
              ${badge(badgeNetscape, 'Netscape Now!')}
              ${badge(badgeIe, 'Get Internet Explorer')}
              ${badge(badgeNotepad, 'Made with Notepad')}
              ${badge(badgeHosted, 'Hosted on GeoCities')}
              <div class="bw-webring">
                ~ THE 90s WEBRING ~<br>
                <span class="bw-wr-link">[Prev]</span>
                <span class="bw-wr-link">[Random]</span>
                <span class="bw-wr-link is-visited">[Next]</span>
              </div>
            </aside>

            <div class="bw-well bw-stagger">
              <div class="bw-well-inner" id="bw-facts">${factsHtml}</div>
            </div>

            <aside class="bw-side bw-stagger">
              <!-- The chapter's interactive artifact. Clicking inflates it, which
                   teaches the historical fact by letting the visitor commit the
                   fraud 90s page owners committed. -->
              <div class="bw-counter">
                <span class="bw-counter-label" id="bw-counter-label">YOU ARE VISITOR</span>
                <button type="button" class="bw-counter-digits" id="bw-counter"
                        aria-describedby="bw-counter-label"
                        aria-label="Visitor counter. Click to increment.">
                  <span id="bw-counter-value" aria-live="polite">001482</span>
                </button>
              </div>
              ${gif(constructionGif, constructionPng, 'Under construction', 'bw-gif-constr')}
              ${gif(emailGif, emailPng, 'Email me', 'bw-gif-mail')}
              ${gif(newGif, newPng, 'New!', 'bw-gif-new')}
            </aside>
          </div>

          <footer class="bw-foot" aria-hidden="true">
            <span class="bw-link">Sign my guestbook</span> ·
            <span class="bw-link is-visited">View my guestbook</span> ·
            <span class="bw-link">Links</span> ·
            <span class="bw-link">About me</span><br>
            This page © 1998. Best viewed in 800×600 with Netscape Navigator 4.0 or higher.
          </footer>
        </div>

        <div class="bw-status" aria-hidden="true">
          <span class="bw-status-cell bw-grow">Done</span>
          <span class="bw-status-cell">Internet zone</span>
        </div>
      </div>
    </div>
  `;
  },

  onInit: ({ container }) => {
    pageEl = container.querySelector('#bw-page');
    revealed = new Set();
    counterValue = COUNTER_SEED;
    renderCounter();

    applyReducedMotionAssets(container);

    runArrivalBeat(container);

    // Click (and Enter/Space via native button semantics) inflates the counter.
    container.querySelector('#bw-counter')?.addEventListener('click', () => {
      counterValue += 1;
      renderCounter();
    });

    // Respond live if the user flips reduced-motion mid-chapter.
    window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', () => applyReducedMotionAssets(container));
  },

  onProgress: (progress) => {
    FACT_THRESHOLDS.forEach((threshold, i) => {
      if (progress >= threshold) revealFact(i);
    });
    // The throbber spins while the chapter is in motion and rests when settled.
    const throbber = document.getElementById('bw-throbber');
    throbber?.classList.toggle('is-spinning', progress > 0.001 && progress < 0.999);
  },

  onDwellEnter: () => {
    document.getElementById('bw-throbber')?.classList.add('is-spinning');
  },
});

/**
 * The 56k page load.
 *
 * Deliberately out of order and unevenly spaced — an even curve reads as a designed
 * reveal, which is the opposite of what 1998 felt like. Class toggles, never
 * fill-mode keyframes (docs/HANDOFF.md), so an arrived element stops counting
 * against the motion budget.
 */
const ARRIVAL_BEAT: Array<[selector: string, delayMs: number]> = [
  ['.bw-hero', 120],
  ['.bw-marquee', 220],
  ['.bw-well', 300],
  ['.bw-side', 430],
  ['.bw-foot', 620],
  ['.bw-rail', 780],
];

let arrivalTimers: number[] = [];

function runArrivalBeat(container: HTMLElement) {
  arrivalTimers.forEach(clearTimeout);
  arrivalTimers = [];

  const show = (sel: string) => container.querySelector(sel)?.classList.add('is-in');

  if (prefersReducedMotion()) {
    // Collapses to a single instant paint.
    ARRIVAL_BEAT.forEach(([sel]) => show(sel));
    revealFact(0);
    return;
  }

  ARRIVAL_BEAT.forEach(([sel, delay]) => {
    arrivalTimers.push(window.setTimeout(() => show(sel), delay));
  });
  arrivalTimers.push(window.setTimeout(() => revealFact(0), 300));
}

function revealFact(i: number) {
  if (revealed.has(i)) return;
  revealed.add(i);
  const section = pageEl?.querySelector<HTMLElement>(`.bw-fact[data-fact="${i}"]`);
  if (!section) return;
  section.classList.add('is-revealed');
  if (i > 0 && pageEl) {
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    pageEl.scrollTo({ top: section.offsetTop - 100, behavior });
  }
}

function renderCounter() {
  const el = document.getElementById('bw-counter-value');
  if (el) el.textContent = String(counterValue).padStart(6, '0');
}

/**
 * CSS cannot pause an animated GIF (Codex #8), so reduced-motion swaps each GIF's
 * src to its authored static first-frame PNG sibling. Swapping back restores motion.
 */
function applyReducedMotionAssets(root: HTMLElement) {
  const still = prefersReducedMotion();
  root.querySelectorAll<HTMLImageElement>('.bw-gif').forEach((img) => {
    const next = still ? img.dataset.static : img.dataset.anim;
    if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
  });
}

// Fact bodies contain literal HTML tag names (<blink>, <marquee>, <font ...>) as
// prose. Escape them so they render as text, then style them as inline code.
function escapeTags(body: string): string {
  return body.replace(/<([a-z][^>]*)>/g, '<code class="bw-tag">&lt;$1&gt;</code>');
}
