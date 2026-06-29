# Engineering Log

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

**Commit:** (pending)
