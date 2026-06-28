# Chronicle — PHASES

Scroll-driven museum of web design history. Seven chapters. Six GLSL transitions.

---

## Phase 1 — Foundation (Weeks 1–4)

Goal: two shippable chapters and one working transition, proving the full stack.

### Pre-implementation (before any code)

- [ ] ARPANET chapter content research and writing (see TODOS.md #004)
- [ ] "Now" chapter design brief (see TODOS.md #003)
- [ ] html2canvas spike — validate transition texture approach (see TODOS.md #001)

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
- [ ] Network map artifact: `src/chapters/arpanet/network-map.ts`
  - SVG network diagram, glows in as chapter activates
  - Purely visual, no interaction required for Phase 1
- [ ] ARPANET content: populate `facts` array from research (TODOS.md #004)

### Week 2 (parallel) — Modern Chapter

- [ ] Chapter CSS: `src/chapters/modern/style.css`
  - `background: #0A0A0A`, white text, electric accents
  - Glassmorphism cards: `backdrop-filter: blur()`, `background: rgba(255,255,255,0.05)`
  - Typography: `-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif`
    (Note: SF Pro via system font stack only — cannot be served as web font)
  - Noise grain overlay: CSS `url(noise.svg)` filter at 3% opacity
  - Fixed height: `200vh`
- [ ] Floating card layout
- [ ] "Now" chapter content: populate from design brief (TODOS.md #003)

### Week 3 — CRT Power-Off Transition Shader

- [ ] html2canvas integration: `src/engine/transition.ts`
  - Fires at dwell zone entry (not at 80% — avoids capturing mid-type terminal)
  - `Promise.all([captureFrom, captureTo])` before triggering transition
  - If capture takes > dwell zone: extend scroll lock (max 500ms extra), show no visual
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
- [ ] Transition completion: canvas to 1×1, ARPANET off-screen, Early Web active
- [ ] Manual GPU profiling: Chrome DevTools → Performance → verify 60fps throughout
- [ ] Document baseline frame time in `docs/SHADER-PROFILES.md`

### Week 4 — Integration, QA, Polish

- [ ] End-to-end scroll flow: ARPANET → dwell → CRT transition → Modern
- [ ] Progress bar (if applicable): visual indicator of position within chapter
- [ ] Playwright visual regression:
  - ARPANET idle screenshot baseline
  - Modern idle screenshot baseline
  - Run: `npx playwright test --update-snapshots` to set baselines
- [ ] Audio: Tone.js ambient audio crossfade during transition
  - ARPANET audio fades out over first 1s of transition
  - Modern audio fades in over last 1s of transition
- [ ] Reduced motion: `@media (prefers-reduced-motion: reduce)` → chapter swap without shader
- [ ] Fix T9: enforce fixed chapter heights (`overflow: hidden` on containers)
- [ ] Update SPEC.md with all architectural decisions made during plan review
- [ ] Ship Phase 1 as proof-of-concept

---

## Phase 2 — Full Chapter Build-Out (Weeks 5–14)

- [ ] Early Web chapter (1983–1994): system gray, Navy/Red palette, Times New Roman, dithered gradients
- [ ] Browser Wars chapter (1995–2001): gaudy palette, animated GIFs (real ones), tiled bg, hit counter
- [ ] Post-Crash / Web 2.0 chapter (2002–2007): desaturated blues, Verdana, rational spacing, gloss
- [ ] Mobile / Skeuomorphic chapter (2008–2012): leather textures, linen, embossed type, Helvetica Neue
- [ ] Flat / Material chapter (2013–2018): Google 2014 palette, Roboto, long shadows, FABs
- [ ] All 6 transition shaders authored:
  - [ ] Early Web → Browser Wars: Windows 3.1 dialog box DOM overlay
  - [ ] Browser Wars → Post-Crash: BSOD wipe + dissolve
  - [ ] Post-Crash → Mobile: phone unlock swipe + perspective rotation
  - [ ] Mobile → Flat: progressive texture strip (leather, gradients, shadows)
  - [ ] Flat → Now: glass shatter (triangle fragment system + WebGL)
- [ ] All shaders profiled (60fps on M3 target), documented in SHADER-PROFILES.md
- [ ] Interactive artifacts:
  - [ ] Visitor counter (Browser Wars): increments on load, CSS hit counter style
  - [ ] Dark mode toggle (Modern): was introduced in 2019, live toggle in that chapter
- [ ] Variable font axes wired to scroll position within each chapter
- [ ] Ambient audio per chapter (Creative Commons or original — see TODOS.md)
- [ ] Content written for all 7 chapters (visual/design history focus)

---

## Phase 3 — Polish (Weeks 15–22)

- [ ] Within-chapter parallax: text at different depths
- [ ] Per-chapter easter eggs (hidden in each era)
- [ ] Mobile: chapters reflow — less immersive, still functional
- [ ] Accessibility: full reduced-motion degradation to static-per-chapter
- [ ] Performance audit: every shader profiled, lazy loading, font subsetting
- [ ] "Now" chapter pushed to feel genuinely ahead of current design
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
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 7 findings (all resolved) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 2 | CLEAR (PLAN) | 16 issues, 0 unresolved, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CROSS-MODEL:** Outside voice (Claude subagent) found 7 issues — all substantive, all resolved in session. Most critical catch: D11 (DOM-to-texture problem — html2canvas) and D15 (GL program context specificity). Both were addressed as architecture decisions and are reflected in PHASES.md.

**VERDICT:** ENG CLEARED — ready to implement Phase 1.

NO UNRESOLVED DECISIONS
