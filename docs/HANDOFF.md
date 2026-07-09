# Handoff

Last updated: 2026-07-09

## Architecture snapshot

Chronicle is a scroll-driven museum. Eight chapters planned (three live: ARPANET,
Early Web, Figma Era). Seven GLSL transitions planned (two live: CRT power-off,
glass-shatter).

**Chapter identity + ordering** is derived from one source: `src/data/manifest.ts`
(Phase 2). The router's valid-hash set and the scroll engine's chapter order both
derive from `manifest.filter(c => c.live)`; the lobby grid renders from the same
array. Adding a chapter = flip `live` + author the chapter + add the DOM scene/spacer
(order drift is caught by `tests/unit/manifest.test.ts`). `chapters.ts` stays
content-only (facts/palette), keyed by id, for live chapters.

**Stack:** Vanilla TypeScript + Vite, GSAP ScrollTrigger, WebGL 2 (transitions only), html2canvas, Tone.js.

**Bundle / code-split:** GSAP + app code ship in the entry chunk (needed at first paint: ~59 KB gzip). Tone.js and html2canvas are dynamic `import()`s — each its own async chunk, kept out of the initial payload. Tone loads on the first user gesture (audio can't start before one); html2canvas is idle-preloaded (`requestIdleCallback` in `initTransitionEngine`) so it's ready before any transition capture without blocking paint. Both use `import type` for their types. Don't convert these back to static imports — it re-inflates cold paint from ~59 KB to ~167 KB gzip.

**DOM model:** All chapter scenes are `position:fixed`, full viewport. Inactive chapters are at `translateX(-100vw)` (NOT `display:none` — IntersectionObserver needs them in layout). Active chapter is at `translateX(0)`. One chapter is ever active at a time.

**Scroll engine:** Each chapter has an invisible `200.4vh` scroll spacer in document flow. GSAP ScrollTrigger observes the spacer. At `progress >= 200/200.4` (~0.998): dwell zone entered, html2canvas starts. At `progress = 1`: transition fires. `onChapterProgress(id, cb)` delivers 0–1 progress to chapter modules, normalized to exclude the dwell zone.

**Nav latch (router ↔ scroll ownership):** During hash navigation the router owns the active chapter until the user actually scrolls. `beginNavLatch()` (called via `suppressTransitionRequests()`) sets a latch released only by the first genuine user gesture (`wheel`/`touchstart`/`keydown`) — NOT a timer. While latched, `onEnter` will not `activate()` a chapter (prevents the scroll engine flipping the router's target) and `onUpdate`/`onLeaveBack` won't fire transitions/backwards-nav. This replaced a fixed 200ms window that raced against GSAP's network-variable settle time and intermittently broke direct entry to `#figma-era` (showed ARPANET). Consequence: a *programmatic* `scrollTo` never drives the CRT transition — only real user scrolling does.

**Transition engine:** `html2canvas` captures `from` and `to` chapter screenshots. `Promise.race([Promise.all([from, to]), 500ms timeout])` gates the WebGL shader. Touch devices use `fadeSwap` (no GLSL). The WebGL canvas is 1×1px at rest, resizes to fullscreen only during transitions.

**Hash router:** `#arpanet` → ARPANET, `#early-web` → Early Web, `#figma-era` → Figma Era, `#` → lobby. Valid hashes are derived from `manifest.filter(c => c.live)`, not hand-listed. Direct-link entry: 0.5s fade-from-black.

**Transitions (live):** `arpanet → early-web` = **crt-power-off** (2500ms, now at its canonical position); `early-web → figma-era` = **glass-shatter** (2000ms). glass-shatter is authored source-agnostic (samples only `uFrom`/`uTo`/`uResolution`) so its later move to the canonical `flat → figma-era` is a registry-key change, no shader edit. The direct `arpanet → figma-era` transition no longer exists. Shader-missing guard: if a transition's shader isn't compiled, `transition.ts` skips straight to `fadeSwap` rather than holding the scroll lock on a blank canvas.

## Component ownership

| Component | File | Status |
|---|---|---|
| Chapter manifest (identity + order) | `src/data/manifest.ts` | Complete (Phase 2) |
| Chapter data model | `src/data/chapters.ts` | Complete |
| Transition registry | `src/data/transitions.ts` | Complete |
| Chapter manager | `src/engine/chapter.ts` | Complete |
| Scroll engine | `src/engine/scroll.ts` | Complete |
| Hash router | `src/engine/router.ts` | Complete |
| WebGL engine | `src/engine/webgl.ts` | Complete |
| Transition orchestrator | `src/engine/transition.ts` | Complete |
| Lobby | `src/chapters/lobby/` | Complete (stub) |
| ARPANET index | `src/chapters/arpanet/index.ts` | Complete |
| ARPANET terminal | `src/chapters/arpanet/terminal.ts` | Complete (audio deferred) |
| ARPANET network map | `src/chapters/arpanet/network-map.ts` | Complete |
| Early Web | `src/chapters/early-web/` | Complete (Phase 2 Slice 1) |
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
- Off-screen chapters use `translateX(-100vw)`, not `display:none`
- WebGL canvas: `this.container.scrollTop = this.container.scrollHeight` scrolls the `.arpanet-terminal` parent, not `#arpanet-output` (the inner div has no overflow)
- Figma Era `backdrop-filter: blur(20px)` — do not change this value
- Figma Era accent: `#00D4FF` (electric blue) — do not drift to purple/indigo
- Lobby background: `#0D0D0D` (not `#000000`)
- ARPANET bg: `#000000`, amber: `#FF9500`
- CRT shader phase assignment: DONE (Phase 2 Slice 1). CRT is now ARPANET→Early Web (canonical); Figma Era's entry is glass-shatter (temp Early Web→Figma bridge until Flat ships).
- Early Web palette (web-safe, do not drift): page `#C0C0C0`, navy `#000080`, links `#0000EE`/visited `#551A8B`, red `#CC0000`, teal `#008080`, shell `#0A0A0A`. Fonts: Times New Roman (body/headline), Courier New (year/counter), Arial (chrome only). See `docs/EARLY-WEB-BRIEF.md`.
- Adding a chapter: flip `live` in `manifest.ts`, add the `#chapter-<id>` scene + `.chapter-scroll-spacer` in `index.html` (spacer order MUST match manifest order — drift-guarded), add content to `chapters.ts`, register the chapter module in `main.ts` BEFORE `initRouter()`.

## Dev server (WSL2)

```bash
kill $(lsof -ti:3000) && npm run dev -- --host &
```

Vite's module cache goes stale in WSL2. Always kill + restart after file edits.
