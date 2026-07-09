# Engineering Log

## 2026-07-09 (Phase 2 Slice 1 — Commit 2: Early Web chapter + glass-shatter)

The third chapter is live. Chronicle now runs a three-chapter chain:
**ARPANET → (CRT power-off) → Early Web → (glass-shatter) → Figma Era.** CRT moved to
its canonical `arpanet → early-web` slot; the direct `arpanet → figma-era` transition is
gone; glass-shatter debuts.

**Content (T4):** `docs/EARLY-WEB-CONTENT.md` — 6 facts mirroring ARPANET's
headline/year/body structure (CERN first page 1991, Mosaic inline images 1993, blue/
purple links 1993, tables-for-layout 1994, 216 web-safe palette 1994, GeoCities 1994).
Bodies written to stay historically honest where a single year oversimplifies (the year
is the era anchor; table-layout and web-safe both say "hardened over 1994–96").

**Chapter (T5):** `src/chapters/early-web/` renders a full NCSA Mosaic / Netscape 1.0
window inside the dark museum shell — navy→blue title bar, beveled toolbar, location bar
(`http://www.chronicle.net/early-web.html`), dithered navy→teal banner with a blinking
`NEW!`, facts as titled sections (navy headline + red Courier year + Times body + groove
`<hr>`) that reveal on scroll, an under-construction hazard bar + webring footer, and a
green odometer hit-counter that ticks `000000 → 000427` with scroll (Early Web's era-
styled progress indicator, per `era-artifact-as-progress-indicator`). The Mosaic
page-load assembly (banner → text → counter, <1.2s) is the arrival beat; reduced-motion
collapses it to an instant paint. All CSS, no sourced GIFs — web-safe palette only
(`EARLY-WEB-BRIEF.md`). Verified by eye in a headed screenshot: reads as a real 1993 page.
`index.html` gains the scene + spacer (spacer order matches manifest, drift-guarded);
`manifest.ts` flips early-web `live: true`; `chapters.ts` gets the content entry;
`main.ts` registers `initEarlyWeb` before `initRouter()`.

**Shader (T6):** `src/shaders/glass-shatter.frag` — a source-agnostic voronoi shatter.
`uFrom` cracks into ~11-across shards (bounded 3×3 = 9-tap voronoi, F1/F2 for edge
cracks) that break on a staggered delay, slide out under gravity, and fade to reveal
`uTo`; `uResolution` aspect-corrects the cells. Samples only uFrom/uTo/uResolution — no
chapter assumptions — so the later move to canonical `flat → figma-era` is a key change,
no shader edit. Registered in `main.ts` `precompileAll`. Cost is constant per fragment
(bounded loop) — 60fps rationale + the pending headed-GPU verify documented in
`SHADER-PROFILES.md`. **Shader-missing guard (fold #4):** `transition.ts` now checks
`webgl.getShader()` and skips straight to `fadeSwap` if a shader isn't compiled, instead
of holding the scroll lock for the full duration on a blank canvas.

**Transitions (T7):** `transitions.ts` now `arpanet→early-web: crt-power-off` +
`early-web→figma-era: glass-shatter`; `arpanet→figma-era` removed.

**UI (T8/T9):** code overlay gains an `early-web` REGISTRY entry (real `style.css` +
`index.ts` tabs — the `</>` button showed an empty panel without it). Share card gains a
period-correct Early Web branch: a framed Netscape mini-window in web-safe grays with the
green hit-counter, instead of falling through to the Figma glass card.

**Tests (T11 + T12):** rewrote the e2e for the new chain — `ARPANET → Early Web → Figma
Era` (R1: the old direct transition is gone). Added `#early-web` deep-link (R2: the
inserted middle chapter lands correctly) and an Early Web render test; updated the
nav-latch test (ARPANET's onward target is now Early Web). Unit test order updated to the
3-chapter live set. Added `maxDiffPixelRatio: 0.02` to `playwright.config.ts` (T12) to
absorb the known idle-snapshot AA drift; regenerated the lobby baseline (Early Web card
is now live: "Explore →" not "Coming Soon").

**Verification:** `tsc` clean · `vitest` 7/7 · `npm run build` clean (entry JS 59.97 →
**64.02 KB gzip**, +4 for the eager chapter + shader) · Playwright **14/14** (full chain,
both deep-links, nav-latch, Early Web render). Headed screenshot of `#early-web`
confirms the Mosaic frame renders period-accurately.

**Remaining in Slice 1:** T10 — extract `createChapter` from all three chapters (rule of
three, now satisfiable). glass-shatter's live 60fps profile is a headed-Chrome manual step.

**Commit:** _(logged in follow-up)_

## 2026-07-09 (Phase 2 Slice 1 — Commit 1: manifest + uResolution + Vitest)

First Phase 2 work. Behavior-preserving foundation for the Early Web chapter: collapse the duplicated chapter-order sources into one derived manifest, add the shader uniform every Phase 2 transition will want, and stand up a unit-test layer. No chapter, shader, or transition change yet — the external `arpanet → figma-era` flow is unchanged and verified.

**T1 — `src/data/manifest.ts` is now the single source of chapter identity + ordering (A1).**
- Promoted the lobby's inline 8-entry roadmap to `MANIFEST` (added an explicit `order` field so derivations never depend on array position). Identity/ordering only — content (facts, palette) stays in `chapters.ts`, keyed by the same id, for live chapters only.
- `router.ts` derives `VALID_CHAPTERS` from `validChapterIds()`; `scroll.ts` derives `CHAPTER_ORDER` from `chapterOrder()` (both = the live subset sorted by `order`). `lobby/index.ts` iterates `MANIFEST` directly and its local `CardDef`/`CARDS` are retired. This kills the silent router↔scroll drift: the two lists were hand-maintained and could disagree with no test noticing.

**T2 — `uResolution` uniform in `webgl.ts` (A2).** Added to compiled uniforms + set each `render()` to `canvas.width/height`. Null-safe: shaders that don't declare it (crt-power-off) get a null location and `uniform2f(null, …)` is a GL no-op — existing transition untouched. glass-shatter's voronoi cells will sample it next commit.

**T3 — Vitest unit layer (Codex T3).** Added `vitest` devDep + `test:unit` script + `vitest.config.ts` (node env, scoped to `tests/unit/**`). `tests/unit/manifest.test.ts` (7 tests): derivation correctness, live-subset isolation, order integrity (unique + contiguous 1..N), and the **drift guard** — parses `index.html` spacer order and asserts it equals `chapterOrder()`, closing the one silent failure mode the manifest exists to prevent. Also pinned Playwright's `testMatch` to `**/*.spec.ts` so it stops grabbing `*.test.ts` and trying to run the Vitest suite (which errored on Vitest internal state).

**Verification:** `tsc` clean · `vitest run` 7/7 · `npm run build` clean (entry JS still **59.97 KB gzip**, no bundle change) · Playwright **12/12** including the ARPANET→Figma e2e transition, deep-link `#figma-era`, and nav-latch guards — the behavior-preserving claim holds.

**Commit:** `e5fe1bc` feat: derive chapter order from a single manifest + add uResolution + Vitest

## 2026-07-08 (Phase 1 STRETCH: share nudge at the Figma closing beat)

Built the "press S to share" nudge pitched (not built) in the last session — connects the Figma Era emotional payoff to the share loop. When the closing beat lands, a one-time coach-mark offers the share affordance right when the visitor most wants to keep the moment.

**How it's wired (clean ownership via an event bridge):**
- `src/chapters/figma-era/index.ts` dispatches a `window` `chronicle:closing-beat` CustomEvent the first time `progress > 0.85` (the exact threshold that already reveals the end-state — proven in production). A module-level `closingBeatFired` latch, reset in `onChapterInit`, keeps it to one dispatch per entry. The chapter stays completely ignorant of sharing.
- `src/ui/controls.ts` (already owns the `s` key + `doShare`) listens for the event and shows the nudge. Guards: at most once per browser session (`sessionStorage` `chronicle:share-nudge-seen`), and never if the user already shared this session (`hasShared`, set in `doShare`). 1.2s delay lets the beat breathe before the hint lands. Acting on the nudge (or pressing `s`, or navigating to the lobby) dismisses it; otherwise it auto-dismisses after 6s.

**Design decisions:**
- **Coach-mark bottom-right, not bottom-center.** The Figma progress pips are `position: fixed; bottom: 24px` (bottom-center) — a bottom-center toast would collide. Anchoring above the share button also makes it stronger UX: the hint sits next to the control it teaches.
- **Share button pulses with the nudge** (`.ctrl-btn.is-pulsing`) so the eye connects "S" → the actual button. Uses a 2-iteration keyframe with **no** `animation-fill-mode` — deliberately, so it fully reverts and never pins `opacity` (respecting the cluster visibility invariant that bit us last session).
- **Touch-aware copy:** desktop shows a styled `S` keycap ("Press S to share this"); touch has no S key, so it reads "Tap to share this chapter" and the pill itself is the tap target. Reuses `isTouchDevice` from `scroll.ts`.
- **Reused, not duplicated:** the nudge lives in the eager `controls.ts` (it's tiny) rather than pulling in the lazy share-card chunk; it just calls the existing `doShare()`.

**Verification:**
- New behavior tests in `tests/ui-controls.spec.ts` (now 6): closing beat surfaces the nudge + pulses the share button + click starts the share flow; nudge shows at most once per session. All 6 pass. Full non-snapshot suite 9/9.
- Screenshotted the live nudge on `#figma-era` in a real headless browser — glass pill, cyan `S` keycap, share icon, `×`, and the share-button pulse ring all render correctly, clear of the bottom-center pips.
- `tsc` clean, `npm run build` clean. Entry JS 59.43 → **59.87 KB gzip** (+0.44 for the always-on nudge; overlay/share stay lazy).

**Closes** the "stretch follow-up idea" from the 2026-07-08 checkpoint (share nudge at the Figma closing beat).

**Commit:** `640acfc` feat: one-time share nudge at the Figma closing beat

## 2026-07-08 (Phase 1 STRETCH: code overlay + share card)

Shipped both Phase 1 stretch goals (E4, E5). New `src/ui/` module holds all global chrome. Design decisions confirmed with Kenny up front: real curated source, purpose-built share card, floating cluster + shortcuts.

**New files:**
- `src/ui/controls.ts` — bottom-right control cluster (`</>` + share) and keyboard shortcuts (`?` source, `s` share, `Esc` close). Eager (tiny); lazy-imports the two heavy modules on first use. Hidden on the lobby via `hashchange` → `.is-hidden`.
- `src/ui/code-overlay.ts` — the "view source" slide-in panel. Imports the REAL chapter source via Vite `?raw` (`arpanet/index.ts`, `terminal.ts`, `figma-era/style.css`, `figma-era/index.ts`) so it can never drift from what ships. Per-chapter curated file tabs + a one-line caption on the technique. Lazy chunk: 8.26 KB gzip.
- `src/ui/share-card.ts` — builds an off-screen 1200×630 branded card (CHRONICLE wordmark + era/year + chapter content + URL back-link), rasterizes with html2canvas, then Web Share API → clipboard image → file download. Lazy chunk: 2.14 KB gzip.
- `src/ui/highlight.ts` — minimal single-pass tokenizer (comments/strings/numbers/hex-colors/keywords) for TS + CSS. No external lib (CSP + bundle safe).
- `src/ui/ui.css` — cluster, overlay, toast styling. Neutral dark-glass so it reads over both ARPANET (#000) and Figma (#0A0A0A).

**Why a purpose-built share card, not a live screenshot:** html2canvas can't render the ARPANET phosphor SVG filter or any WebGL, and Figma's glass uses backdrop-filter (also uncapturable). A hand-built card sidesteps all three, always looks right, and bakes the URL into every share. ARPANET's amber glow uses `text-shadow` (which DOES capture) instead of the SVG filter.

**Reused, not duplicated:** exported `loadHtml2canvas()` from `transition.ts` so the share card shares the transition engine's single cached html2canvas chunk instead of pulling a second copy.

**Bug caught during verification (would have shipped):** the cluster's entrance used a `@keyframes` with `animation-fill-mode: both`. A CSS animation's fill pins `opacity` at higher priority than a normal declaration, so `.is-hidden { opacity: 0 }` was defeated once the entrance completed — the controls would have stayed visible on the lobby. The lobby visual snapshot flagged it (the two buttons showed bottom-right in the diff). Fix: drive entrance via an `.is-ready` class-toggled transition instead, with `.is-hidden` defined after `.is-ready` so it wins at equal specificity. Lobby snapshot passes again.

**Verification:**
- New `tests/ui-controls.spec.ts` (4 behavior tests): cluster hide/show, `?` opens overlay with real highlighted source + 2 tabs + `Esc` closes, tab switching swaps file path, `s` surfaces a toast and resolves without crashing. All pass.
- Eyeballed both share cards + the code overlay in a real headless browser (screenshots) — highlighting, layout, glow, and URL back-link all correct.
- `tsc` clean, `npm run build` clean. Entry JS 58.71 → **59.43 KB gzip** (+0.72 for the always-on cluster; overlay/share stay lazy). CSS +1.2 KB gzip. Nowhere near the 167 KB no-code-split regression.
- Regenerated ARPANET-idle + Figma-idle visual baselines (they now legitimately include the cluster). Full suite: **10/10 pass**.

**Commit:** `57fd8e5` feat: Phase 1 stretch — code overlay + share card

## 2026-07-08 (ARPANET content accuracy pass — TODO-004)

Reviewed the shipped ARPANET `facts[]` (`src/data/chapters.ts`) against `docs/ARPANET-CONTENT.md` **and** the actual history. Chronicle's whole pitch is authentic design history, so a knowledgeable reader spotting a factual error is the failure mode that matters. Fixed four issues; source doc aligned to match so the two don't drift.

- **Fact 8 "The Baud Rate Was a Sound" — objective error.** Body said "300 baud (10 characters per second)." 300 baud ≈ **30** cps; 10 cps is **110** baud (the Teletype Model 33 in Fact 1), so the deck contradicted itself. Changed to "(about 30 characters per second)." (The research doc was already correct — "300 bits per second" — the bad parenthetical was code-only.)
- **Fact 4 "Green Phosphor Was Upgraded to Amber" — phosphor types wrong (stings; amber is this chapter's own aesthetic).** "P4 phosphor: a green-white glow" → P4 is *white*; green terminals used **P1**. "amber phosphor (P12)" → P12 is a long-persistence *orange radar* phosphor; amber terminals used **P3**. Dropped "Wyse-50 became the professional standard by 1980" (the WY-50 shipped **1983**, contradicting the fact's own `year: 1979`) in favor of "by the early 1980s amber terminals had become the professional standard." Softened the "IBM and DEC studies showed measurably less eye strain" claim (largely period marketing lore, not measured science) to "marketed as easier on the eyes." Fixed the `visualArtifact` phosphor codes P4→P1, P12→P3.
- **Fact 7 "The Character Cell" — wrong precise figure.** "each character occupied exactly 10×12 pixels" → "drawn as a 7×9 dot matrix inside a fixed cell" (VT100 technical manual). Fixed `visualArtifact` to match.
- **Fact 6 "Xerox PARC" — loose geography.** "40 miles away" → "a few miles away." PARC (Palo Alto) is ~5 miles from SRI (Menlo Park), an actual ARPANET node — the accurate version sharpens the "so close, unknown to each other" point.

**Verified:** `tsc --noEmit` clean, `npm run build` clean (entry still 58.71 KB gzip — code-split intact). Playwright: 5/6 pass. The 1 failure ("ARPANET idle" visual snapshot) is **pre-existing environmental drift, not this change** — proven by `git stash` + re-run: the clean tree fails identically. That snapshot only renders the boot sequence + Fact 1 (which this pass did not touch); the diff is a uniform anti-aliasing shimmer across all glyphs, the exact flakiness the 2026-07-07 checkpoint flagged as untrustworthy. Baseline left untouched (regenerating a drifted flaky baseline in this env would mask real future regressions). **Open:** the ARPANET-idle baseline needs regenerating in a stable CI env, or the test needs a threshold — tracked separately, not part of the content pass.

**Closes TODO-004** (ARPANET content quality pass).

**Commit:** `af484ec` content: fix 4 ARPANET factual errors (phosphor, baud, VT100, PARC)

## 2026-07-07 (authenticity polish)

### Fix ARPANET phosphor-glow: text was all-over blurry, not glowing (`src/chapters/arpanet/index.ts`)

**Symptom (found live on dev server):** the ARPANET terminal read as a soft, hard-to-read blur — the amber text, cursor, and characters all looked out of focus, rather than sharp text with a CRT bloom.

**Root cause:** the `#phosphor-glow` SVG filter's `feMerge` stacked the nodes in the wrong order. `feMerge` paints its first `feMergeNode` at the bottom and each later one on top. The filter had `SourceGraphic` (sharp) first and the blurred `glow` second — so the **blurred copy was composited on top of the sharp text**, blurring the whole surface instead of haloing it.

**Fix:** swapped the order — blurred `glow` on the bottom, `SourceGraphic` on top. Now it's a soft phosphor halo *underneath* crisp, readable text (an amber CRT you can actually read). Also dropped `feGaussianBlur stdDeviation` `3 → 2` for a tighter halo. Verified live: text is sharp with a glow, exactly the P12-amber look the content docs describe.

**Closes TODO-005** (phosphor sigma spike). The real problem wasn't the sigma value, it was the merge order; σ=2 with correct compositing hits the target. No further spike needed.

**Commit:** `b1c4d6e` polish: fix ARPANET phosphor blur + warm terminal audio

### Sound design pass: warmer keystroke click + deeper ARPANET hum (`src/engine/audio.ts`)

**Motivation:** the synthesized ambience read as too digital/harsh on a first listen. Two taste-driven adjustments, no structural change to the audio graph or the lazy-load path.

- **ARPANET machine-room hum (`buildArpanetLayer`):** lowpass `280 → 180 Hz`, level `-24 → -30 dB`. Pulls the brown-noise rumble down under the experience so it's felt, not heard. The `rampTo` target and `fullDb` were moved together so the crossfade fade-in (which reads `fullDb`) lands at the same new level.
- **Teletype keystroke click (`onUnlock` synth):** `white → pink` noise (warmer, -3 dB/oct rolloff) + a new `1800 Hz` lowpass (`Q 1.2`) inserted before the volume node to strip the digital hiss, leaving a dull woody clack instead of a static burst. Level `-30 → -26 dB` to compensate for the energy the lowpass removes. Decay nudged `0.025 → 0.022 s`. New signal chain: `synth → clickFilter → clickVol → destination`.
- Updated the stale file-header comment (was `280Hz LPF at -24dB`).

**Verified:** manual listen on dev server (Kenny confirmed) — hum reads as felt-not-heard, keystroke is a woody clack not digital static. `tsc --noEmit` clean, `npm run build` clean (entry still 58.6 KB gzip — code-split intact), 6/6 Playwright pass.

**Commit:** `b1c4d6e` polish: fix ARPANET phosphor blur + warm terminal audio

## 2026-07-07 (later)

### Bundle-size code-split: lazy-load Tone + html2canvas (initial JS 166→59 KB gzip)

**Problem:** single JS bundle was 585 KB / 166.8 KB gzip — GSAP + Tone + html2canvas all eager, so cold paint downloaded/parsed all of it before the lobby appeared.

**Fix:** converted the two heaviest non-critical libs to dynamic `import()` (Vite auto-splits each into its own async chunk). GSAP stays in the entry chunk (the scroll engine needs it at first paint).

- **Tone.js (`src/engine/audio.ts`):** now `import type * as Tone` (types only, erased) + a runtime `import('tone')` inside the unlock handler. All node construction (layers, clickSynth) moved from `initAudioEngine()` into `onUnlock`, so both the import and the audio graph are built on the first user gesture — which is the only moment audio can start anyway (Web Audio policy). Added an `unlocking` flag to guard against a rapid click+touchstart double-importing.
- **html2canvas (`src/engine/transition.ts`):** `import type` + a cached `loadHtml2canvas()` promise; `captureChapter` awaits it. `initTransitionEngine()` warms the chunk via `requestIdleCallback` (setTimeout fallback) so it's ready well before any capture — no first-transition stutter — without blocking paint.

**Design note (why they differ):** html2canvas feeds a *visual* transition, so a load-on-demand stutter would be visible jank → idle-preload it. Tone feeds *ambient audio*, where a ~300ms late start is imperceptible (it ramps over 1.5-2s) → load strictly on-gesture, saving the bytes for anyone who bounces from the lobby.

**Result (measured via `npm run build` + preview network):**
- Entry chunk (GSAP + app): 149.8 KB / **58.6 KB gzip** — the only JS at first paint.
- Tone chunk: 340.5 KB / 81.3 KB gzip — loads on first gesture.
- html2canvas chunk: 201.4 KB / 48.0 KB gzip — loads on idle after paint.
- **Initial gzipped JS: 166.8 → 58.6 KB (~65% smaller).** >500 KB chunk-size warning gone.

**Verified:** 6/6 Playwright pass (transition test exercises lazy html2canvas). Browse on the production preview: initial paint loads only the entry chunk; Tone chunk appears after the first card click; full ARPANET→Figma transition fires with both captureChapter logs. No console errors.

**Commit:** `73c741d` perf: code-split Tone + html2canvas out of initial bundle

## 2026-07-07

### Phase 1 shipped to Vercel + fixed intermittent deep-link bug (#figma-era showed ARPANET)

**Ship:** Phase 1 deployed to Vercel (https://chronicle-topaz-ten.vercel.app/). Production build clean (`tsc && vite build`), `base: './'` serves relative assets. Local smoke (Playwright 4/4) + production-build preview both green.

**Bug found in live QA (`/browse`):** Clicking "Explore" on the Figma Era lobby card, or a cold deep-link to `#figma-era`, intermittently displayed the **ARPANET** chapter instead of Figma Era. Measured broken state: `chapter-arpanet` at `translateX(0)`, `chapter-figma-era` at `translateX(-100vw)`.

**Root cause (race condition):** `suppressTransitionRequests(200)` was a fixed 200ms time window meant to stop GSAP's reconciliation callbacks (fired by the router's programmatic `scrollTo` + the `display:none→block` layout change) from overriding the router's chosen chapter. GSAP's settle time depends on layout/asset load, which on a networked host (Vercel CDN latency, cold cache) routinely exceeds 200ms. When callbacks fired late, `scroll.ts` `onEnter` — which had **no suppression guard**, only `progress > 0.5` — called `activate('arpanet')`, flipping the active chapter away from the router's target and defeating the `transition.ts:51` `getActiveId() !== fromId` guard. Localhost (0ms asset load) always won the race; Vercel intermittently lost it. Confirmed via DBGX instrumentation: local trace showed callbacks firing at ~115-128ms into the window (won); the deployed byte-identical bundle (`index-BrOkNc1L.js`) broke twice then worked once — the intermittency signature of a timing race.

**Fix (`src/engine/scroll.ts`):** Replaced the time-based window with a **state latch released by the first genuine user gesture** (`wheel`/`touchstart`/`keydown`), not a timer. The router owns the active chapter until the user actually interacts, so no network delay can let a stale GSAP callback override it. Added the latch guard to `onEnter` (the unguarded hole); `onUpdate` transition-fire and `onLeaveBack` now check `isNavSuppressed()` too. `suppressTransitionRequests()` kept as a thin compat wrapper that arms the latch. The existing `transition.ts:51` guard now reliably backstops late transition requests because `activeId` is never flipped.

**Semantic change:** a programmatic `scrollTo` no longer fires the CRT transition on its own — only real user scrolling does. Correct behavior (router nav jumps should not auto-transition), but it required updating the E2E test to simulate a user gesture (`page.mouse.wheel`) before scrolling to the dwell zone.

**Tests (`tests/visual.spec.ts`, 4→6):** Updated `ARPANET → Figma Era transition` to release the latch with a wheel gesture. Added `deep-link to #figma-era lands on Figma Era, not ARPANET` (invariant) and `nav latch: programmatic scroll does not fire transition until user gesture` (deterministic — fails against the old time-based behavior). 6/6 pass.

**Commit:** `b5fc3c1` fix: nav latch stops #figma-era deep-link showing ARPANET

## 2026-06-28

### Week 1 scaffold — full engine + chapter stubs written

**Files written this session:**

Engine layer:
- `src/styles/global.css` — chapter DOM swap model (fixed position, translateX off-screen)
- `src/data/chapters.ts` — typed Chapter interface + ARPANET (8 facts) + Figma Era (4 facts) + `getChapter()` helper
- `src/data/transitions.ts` — transition registry mapping chapter pairs → shader name + duration
- `src/engine/webgl.ts` — WebGLEngine: persistent 1×1px canvas, full-screen triangle, shader precompilation via requestIdleCallback + KHR_parallel_shader_compile, texture upload, rAF render loop
- `src/engine/chapter.ts` — ChapterManager: register/activate/deactivate, IntersectionObserver lazy-init (1vh rootMargin)
- `src/engine/scroll.ts` — GSAP ScrollTrigger engine: 200.4vh spacers, DWELL_THRESHOLD = 200/200.4, isTouchDevice detection, event emitter (onChapterProgress, onDwellEnter, onTransitionRequest), backwards nav (0.15s fade), scroll locking
- `src/engine/router.ts` — hash router: showLobby / showChapter (0.5s fade-from-black), navigateTo
- `src/engine/transition.ts` — full transition orchestration: dwell-enter → html2canvas capture → Promise.race([Promise.all([from, to]), 500ms timeout]) → WebGL resize → uploadTexture × 2 → runShader rAF loop → chapter swap → reset; fadeSwap for touch/reduced-motion; GSAP audio crossfade hook

Chapter stubs:
- `src/chapters/lobby/style.css` — lobby CSS: #0D0D0D + noise grain, 4/2/1 col grid, all 8 era card styles, entry stagger keyframes, ARPANET typing animation, Figma Era pill ripple
- `src/chapters/lobby/index.ts` — 8-card grid, buildArpanetPreview + buildFigmaPreview helpers, click → navigateTo
- `src/chapters/arpanet/style.css` — #000 bg, #FF9500 amber, scanlines (::after), vignette (::before), SVG phosphor filter (feColorMatrix + feGaussianBlur σ=3), progress indicator pulse
- `src/chapters/arpanet/index.ts` — mounts phosphor SVG filter, stub terminal output, progress bar (▓▒░ chars), dwell-enter pulse, network map SVG placeholder
- `src/chapters/figma-era/style.css` — #0A0A0A bg, glassmorphism cards (blur 20px), boot pixel animation (cubic-bezier(0.16,1,0.3,1)), 7 pip progress indicator (glass pill), end state + back pill
- `src/chapters/figma-era/index.ts` — 3-card stack, boot animation, pip progress, closing beat reveal at 85%, back-to-lobby pill

Shaders:
- `src/shaders/crt-power-off.frag` — GLSL ES 3.0: 3-phase CRT power-off (compress 0–0.4, hold 0.4–0.6, expand 0.6–1.0), smoothstep easing on each phase

Entry point:
- `src/main.ts` — DOMContentLoaded → init all chapters → precompileAll → initScrollEngine → initTransitionEngine → initRouter

Config:
- `package.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore`
- `index.html` — chapter-lobby, chapter-arpanet, chapter-figma-era scenes; scroll-container + spacers; #gl-canvas

**Bugs found during browser verification:**
- `IntersectionObserver({ rootMargin: '1vh 0px' })` — `vh` is invalid, only `px`/`%` allowed. Silently blocked module loading. Fixed to `'0px'`. Lazy-init works via `activate()` fallback anyway.
- Vite stale module cache in WSL2: file edits not picked up until server restart. Workaround: `kill $(lsof -ti:3000)` before `npm run dev`.

**Commit:** f7a0c4a

**Next:** Week 2: network-map.ts SVG diagram, Figma Era card restack (A/B/C swap at 1/3 and 2/3 progress).

**Key decisions logged:**
- D16: Promise.race([Promise.all, 500ms]) prevents black screen on slow html2canvas
- Touch detection at engine level (isTouchDevice) → fadeSwap path, no GLSL
- Phosphor glow SVG filter sigma=3 starting value — spike in TODO-005 to find exact value
- CRT shader uses `#version 300 es` + full-screen triangle (no VBO) — matches webgl.ts engine

---

## 2026-06-29

### Week 2: ARPANET terminal typing scheduler

**Files written this session:**

- `src/chapters/arpanet/terminal.ts` — new file: `ArpanetTerminal` class
  - `start(facts)`: enqueues 4-line boot sequence + "HISTORICAL ARCHIVE: N RECORDS LOADED" + divider, then pumps
  - `revealFact(fact, index)`: guards with `revealedFacts` Set (idempotent), enqueues headline + word-wrapped body (72 chars, VT100 width) + divider
  - `fastForward()`: cancels all pending `setTimeout` IDs, flushes partially-typed current line, dumps entire queue to DOM instantly; called on any forward scroll movement
  - `typeNextLine()` / `typeChar()`: per-character `setTimeout` at 60ms (headlines), 20ms (body), 80ms (boot); inter-line pause 400ms; auto-scrolls `.arpanet-terminal` container on each char
  - Scroll auto-follow: `this.container.scrollTop = this.container.scrollHeight` on the parent overflow container (NOT `this.output.scrollTop` — output div has no overflow)
  - Char delay design: 80ms boot (authentic Teletype feel), 60ms headlines (punchy), 20ms body (not boring for ~400-char paragraphs)
  - Audio (keystroke sounds, Tone.js): deferred to Week 4 with rest of audio crossfade work

- `src/chapters/arpanet/index.ts` — updated to use `ArpanetTerminal`:
  - Creates terminal instance in `onChapterInit`, calls `terminal.start(facts)` + immediately `revealFact(facts[0], 0)`
  - `FACT_THRESHOLDS = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84]` — 8 facts evenly spaced across chapter progress
  - `onChapterProgress` callback: calls `terminal.fastForward()` on any positive delta in progress, then checks all thresholds and calls `revealFact()` for newly-crossed ones
  - Progress bar and network map fade-in behavior unchanged

- `src/chapters/arpanet/style.css` — updated:
  - `.arpanet-terminal`: `max-height: calc(100vh - 420px)`, `overflow-y: scroll`, `scrollbar-width: none` — terminal scrolls internally as content grows; 420px accounts for 48px top + ~372px for network map + progress bar
  - `.arpanet-line--boot`: `color: #FF9500` (full amber)
  - `.arpanet-line--meta`: `color: rgba(255, 149, 0, 0.5)` (dim amber — dividers, RECORDS LOADED)
  - `.arpanet-line--headline`: `color: #FFB340`, `font-weight: bold`, `letter-spacing: 0.04em` (brighter gold)
  - `.arpanet-line--body`: `color: rgba(255, 149, 0, 0.85)` (slightly dimmer)

**Bugs caught in browser testing:**
- `this.output.scrollTop` (the inner `#arpanet-output` div) had no effect because the div has no `overflow` set. The PARENT `.arpanet-terminal` has `overflow-y: scroll`. Fixed: store `outputEl.parentElement` as `this.container`, scroll that instead. Verified: `containerScrollTop: 184` on next check.

**Browser verification result:**
- Boot sequence types at 80ms/char: "ARPANET NETWORK CONTROL PROGRAM v2.4" → "CONNECTED TO IMP NODE 1 — UCLA" → "LINK ESTABLISHED: 50 KBPS" — correct amber phosphor glow on black
- Fact 0 ([1969] THE TELETYPE MODEL 33 HAD NO LOWERCASE) types immediately after boot: headline in bright gold, body at ~85% amber
- On scroll to 40% (580px / 1443px spacer): progress bar shows "▓▓▓▓░░░░░░ 40%", 89 lines in DOM (facts 0-3 revealed + flushed), terminal scrolled to show facts 2-3
- No console errors

**Commit:** b16b65a

---

### Week 2: ARPANET network map SVG

**Files written this session:**

- `src/chapters/arpanet/network-map.ts` — new file: `initNetworkMap(svgEl, visibleAt)`
  - Injects 4 nodes (SRI, UTAH, UCLA, UCSB) + 4 IMP link lines into the existing SVG placeholder
  - Historical topology (December 1969 BBN map): SRI→UTAH horizontal, SRI→UCLA vertical, UCLA→UCSB horizontal, UCSB→UTAH diagonal
  - Line draw-in: `stroke-dashoffset` trick — `getTotalLength()` in rAF, CSS transition from `length` → 0 with per-link stagger (0, 0.7, 1.4, 2.1s delays + `visibleAt` offset)
  - Node appearance: circles + labels at opacity 0, fade in at `NODE_DELAY + visibleAt` seconds after trigger
  - `visibleAt` param: offsets all delays so animation starts as the SVG parent becomes visible (not before), preventing pre-drawn lines appearing when the map fades in
  - "ARPANET — DEC 1969" title label above the diagram (dim amber)
  - Node sublabels: MENLO PARK, SALT LAKE CITY, LOS ANGELES, SANTA BARBARA (7px, 50% opacity amber)

- `src/chapters/arpanet/index.ts` — updated:
  - Imports `initNetworkMap` from `./network-map`
  - Calls `initNetworkMap(mapEl, 1.0)` immediately after chapter activate
  - `setTimeout(() => mapEl.classList.add('visible'), 1000)` — fades parent in after 1s; `visibleAt=1.0` matches this delay

**Browser verification result:**
- Network map visible bottom-right at ~t=1s after chapter activate
- All 4 link lines draw in sequentially (SRI→UTAH first, UCSB→UTAH diagonal last) — correct historical topology
- Node circles + labels appear at ~t=3.8s after activate
- Amber phosphor glow from chapter SVG filter applies to the map — looks like CRT terminal output
- No console errors

**Commit:** a2cf72e

---

### Week 2: Figma Era card restack + scroll height fix

**Files changed this session:**

- `src/chapters/figma-era/index.ts` — fully rewritten:
  - 4 cards created upfront (`c0`=fact0, `c1`=fact1, `c2`=fact2, `c3`=fact3); `c3` starts at `POS_OFF` (off-screen right, `x:280`, `opacity:0`)
  - GSAP `set()` places all 4 at init; `to()` drives all transitions — nth-child CSS selectors removed entirely
  - `POS_A = {x:-120, y:20, rotation:-1.5, zIndex:2, opacity:1}` (back-left)
  - `POS_B = {x:60, y:-10, rotation:0, zIndex:3, opacity:1}` (front)
  - `POS_C = {x:-80, y:60, rotation:1, zIndex:1, opacity:1}` (back-right)
  - `POS_OFF = {x:280, y:-20, rotation:2, zIndex:0, opacity:0}` (off-screen)
  - `RESTACK_THRESHOLD = 0.33`: fires once at 33% scroll progress
  - `restackCards()`: c0 exits left with `scale:0.85 opacity:0` (0.5s power2.in, then `c0.remove()`); c1→A, c2→B (delay 0.1s), c3→C (delay 0.2s), `power2.inOut` 0.6s
  - `.figma-card--accent` border migrates from c1 to c2 on restack
  - End state fires at 85% progress via `progress > 0.85` gate

- `src/chapters/figma-era/style.css` — updated:
  - Removed `.figma-card:nth-child(1/2/3)` position rules
  - Added `.figma-card--accent { border-color: rgba(0, 212, 255, 0.15) }` for front-card electric blue
  - Added `height: 280px`, `box-sizing: border-box`, `overflow: hidden` to `.figma-card`
  - Added `transition: border-color 0.4s ease` to `.figma-card`

- `src/styles/global.css` — scroll height fix:
  - Added `padding-bottom: 100vh` to `#scroll-container`
  - Without this: last chapter spacer ends at `scrollY = 2886px` but `maxScroll = 2166px`, so final chapter can only reach ~50% progress
  - With fix: `maxScroll` extends to cover the full spacer, last chapter reaches 100%
  - Verified: `endStateVisible: true` at `scrollY: 2696`

**Browser verification result:**
- Restack fires at 33%: c1 moves back-left, c2 rises to center-front (gains accent border), c3 slides in from off-screen right to back-right; c0 exits with scale-down and fades out
- End state fires at 87% (after scroll height fix): "END OF KNOWN HISTORY. MORE CHAPTERS LOADING." + "Explore more →" pill appear at bottom
- Screenshot captured at `/tmp/figma-endstate.png` — 2 cards visible, pill visible, pip indicator on last dot
- No console errors

**Commit:** 270337f

---

### Week 3: CRT transition wiring + html2canvas spike (TODO-001)

**Files changed this session:**

- `src/engine/transition.ts` — two fixes + timing instrumentation:
  - Fix: `transitionInFlight = true` moved to BEFORE touch/reduced-motion check — prevents double-firing fadeSwap on touch devices during the 300ms transition window
  - Fix: `lockScroll()` moved to before the touch check — both paths now lock scroll
  - New: `captureChapter()` strips `el.style.filter = 'none'` before html2canvas capture and restores after — html2canvas cannot resolve SVG filter URL references (`filter: url(#phosphor-glow)`); without this, result is undefined behavior per browser
  - New: `performance.now()` timing around `html2canvas()` call; logs `[transition] captureChapter(#id) Xms` at debug, warns at > 16ms

- `docs/SHADER-PROFILES.md` — new file: html2canvas spike results + crt-power-off timing table + full transition timeline

**Browser verification (headless Playwright):**

Transition flow end-to-end:
1. Navigate to `http://localhost:3000/#arpanet`, ARPANET loads (terminal + network map)
2. Scroll to progress = 0.998 (dwell entry at scrollY = 1441): ARPANET html2canvas fires
3. Console: `captureChapter(#chapter-arpanet) 364.6ms` — 364ms main-thread block
4. Scroll to progress = 1.0 (transition fire at scrollY = 1500): Figma Era html2canvas fires
5. Console: `captureChapter(#chapter-figma-era) 167.7ms` — 167ms block
6. GL ReadPixels messages confirm WebGL texture upload + shader execution
7. After 2500ms shader: `arpanetTransform: "translateX(-100vw)"`, `figmaTransform: "translateX(0px)"`, `glCanvasActive: false` (1x1 reset), `scrollLocked: false`, `figmaCardsCount: 4` (chapter initialized)
8. No JS errors in console

Note: WebGL canvas content not captured in headless Playwright screenshots (known headless compositing limitation — GPU path differs). Transition IS running (confirmed by GL messages + chapter state). Production browsers (headed Chrome) render the full CRT effect.

**html2canvas spike results (TODO-001):**
- SVG filter: SOLVED via `el.style.filter = 'none'` strip-and-restore
- ARPANET capture: 364ms (complex DOM — ~90 terminal lines + SVG map + CSS pseudo-elements)
- Figma Era capture: 167ms (minimal DOM — no cards yet)
- Gate time at transition: 167ms (ARPANET already resolved from dwell entry)
- Total main-thread block: 364ms at dwell entry. Exceeds 16ms target but accepted per PHASES.md reasoning.
- Results documented in `docs/SHADER-PROFILES.md`

**Commit:** 9a21b87

---

## 2026-06-29

### Week 4: Backwards navigation — scroll.ts refactor

**Files changed this session:**

- `src/engine/scroll.ts` — three bug fixes to `fireBackwardsNav`:
  1. **Scroll target**: was `prevSpacer.offsetTop` (top of chapter, 0%). Now `prevSpacer.offsetTop + prevSpacer.offsetHeight * 0.85` — lands user at 85% through the chapter, clear of the dwell zone (~99.8%), giving room to re-explore before re-triggering the forward transition.
  2. **Double-fire guard**: added `backwardsNavInFlight` flag. The instant `scrollTo` inside `fireBackwardsNav` causes ScrollTrigger to re-fire `onLeaveBack` for the chapter being left, which would recurse into a second `fireBackwardsNav` call. The flag blocks that second call. Flag resets after the full 300ms animation cycle (150ms fade-in + 150ms fade-out).
  3. **Dwell state reset**: refactored `let dwellFired = false` closure variable to a module-level `Map<string, boolean>` + exported `resetDwellState()`. After backwards nav, `resetDwellState(toId)` is called so the next forward pass re-triggers dwell capture at dwell entry. Without this, `dwellFiredMap` stays `true` from the previous pass (since `onEnter` only fires at the top spacer boundary, which we never cross when jumping to 85% via `scrollTo`), and the capture would be skipped — falling back to `captureChapter()` at transition time with no 500ms head start.

**Commit:** 6f715db

---

### Week 4: Tone.js ambient audio + CRT crossfade

**Files changed this session:**

- `src/engine/audio.ts` — new file: audio engine
  - **ARPANET ambient**: `Tone.Noise('brown')` → `Tone.Filter(280Hz, lowpass)` → `Tone.Volume`. Brown noise through a low-pass filter at 280Hz recreates machine room hum / fan noise at −24dB (barely perceptible background texture).
  - **Figma Era ambient**: two `Tone.Oscillator` (C3=130.81Hz, G3=196Hz, both sine) → `Tone.Volume`. A perfect-fifth drone at −32dB — near-silent, clean, implies intentional designed space.
  - Both layers start with `volume = -Infinity` (silent) and ramp to target dB on `start()`, back to `-Infinity` on `stop()`. Oscillators run continuously once started (just muted) — avoids restart latency.
  - **Web Audio unlock**: `AudioContext` must be resumed via a user gesture. `Tone.start()` is called on first `click` or `touchstart` on document. The lobby card tap (required to navigate to any chapter) provides this gesture naturally. iOS: `touchstart` with `passive: true` catches mobile taps without blocking scroll. `pendingChapterId` queues whichever chapter was activated before unlock and starts it immediately after.
  - **`crossfadeForTransition(fromId, toId, durationMs)`**: schedules all audio changes via `Tone.now()` at transition start — no per-frame callbacks. ARPANET: `rampTo(-Infinity, 1, now)`. Figma Era: `start()` oscillators, then `setValueAtTime(-Infinity, now)` + `setValueAtTime(-Infinity, fadeInStart)` + `rampTo(fullDb, fadeInDuration, fadeInStart)` where `fadeInStart = now + durationSec × 0.6`.
  - **`startChapterAmbient(id)`** / **`stopChapterAmbient(id)`**: public API for chapter modules and backwards nav.

- `src/engine/transition.ts` — replaced `scheduleAudioCrossfade` stub with `crossfadeForTransition` call before `runShader`. Removed unused `gsap` import (was only used by the stub). The call site: immediately after textures uploaded, before shader rAF loop starts.

- `src/engine/scroll.ts` — `fireBackwardsNav` now calls `stopChapterAmbient(fromId)` at fade-to-black start and `startChapterAmbient(toId)` when chapter swaps. Audio crossfade matches the visual overlay timing.

- `src/chapters/arpanet/index.ts` — `onChapterInit` calls `startChapterAmbient('arpanet')` after terminal start. Ambient starts as the chapter initializes.

- `src/chapters/figma-era/index.ts` — `onChapterInit` calls `startChapterAmbient('figma-era')` before boot animation. Covers both CRT-transition arrival (crossfade already scheduled from transition.ts) and direct hash-link entry.

- `src/main.ts` — `initAudioEngine()` called first (before scroll/router) to register document event listeners before any interaction events fire.

**Build verification:** `npm run build` → 989 modules, no errors. Chunk size warning (584KB bundle) is expected for Phase 1 with GSAP + Tone.js + html2canvas in one bundle — code splitting deferred to Phase 3.

**Commit:** 6555a19

---

### Week 4: ARPANET keystroke sounds

**Files changed this session:**

- `src/engine/audio.ts` — added `clickSynth: Tone.NoiseSynth` (created at `initAudioEngine()`) and exported `triggerKeystroke()`:
  - Synth: white noise, `{ attack: 0.001, decay: 0.025, sustain: 0, release: 0.005 }`. Total audible duration ~26ms — approximates the mechanical thwack of a Teletype Model 33 type bar hitting the platen.
  - Volume: `Tone.Volume(-30)` → destination.
  - Velocity: `0.5 + Math.random() × 0.5` per call. 50–100% variation prevents the machine-gun uniformity of identical rapid-fire clicks.
  - Guard: `if (!audioUnlocked || !clickSynth) return` — no sound before Web Audio context is resumed.

- `src/chapters/arpanet/terminal.ts` — `triggerKeystroke()` called in `typeChar` immediately after updating `lineEl.textContent`. Fast-forward bypasses `typeChar` entirely so no clicks fire during flush.

**Commit:** a5d9262

---

## 2026-06-30

### Week 4: Playwright visual regression setup + GSAP init-order bug fix

**Problem:** Adding Playwright visual regression tests exposed a subtle initialization bug. When navigating to `/#figma-era` via direct link, the baseline screenshot captured the ARPANET chapter instead. Root cause: GSAP ScrollTrigger initialized while `#scroll-container` was `display:none` — spacers had zero dimensions, so all trigger positions computed as (0,0). When the router called `showScrollContainer()` (making them `display:block`), GSAP recalculated real positions and fired spurious callbacks:
- `onEnter` for ARPANET with `self.progress ≈ 1` (initial state reconciliation) → re-activated ARPANET chapter
- `onLeaveBack` for Figma Era (was "entered" at 0,0; now outside at its real position) → fired `fireBackwardsNav` activating ARPANET
- `onUpdate(progress ≥ 1)` for ARPANET → started a 2500ms CRT transition keeping Figma Era at `translateX(-100vw)`

**Files changed:**

- `src/main.ts` — swapped initialization order: `initRouter()` now runs BEFORE `initScrollEngine()`. Router calls `showScrollContainer()` + `scrollToChapter()` + `chapterManager.activate()` first; GSAP then creates triggers against already-visible, correctly-positioned spacers. No more spurious callbacks on first layout.

- `src/engine/scroll.ts` — three defense-in-depth guards:
  1. `suppressTransitionRequests(durationMs)` export: sets a `_suppressUntil` timestamp. Router calls this with 200ms during `showChapter()` to block GSAP `onUpdate(progress≥1)` from firing a spurious transition during programmatic `scrollTo`.
  2. `onEnter`: added `self.progress > 0.5` guard. GSAP fires `onEnter` during initial state reconciliation with `progress≈1` for triggers whose scroll position is already past their end. Real user entry always arrives at `progress≈0`. Guard blocks the spurious ARPANET re-activation.
  3. `onLeaveBack`: added `performance.now() > _suppressUntil` check so backwards-nav fires are also blocked during the suppress window.

- `src/engine/router.ts` — added `suppressTransitionRequests(200)` call inside `showChapter()`, before `scrollToChapter()`. Also imports `suppressTransitionRequests` from scroll engine. `chapterManager.activate(id)` moved before `scrollToChapter()` so active chapter is set before GSAP sees the scroll position change.

- `src/engine/transition.ts` — added `chapterManager.getActiveId() !== fromId` guard at top of `handleTransitionRequest`. If the router already navigated to a chapter, `fromId` is stale and the transition should not fire. Defense against any remaining GSAP `onUpdate` callbacks that slip through the suppress window.

- `src/styles/global.css` — added `background: #000` to `html` element. Without this, the HTML root background was white, which showed as a flash when all chapter scenes were transitioning (all at `translateX(-100vw)` briefly during the spurious CRT transition).

**New files:**

- `playwright.config.ts` — Chromium-only, single worker, `baseURL: http://localhost:3000`, `reuseExistingServer: true` for dev; `retries: 0` since visual baselines must be exact.

- `tests/visual.spec.ts` — 3 baseline tests:
  - `lobby idle`: navigate `/`, wait for `.lobby-grid`, 500ms for entry stagger, screenshot.
  - `ARPANET idle`: navigate `/#arpanet`, wait for `.arpanet-terminal`, 600ms for fade-from-black, scroll 100px to fast-forward terminal, 300ms, screenshot.
  - `Figma Era idle`: navigate `/#figma-era`, wait for `.figma-card`, `waitForFunction` until overlay opacity < 0.05 (fade-from-black complete), 700ms for boot pixel animation, screenshot.

- `tests/visual.spec.ts-snapshots/` — three baseline PNGs (chromium-linux):
  - `lobby-idle-chromium-linux.png` — 8-card lobby grid with film grain, era-styled cards
  - `arpanet-idle-chromium-linux.png` — amber terminal text with phosphor glow + network map diamond
  - `figma-era-idle-chromium-linux.png` — glassmorphism dark cards ("2019 Dark Mode...", "2020 Design Systems...") + 7-pip progress indicator

**Test result:** 3 passed (7.3s) — all baselines correct.

**Commit:** 588aadc

---

### Week 4: E2E flow test + PHASES.md audit

**Files changed:**

- `tests/visual.spec.ts` — added `e2e flow` describe block with `ARPANET → Figma Era transition` test:
  - Navigates to `/#arpanet`, waits for terminal + fade overlay
  - Reads spacer `offsetTop + offsetHeight` from DOM to get exact scroll target (viewport-agnostic)
  - Scrolls to end of ARPANET spacer to fire `transitionRequest('arpanet', 'figma-era')`
  - `waitForFunction` gates on Figma Era at `translateX(0)` AND `visibility !== 'hidden'` — prevents a false positive from the temporary capture position set during html2canvas (briefly `translateX(0) + visibility:hidden`, then the real swap is `translateX(0) + visibility:''`)
  - Asserts: ≥3 `.figma-card` elements, ARPANET at `translateX(-100vw)`, scroll lock released
  - All 4 tests pass (9.3s)

- `PHASES.md` — corrected audit: marked done all Week 4 items already implemented in prior sessions but left unchecked: progress indicators, reduced motion, touch device detection, Figma Era end state, T9 overflow fix.

- `vite.config.js` — deleted stale duplicate (canonical is `vite.config.ts`)

**Commit:** 42e3d89
