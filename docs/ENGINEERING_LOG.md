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
