# Handoff

Last updated: 2026-08-04

## Architecture snapshot

Chronicle is a scroll-driven museum. Eight chapters planned (**four live**: ARPANET,
Early Web, Browser Wars, Figma Era). Seven transitions planned (**three live**: CRT
power-off, the Win 3.1 dialog, glass-shatter) — and as of Slice 2 they come in two
KINDS, not one: timer-driven shaders and user-gated DOM runners.

**Chapter identity + ordering** is derived from one source: `src/data/manifest.ts`
(Phase 2). The router's valid-hash set and the scroll engine's chapter order both
derive from `manifest.filter(c => c.live)`; the lobby grid renders from the same
array. Adding a chapter = flip `live` + author the chapter + add the DOM scene/spacer
(order drift is caught by `tests/unit/manifest.test.ts`). `chapters.ts` stays
content-only (facts/palette), keyed by id, for live chapters.

**Chapter scaffold** is `src/engine/create-chapter.ts` (Phase 2 T10, extracted once all
three chapters existed — rule of three). Every chapter is now a declarative spec passed
to `createChapter({ id, render, onMount?, onInit?, onProgress?, onDwellEnter?, ambient? })`,
which returns the `init(container)` function `main.ts` calls. The scaffold owns the
repeated spine: content lookup (`getChapter`), writing the template, `chapterManager.register`,
`startChapterAmbient`, the `onChapterProgress` subscription, and the `dwell-enter` listener.
Lifecycle: `render` → `onMount` (same tick, static listeners / one-time DOM setup) →
[lazily, on first activation or intersection] ambient → `onInit` → progress subscription.
Progress is deliberately subscribed *inside* the init callback, since every chapter's
progress handler assumes `onInit` already built its elements. A chapter marked `live` in
the manifest with no `chapters.ts` content record throws a named error at mount.

**Stack:** Vanilla TypeScript + Vite, GSAP ScrollTrigger, WebGL 2 (transitions only), html2canvas, Tone.js.

**Bundle / code-split:** GSAP + app code ship in the entry chunk (needed at first paint: ~59 KB gzip). Tone.js and html2canvas are dynamic `import()`s — each its own async chunk, kept out of the initial payload. Tone loads on the first user gesture (audio can't start before one); html2canvas is idle-preloaded (`requestIdleCallback` in `initTransitionEngine`) so it's ready before any transition capture without blocking paint. Both use `import type` for their types. Don't convert these back to static imports — it re-inflates cold paint from ~59 KB to ~167 KB gzip.

**DOM model:** All chapter scenes are `position:fixed`, full viewport. Inactive chapters are at `translateX(-100vw)` (NOT `display:none` — IntersectionObserver needs them in layout). Active chapter is at `translateX(0)`. One chapter is ever active at a time.

**Scroll engine:** Each chapter has an invisible `200.4vh` scroll spacer in document flow. GSAP ScrollTrigger observes the spacer. At `progress >= 200/200.4` (~0.998): dwell zone entered, html2canvas starts. At `progress = 1`: transition fires. `onChapterProgress(id, cb)` delivers 0–1 progress to chapter modules, normalized to exclude the dwell zone.

**Nav latch (router ↔ scroll ownership):** During hash navigation the router owns the active chapter until the user actually scrolls. `beginNavLatch()` (called via `suppressTransitionRequests()`) sets a latch released only by the first genuine user gesture (`wheel`/`touchstart`/`keydown`) — NOT a timer. While latched, `onEnter` will not `activate()` a chapter (prevents the scroll engine flipping the router's target) and `onUpdate`/`onLeaveBack` won't fire transitions/backwards-nav. This replaced a fixed 200ms window that raced against GSAP's network-variable settle time and intermittently broke direct entry to `#figma-era` (showed ARPANET). Consequence: a *programmatic* `scrollTo` never drives the CRT transition — only real user scrolling does.

**Transition engine:** `html2canvas` captures `from` and `to` chapter screenshots. `Promise.race([Promise.all([from, to]), 500ms timeout])` gates the WebGL shader. Touch devices use `fadeSwap` (no GLSL). The WebGL canvas is 1×1px at rest, resizes to fullscreen only during transitions.

**WebGL2-absent degradation (TODO-006, resolved 2026-08-03):** `webgl.ts` is constructed eagerly at module scope and imported by `main.ts`, so its old `throw new Error('WebGL2 not available')` killed the entire module graph — a blank page on Safari < 15, disabled-WebGL browsers, blocklisted GPUs, VMs and remote desktops. It now exposes `webgl.supported`; when false every GL method no-ops, `precompileAll` leaves the shader map empty, and `transition.ts` routes to `fadeSwap` alongside the touch and reduced-motion cases. The `getContext` probe is wrapped in try/catch, not just null-checked (hardened browsers throw from it). Guarded by `tests/webgl-fallback.spec.ts`, which nulls the webgl/webgl2 contexts via `addInitScript`.

**Hash router:** `#arpanet` → ARPANET, `#early-web` → Early Web, `#browser-wars` → Browser Wars, `#figma-era` → Figma Era, `#` → lobby. Valid hashes are derived from `manifest.filter(c => c.live)`, not hand-listed. Direct-link entry: 0.5s fade-from-black.

**Transitions (live):** `arpanet → early-web` = **crt-power-off** (shader, 2500ms); `early-web → browser-wars` = **win31-dialog** (dom, user-gated, `enterMs` 1200 — ends when a human acts, not on a timer); `browser-wars → figma-era` = **glass-shatter** (shader, 2000ms, relocated here by Slice 2 T7). glass-shatter is authored source-agnostic (samples only `uFrom`/`uTo`/`uResolution`) so its later move to the canonical `flat → figma-era` is a registry-key change, no shader edit. The direct `arpanet → figma-era` transition no longer exists. Shader-missing guard: if a transition's shader isn't compiled, `transition.ts` skips straight to `fadeSwap` rather than holding the scroll lock on a blank canvas.

## Component ownership

| Component | File | Status |
|---|---|---|
| Chapter manifest (identity + order) | `src/data/manifest.ts` | Complete (Phase 2) |
| Chapter data model | `src/data/chapters.ts` | Complete |
| Transition registry | `src/data/transitions.ts` | Complete |
| Chapter manager | `src/engine/chapter.ts` | Complete |
| Chapter scaffold (`createChapter`) | `src/engine/create-chapter.ts` | Complete (Phase 2 T10) |
| Scroll engine | `src/engine/scroll.ts` | Complete |
| Hash router | `src/engine/router.ts` | Complete |
| WebGL engine | `src/engine/webgl.ts` | Complete |
| Transition orchestrator | `src/engine/transition.ts` | Complete |
| Lobby | `src/chapters/lobby/` | Complete (stub) |
| ARPANET index | `src/chapters/arpanet/index.ts` | Complete |
| ARPANET terminal | `src/chapters/arpanet/terminal.ts` | Complete (audio deferred) |
| ARPANET network map | `src/chapters/arpanet/network-map.ts` | Complete |
| Early Web | `src/chapters/early-web/` | Complete (Phase 2 Slice 1) |
| Browser Wars | `src/chapters/browser-wars/` | Complete (Phase 2 Slice 2) |
| Win 3.1 dialog runner | `src/transitions/win31-dialog.ts` | Complete (Phase 2 Slice 2) |
| Figma Era | `src/chapters/figma-era/` | Complete (Week 2) |
| CRT shader | `src/shaders/crt-power-off.frag` | Complete |
| Glass-shatter shader | `src/shaders/glass-shatter.frag` | Complete (Phase 2) |
| UI controls cluster | `src/ui/controls.ts` | Complete (stretch) |
| Code overlay (view source) | `src/ui/code-overlay.ts` | Complete (stretch) |
| Share card | `src/ui/share-card.ts` | Complete (stretch) |
| Syntax highlighter | `src/ui/highlight.ts` | Complete (stretch) |
| Share nudge | `src/ui/controls.ts` (owns) ← `chronicle:closing-beat` from `figma-era` | Complete (stretch) |

## Global UI layer (`src/ui/`)

Chrome that sits above all chapters, wired once from `main.ts` via `initControls()`.

- **Controls cluster** (bottom-right): `</>` view-source + share. Keyboard `?` (source), `s` (share), `Esc` (close). Eager-loaded (tiny); the two heavy modules are `import()`-ed on first use so they stay out of the initial paint bundle (code-overlay 8.26 KB gzip, share-card 2.14 KB gzip). Hidden on the lobby.
- **Cluster visibility invariant:** entrance is a `.is-ready` class-toggled transition, NOT a fill-mode keyframe. A `@keyframes … both` fill pins `opacity` above normal declarations and defeats `.is-hidden` — do not reintroduce one, or the cluster gets stuck visible on the lobby. `.is-hidden` is defined AFTER `.is-ready` so it wins at equal specificity.
- **Code overlay:** imports real chapter source via Vite `?raw` — the panel is guaranteed to match what ships. To add a chapter, extend `REGISTRY` in `code-overlay.ts`.
- **Share card:** purpose-built off-screen 1200×630 node, not a live screenshot — html2canvas cannot capture the ARPANET SVG phosphor filter, WebGL, or Figma's backdrop-filter. Reuses `loadHtml2canvas()` exported from `transition.ts` (one shared cached chunk). ARPANET glow uses `text-shadow` (capturable), not the SVG filter.
- **Share nudge** (one-time coach-mark): when the Figma Era closing beat lands (`progress > 0.85`), the chapter dispatches a `window` `chronicle:closing-beat` CustomEvent. `controls.ts` (which already owns share) responds by showing a glass pill above the share button — "Press `S` to share this" (desktop) / "Tap to share this chapter" (touch), clickable → share, `×` to dismiss, auto-dismiss 6s. The share button pulses (`.ctrl-btn.is-pulsing`, a 2-iteration keyframe with **no** fill-mode — safe under the cluster visibility invariant) to connect hint → target. Shown at most **once per session** (`sessionStorage` `chronicle:share-nudge-seen`) and **never** if the user already shared this session (`hasShared`). The chapter stays ignorant of sharing; the event bridge keeps ownership clean. Positioned bottom-right (not bottom-center) specifically to avoid the fixed bottom-center Figma pips.
- **Active chapter** for both features comes from `chapterManager.getActiveId()`.

## Key invariants

- `IntersectionObserver` rootMargin must use `px` or `%` — `vh` causes a silent SyntaxError that kills the entire module graph
- `body.scroll-locked` (`src/styles/global.css:90`) sets `pointer-events: none` + `touch-action: none`, not just `overflow: hidden`. Correct for automatic shader transitions; fatal for anything the user must click. Interactive transitions need their own body state — do not reuse `lockScroll()`.
- `chapterManager.isInitialized()` (`chapter.ts:70`) is defined but **called from nowhere**. The Slice 1 plan claimed a target-initialized capture check that was never implemented; it is scheduled as T2c in the Slice 2 plan. Don't cite it as existing.
- Nothing constructed at module-evaluation time may throw. `webgl.ts`, `router.ts`, and `scroll.ts` all run work at import; a throw there blanks the site rather than degrading a feature. Degrade with a capability flag instead (see `webgl.supported`).
- Off-screen chapters use `translateX(-100vw)`, not `display:none`
- WebGL canvas: `this.container.scrollTop = this.container.scrollHeight` scrolls the `.arpanet-terminal` parent, not `#arpanet-output` (the inner div has no overflow)
- Figma Era `backdrop-filter: blur(20px)` — do not change this value
- Figma Era accent: `#00D4FF` (electric blue) — do not drift to purple/indigo
- Lobby background: `#0D0D0D` (not `#000000`)
- ARPANET bg: `#000000`, amber: `#FF9500`
- CRT shader phase assignment: DONE (Phase 2 Slice 1). CRT is now ARPANET→Early Web (canonical); Figma Era's entry is glass-shatter (temp Early Web→Figma bridge until Flat ships).
- Early Web palette (web-safe, do not drift): page `#C0C0C0`, navy `#000080`, links `#0000EE`/visited `#551A8B`, red `#CC0000`, teal `#008080`, shell `#0A0A0A`. Fonts: Times New Roman (body/headline), Courier New (year/counter), Arial (chrome only). See `docs/EARLY-WEB-BRIEF.md`.
- Adding a chapter: flip `live` in `manifest.ts`, add the `#chapter-<id>` scene + `.chapter-scroll-spacer` in `index.html` (spacer order MUST match manifest order — drift-guarded), add content to `chapters.ts`, author the module with `createChapter({ … })`, and register it in `main.ts` BEFORE `initRouter()`.
- Chapter modules must not call `chapterManager.register`, `onChapterProgress`, or `startChapterAmbient` directly — `createChapter` owns that wiring. Bypassing it is how the three chapters drifted apart in Phase 1.
- **`#scroll-container` and `.chapter-scroll-spacer` are `pointer-events: none`.** They sit later in the DOM than the `position: fixed` `.chapter-scene` elements and both are `z-index: auto`, so without this they win hit-testing over ALL chapter content. This was live and silent for two years — no chapter had anything clickable inside a scene until Browser Wars' visitor counter. If you ever need the container interactive, re-enable per element, never on the container.
- **Visibility is a class toggle, never a fill-mode keyframe.** A `both`-filled animation leaves `animationName` set forever, so an element that finished arriving still reads as "animating" — which breaks any motion-budget assertion and hides real animation. The Browser Wars arrival beat is JS-driven `.is-in` toggles for this reason.
- **`build.assetsInlineLimit: 0`** (`vite.config.ts`). Vite inlines assets under 4 KB as base64 into the entry chunk; Browser Wars' artwork is all under that, and inlining cost +8.5 KB gzip paid at first paint by visitors who may never reach chapter 3. Do not remove this without re-measuring.
- **Two kinds of transition.** `shader` (timer-driven, takes `lockScroll()`) and `dom` (user-gated, takes `body.transition-paused`). The dom branch in `transition.ts` runs BEFORE the scroll lock and before the touch/reduced-motion/WebGL fallbacks — a DOM transition has no `fadeSwap` downgrade on touch, which makes it the only transition mobile users get in full.
- Settlement for dom transitions is **three-valued**: `advance` (swap + audio crossfade), `cancel` (`returnToChapter` at 85%), `abort` (teardown only — the router owns the active chapter, so swapping or restoring would fight it).
- **A user-gated dialog must sit over the chapter being LEFT.** The triggering scroll has already crossed into the destination spacer, so `onEnter` would activate the destination behind the dialog. Guarded by `setDomTransitionOpen()` in `scroll.ts` plus a re-assert of the origin in `runDomTransition`. Breaking this doesn't fail loudly — it just quietly destroys the beat.
- **`<dialog>` needs an explicit `margin: auto`.** The global reset zeroes the UA's, which is what centres a modal dialog; without it the dialog pins to the top-left.
- **Restart the dev server after editing `src/engine/`.** Vite does not reliably HMR these modules mid-session, and Playwright will silently test stale code. If a `console.log` you just added prints nothing at all, suspect staleness first.
- **`returnToChapter` guards the `onLeaveBack` its own scroll causes.** The instant scrollTo crosses a spacer boundary backwards; without the guard a second return queues on top of the first and re-locks the body for another 150ms.
- **Period font stacks must not end at a bare generic.** `lobby/style.css:182` ships `'Comic Sans MS', 'Chalkboard SE', cursive` — Chalkboard SE is macOS-only, so Linux/Android miss both and land on the system default with **no error anywhere**. An era whose typography IS the design must self-host a metric-compatible open face (Comic Relief, SIL OFL, for Comic Sans). Applies to every future chapter that leans on a non-web-safe face. Papyrus has no free metric clone — don't specify it.
- **WordArt is an SVG asset, never a typeface.** It always was a rendered picture. Shipping it as SVG is both more period-accurate and removes a font dependency.
- **Every chapter's scroll-progress indicator is a period-native artifact of its own era**, never a generic bar, and never reused across chapters. ARPANET = amber ASCII block bar. Early Web = green `#00FF00` odometer. Browser Wars = IE4 throbber. Two chapters sharing one artifact reads as the same object and costs an era-jump beat — which is why Browser Wars' counter is red `#FF2400`, not green.
- Browser Wars palette (do not drift): page `#FFFFFF`, magenta `#FF00FF`, yellow `#FFFF00`, lime `#00FF00`, cyan `#00FFFF`, links `#0000FF`/visited `#800080`, well ink `#1A1A1A` (17.4:1), counter `#FF2400`, shell `#0A0A0A`. `#00FF00`/`#FFFF00`/`#FF00FF` **never carry text on white** (1.4:1 / 1.1:1 / 3.1:1). Frame is **IE4** with **IE4's own throbber** — the plan's D3.1 Netscape throbber was reversed by design review because an IE4 window cannot carry an N-comet. See `docs/BROWSER-WARS-BRIEF.md`.
- Win 3.1 dialog backdrop blur is **4px** — deliberately not one of the existing 20/12/8px values. Early Web must stay legible behind it; the beat is being asked whether to leave a place you can still see.
- Chapter motion budget: **2 Hz max per animated element, 3 concurrent animated elements max in viewport.** WCAG 2.3.1 fails above 3 flashes/sec; this sits at two-thirds of the threshold by construction rather than by measurement afterwards. CSS cannot pause a GIF or a native `<marquee>` — every animated GIF ships a static first-frame PNG sibling swapped in JS.

## Dev server (WSL2)

```bash
kill $(lsof -ti:3000) && npm run dev -- --host &
```

Vite's module cache goes stale in WSL2. Always kill + restart after file edits.
