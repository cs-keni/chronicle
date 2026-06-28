# Chronicle — PHASES

Scroll-driven museum of web design history. Eight chapters. Seven GLSL transitions.

**Target audience:** Designers and developers who lived through these eras or want to understand what shaped current web design conventions.

**Success (Phase 1):** A 2-chapter proof-of-concept that a designer would share on social media as "the most accurate ARPANET terminal recreation I've seen in a browser."

**Success (full release):** Appears in at least one major design publication (Sidebar, CSS-Tricks, Smashing Magazine).

---

## Chapter Lineup

| # | Chapter | Era | Phase |
|---|---------|-----|-------|
| 0 | Lobby | — | 1 |
| 1 | ARPANET | 1969–1982 | 1 |
| 2 | Early Web | 1983–1994 | 2 |
| 3 | Browser Wars | 1995–2001 | 2 |
| 4 | Post-Crash / Web 2.0 | 2002–2007 | 2 |
| 5 | Mobile / Skeuomorphic | 2008–2012 | 2 |
| 6 | Flat / Material | 2013–2018 | 2 |
| 7 | Figma Era | 2019–2023 | 1 (formerly "Now") |
| 8 | AI Web | 2024+ | 2 |

**Phase 1 transition:** ARPANET → Figma Era uses CRT power-off as a temporary Phase 1 assignment. In Phase 2, CRT moves to its canonical position (ARPANET → Early Web), and Figma Era gets its proper shader (glass shatter from Flat/Material).

---

## Phase 1 — Foundation (Weeks 1–4)

Goal: lobby + ARPANET + Figma Era + CRT transition + hash routing — proving the full stack.

**Phase 1 gate:** ARPANET + Figma Era are live, CRT transition runs at 60fps on M3, lobby serves working deep links. Code overlay (E4) and share cards (E5) are stretch goals — they do not block the gate.

### Pre-implementation (ALL must complete before Week 1 code)

- [ ] ARPANET chapter content research and writing (`docs/ARPANET-CONTENT.md`) — see TODOS.md #004
- [ ] Figma Era design brief (`docs/FIGMA-ERA-BRIEF.md`) — formerly "Now chapter brief" TODOS.md #003
- [ ] Lobby design brief (`docs/LOBBY-BRIEF.md`) — new gate added by CEO review
- [ ] html2canvas spike — validate CSS filter capture AND main-thread block time < 16ms — see TODOS.md #001

### Week 1 — Scaffolding + Engine Core

- [ ] Vite + vanilla TypeScript project init
- [ ] Install and configure: GSAP (ScrollTrigger), Tone.js, html2canvas, Playwright
- [ ] Chapter data model: `src/data/chapters.ts` (typed JSON schema)
  - Fields: id, yearRange, palette, fontFamily, artifacts, ambientAudio, facts
  - No `transitionOut` field — transitions live in `transitions.ts` (see below)
- [ ] Transition registry: `src/data/transitions.ts`
  - Maps `{from: string, to: string}` → `{shader: string, duration: number}`
- [ ] Chapter render engine: `src/engine/chapter.ts`
  - DOM swap model: chapters positioned off-screen with `translateX(-100vw)`, NOT `display:none`
  - Active chapter: `translateX(0)`
  - Lazy-init: IntersectionObserver fires when chapter comes within 1vh of viewport
- [ ] GSAP scroll engine: `src/engine/scroll.ts`
  - Pin each chapter at 100% scroll progress
  - Dwell zone: 0.4vh of dead scroll after pin
  - Transition trigger: dwell zone exhausted AND texture capture Promise resolved
  - Scroll lock during transition: `pointer-events:none` + `touch-action:none` on body
- [ ] Persistent WebGL canvas: `src/engine/webgl.ts`
  - 1×1px hidden canvas, lives from page load to close
  - Resizes to 100vw×100vh during transitions, returns to 1×1px after
  - One GL context, always valid
  - Precompile all shaders via `requestIdleCallback` using `KHR_parallel_shader_compile`

### Week 2 — ARPANET Chapter

- [ ] Chapter CSS: `src/chapters/arpanet/style.css`
  - `background: #000000`, `color: #FF9500`, `font-family: 'Courier New', monospace`
  - Scanlines: `::after` with `repeating-linear-gradient`, 30% opacity
  - Vignette: `::before` with `radial-gradient`, `position: fixed`, `pointer-events: none`
  - Phosphor glow: inline SVG filter with `feColorMatrix` + `feGaussianBlur` on chapter root
  - Fixed height: `200vh` (enforced — no dynamic growth from terminal content)
- [ ] Terminal artifact: `src/chapters/arpanet/terminal.ts`
  - Typing scheduler: `setTimeout` on main thread (no Web Worker)
  - Character delay: 80–220ms randomized per character
  - Keystroke sound: `Tone.js` `Synth.triggerAttackRelease()`, pitch ±8% randomized
  - Audio unlock: `audioCtx.resume()` on first scroll event
  - iOS fallback: if `resume()` fails, show `PRESS ANY KEY TO CONTINUE` prompt in terminal
  - Idle state after opening text: cursor drops to new empty line and blinks (no prompt, no further output until scroll)
  - Fast-forward on scroll: if first scroll fires while typing is pending, cancel all `setTimeout` calls and flush remaining chars immediately to terminal DOM; then scroll-triggered facts proceed normally
  - Facts rendering: each fact from `facts[]` types itself into the terminal as scroll-triggered output (one fact per scroll milestone within 200vh); stays in ARPANET amber monospace grammar
- [ ] Network map artifact: `src/chapters/arpanet/network-map.ts`
  - SVG network diagram, glows in as chapter activates
  - Purely visual, no interaction required for Phase 1
- [ ] ARPANET content: populate `facts` array from research (TODOS.md #004)

### Week 1 (parallel) — Lobby + Hash Router

- [ ] Hash router: `src/engine/router.ts`
  - Listen on `hashchange` and `DOMContentLoaded`
  - Valid hashes: `#arpanet`, `#figma-era` (Phase 1); expand per chapter in Phase 2
  - Direct-link entry: fade from black 0.5s ease-in; no preceding transition
  - `#` or empty hash → lobby (chapter 0)
- [ ] Lobby screen: `src/chapters/lobby/`
  - Visual identity: pure era-styled cards from top edge — no title, no tagline, no header. The era-styled grid IS the identity statement.
  - LOBBY-BRIEF.md **must** define: background treatment, card grid columns, card dimensions, spacing rhythm, card label typography, hover behavior, entry animation. These are mandatory deliverables before any lobby code is written.
  - Chapter preview cards (2 live + 6 "Coming Soon" stubs)
  - Live cards show 2s looping CSS animation per chapter:
    - ARPANET: amber monospace text types a command with blinking cursor, loops
    - Figma Era: a pill selection component ripples its active state, loops
  - "Coming Soon" stubs styled in their era's visual grammar:
    - Early Web: system-gray card with `#000080` border
    - Browser Wars: gaudy rainbow border, WordArt-style label
    - Post-Crash: desaturated blue, clean ratio, minimal
    - Mobile: leather texture card, embossed label
    - Flat: flat color block, long shadow
    - AI Web: glass blur card, ambient gradient pulse
  - Lobby → Chapter transition: fade from black 0.5s ease-in (same code path as direct-link entry — hash router reuses the existing fade; no new transition component)

### Week 2 (parallel) — Figma Era Chapter

- [ ] Chapter CSS: `src/chapters/figma-era/style.css`
  - `background: #0A0A0A`, white text, electric blue accent `#00D4FF`
  - Glassmorphism cards: `backdrop-filter: blur()`, `background: rgba(255,255,255,0.05)`
  - Typography: `-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif`
    (Note: SF Pro via system font stack only — cannot be served as web font)
  - Noise grain overlay: CSS `url(noise.svg)` filter at 3% opacity
  - Fixed height: `200vh`
- [ ] Floating card layout
- [ ] Figma Era content: populate from design brief (`docs/FIGMA-ERA-BRIEF.md`)
- [ ] Boot arrival animation: when entering via CRT power-off, a single pixel expands from center before chapter settles — creates continuity with the CRT expand phase

### Week 3 — CRT Power-Off Transition Shader

- [ ] html2canvas integration: `src/engine/transition.ts`
  - Fires at dwell zone entry (not at 80% — avoids capturing mid-type terminal)
  - `Promise.all([captureFrom, captureTo])` before triggering transition
  - If capture takes > dwell zone: extend scroll lock (max 500ms extra); ARPANET progress indicator changes to pulsing pattern (block chars blink or trailing cursor blinks) — signals loading without breaking CRT grammar; no other visual change
  - Texture A (from): ARPANET chapter screenshot
  - Texture B (to): Early Web chapter rendered off-screen
- [ ] GLSL shader: `src/shaders/crt-power-off.frag`
  ```glsl
  // Phase 0.0–0.4: compress uFrom to horizontal white line
  // Phase 0.4–0.6: hold white line
  // Phase 0.6–1.0: expand revealing uTo
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  ```
- [ ] Transition engine wiring: scroll lock → canvas resize → textures → rAF loop
- [ ] Transition completion: canvas to 1×1, ARPANET off-screen, Figma Era active
- [ ] Manual GPU profiling: Chrome DevTools → Performance → verify 60fps throughout
- [ ] Document baseline frame time in `docs/SHADER-PROFILES.md`

### Week 4 — Integration, QA, Polish

- [ ] End-to-end scroll flow: ARPANET → dwell → CRT transition → Figma Era
- [ ] Era-appropriate progress indicators: `src/chapters/{era}/progress.ts`
  - ARPANET: `▓▓▓▓▒▒░░░░ 40%` — ASCII block chars, amber, monospace, bottom-left
  - Figma Era: 7 pill dots (◉●●●○○○), glassmorphism, bottom-center
- [ ] Backwards navigation: reverse scroll triggers 0.15s ease-in fade to black → 0.15s ease-out fade in from black (no reverse shader)
- [ ] Playwright visual regression (DOM-only — no WebGL pixel comparison):
  - Lobby idle screenshot baseline
  - ARPANET idle screenshot baseline (DOM layer without WebGL transition)
  - Figma Era idle screenshot baseline
  - Run: `npx playwright test --update-snapshots` to set baselines
  - WebGL GLSL uniforms: verify via `gl.getUniform()` in test hooks, not pixel comparison
- [ ] Audio: Tone.js crossfade during transition (driven by GSAP `onUpdate`, not Tone Transport):
  - Schedule with `Tone.now()` at transition start — do NOT schedule per-frame
  - ARPANET audio fades out over first 1s of transition
  - Figma Era audio fades in starting at 60% of transition
- [ ] Reduced motion: `@media (prefers-reduced-motion: reduce)` → chapter swap with fade-to-black, no shader
- [ ] Touch device detection: `ontouchstart in window || navigator.maxTouchPoints > 0` → disable GLSL shaders; transitions use fade-to-black (same path as reduced-motion). Chapters still render with full CSS visual fidelity. Resolves iOS ScrollTrigger quirk risk for Phase 1.
- [ ] Figma Era end state: closing beat at chapter bottom edge — glassmorphism-styled line "END OF KNOWN HISTORY. MORE CHAPTERS LOADING." in Figma Era typography + Geist. Below it: a minimal `Explore more →` pill (glassmorphism, `#00D4FF` border) that navigates to `#` (lobby). This closes the Phase 1 emotional arc and provides the shareability moment.
- [ ] Fix T9: enforce fixed chapter heights (`overflow: hidden` on containers)
- [ ] Browser support smoke test: Chrome, Safari 15.4+, Firefox, iOS Safari, Windows Chrome
- [ ] Ship Phase 1 as proof-of-concept
- [ ] STRETCH (cut if overrun): Code overlay (`?` key, slide-in panel 30% width)
- [ ] STRETCH (cut if overrun): Share card (html2canvas + Web Share API + clipboard fallback)

---

## Phase 2 — Full Chapter Build-Out (Weeks 5–14)

- [ ] CRT shader moves from ARPANET→Figma Era (Phase 1 temp) to canonical ARPANET→Early Web position
- [ ] Figma Era gets its canonical entry shader: glass shatter (from Flat/Material)
- [ ] Early Web chapter (1983–1994): system gray, Navy/Red palette, Times New Roman, dithered gradients
- [ ] Browser Wars chapter (1995–2001): gaudy palette, animated GIFs (real ones), tiled bg, hit counter
- [ ] Post-Crash / Web 2.0 chapter (2002–2007): desaturated blues, Verdana, rational spacing, gloss
- [ ] Mobile / Skeuomorphic chapter (2008–2012): leather textures, linen, embossed type, Helvetica Neue
- [ ] Flat / Material chapter (2013–2018): Google 2014 palette, Roboto, long shadows, FABs
- [ ] AI Web chapter (2024+): generative UI, LLM chat interfaces, spatial UI post-Vision Pro — visual brief to be authored in Phase 2
- [ ] All 7 transition shaders authored (Phase 2 set):
  - [ ] ARPANET → Early Web: CRT power-off (moved from Phase 1 temp assignment)
  - [ ] Early Web → Browser Wars: Windows 3.1 dialog box DOM overlay
  - [ ] Browser Wars → Post-Crash: BSOD wipe + dissolve
  - [ ] Post-Crash → Mobile: phone unlock swipe + perspective rotation
  - [ ] Mobile → Flat: progressive texture strip (leather, gradients, shadows)
  - [ ] Flat → Figma Era: glass shatter (triangle fragment system + WebGL)
  - [ ] Figma Era → AI Web: TBD — speculative, authored during Phase 2
- [ ] All shaders profiled (60fps on M3 target), documented in SHADER-PROFILES.md
- [ ] Era-appropriate progress indicators for all Phase 2 chapters
- [ ] Interactive artifacts:
  - [ ] Visitor counter (Browser Wars): increments on load, CSS hit counter style
  - [ ] Dark mode toggle (Figma Era): was introduced in 2019, live toggle in that chapter
- [ ] Variable font axes wired to scroll position within each chapter
- [ ] Ambient audio per chapter (Creative Commons or original — see TODOS.md)
- [ ] Content written for all 8 chapters (visual/design history focus)
- [ ] Code overlay (E4) if not shipped in Phase 1 stretch

---

## Phase 3 — Polish (Weeks 15–22)

- [ ] Within-chapter parallax: text at different depths
- [ ] Per-chapter easter eggs (hidden in each era)
- [ ] Mobile: chapters reflow — less immersive, still functional
- [ ] Accessibility: full reduced-motion degradation to static-per-chapter
- [ ] Performance audit: every shader profiled, lazy loading, font subsetting
- [ ] Figma Era chapter pushed to feel genuinely ahead of current glassmorphism trends
- [ ] iOS scroll locking during transitions (complete implementation)
- [ ] Cross-browser QA matrix (Chrome, Firefox, Safari, Mobile Safari)
- [ ] SF Pro system font stack confirmed in production

---

## Phase 4 — Depth (Months 6+)

- [ ] Add more facts/events to each chapter's data model
- [ ] New chapters: "The Metaverse Attempt" (2020–2022), "The AI Web" (2023+)
- [ ] Community: form for people to submit forgotten moments from each era
- [ ] Blog post: "How We Built Chronicle" with shader source code

---

## Architecture Decisions (locked in plan review, 2026-06-27)

| Decision | Choice | Rationale |
|---|---|---|
| D1: WebGL context | Per-transition only, chapters CSS-only | Browser context budget; CSS is sufficient for always-on chapter effects |
| D2: Chapter DOM | DOM swap, off-screen via translateX | Each chapter is self-contained; display:none breaks IntersectionObserver |
| D3: Transition trigger | Scroll-locked + dwell zone (0.4vh) | Cinematic feel; user intention is clear |
| D4: CRT visual effect | CSS SVG filter + pseudo-elements | 0% GPU cost; equivalent fidelity; no WebGL context needed |
| D5: Transition ownership | Registry (transitions.ts), not chapter property | Transitions are relationships between chapters, not properties of one |
| D6: Content scope | Visual/design history only | Tighter editorial lens; plays to project's visual strengths |
| D7: Test strategy | Playwright visual regression + manual GPU profiling | Baseline regressions caught automatically; GPU profiling is inherently manual |
| D8: Typing effect | Main thread setTimeout (no Web Worker) | < 0.5ms per character; worker adds latency with no benefit |
| D9/D10/D15: Shader precompile | One persistent 1×1 WebGL canvas, resized for transitions | GL programs are context-specific; one canvas = one context = programs always valid |
| D11: DOM-to-texture | html2canvas during dwell zone | Industry-standard approach for DOM→WebGL transitions |
| D12: Chapter visibility | translateX off-screen (not display:none) | IntersectionObserver cannot observe display:none elements |
| D13: Audio unlock | AudioContext.resume() on first scroll; iOS tap prompt | Web Audio API requires user gesture; iOS scroll alone insufficient |
| D14: Typing Web Worker | Reversed — main thread only | Worker adds complexity with no performance benefit |
| D16: Texture race condition | Gate transition on Promise.all([captureA, captureB]) | Null texture → black screen; this is a hard failure mode |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | SELECTIVE EXPANSION | 5 expansions accepted, plan updated |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 7 findings (all resolved) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 2 | CLEAR (PLAN) | 16 issues, 0 unresolved, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score: 5/10 → 8/10, 10 decisions made |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CEO REVIEW SCOPE CHANGES (2026-06-28):** Added lobby + hash routing (E0), audience/success definition (E1), split "Now" → Figma Era + AI Web ch.8 (E2), era-appropriate progress indicators (E3), code overlay stretch (E4), share cards stretch (E5). CRT shader contradiction resolved. Chapter lineup updated to 8 chapters. Pre-implementation gates updated.

**DESIGN REVIEW DECISIONS (2026-06-28):** Lobby = pure era-styled cards, no title (Pass 1A). Facts render as scroll-triggered terminal output (Pass 1B). Progress indicator pulses during dwell capture (Pass 2A). Lobby→chapter = fade-from-black same as direct-link (Pass 2B). Phase 1 end state = closing beat + back-to-lobby pill (Pass 3A). Figma Era accent locked to `#00D4FF` (Pass 4A). Touch devices = no-transition degradation, full CSS fidelity (Pass 6A). Terminal idle = blinking cursor on new empty line (Pass 7A). Typing interrupted by scroll = fast-forward flush (Pass 7B). Outside voice (Claude subagent) found 15 issues — 10 resolved, 5 deferred to briefs. Most critical catches: lobby entirely undesigned, "electric accents" undefined, facts rendering unspecified.

**CROSS-MODEL:** Outside voice (Claude subagent) found 7 eng issues (session 1) + 15 design issues (session 2) — all resolved or gated on briefs. Most critical eng catches: D11 (html2canvas), D15 (GL context specificity). Most critical design catches: lobby hierarchy, Figma Era accent, facts rendering, Phase 1 end state.

**VERDICT:** ENG CLEARED — ready to implement Phase 1.

NO UNRESOLVED DECISIONS
