# AI Context

Last updated: 2026-08-03

The mental model an agent needs before touching Chronicle. `HANDOFF.md` is the
current-state snapshot (what exists, who owns what, what not to break).
**This file is the *why*** — how the four systems work, which decisions are load-bearing,
and where the sharp edges are. Read both. Read this one first if you're new.

---

## What Chronicle is

A scroll-driven museum of web design history. Eight eras planned, three live
(ARPANET 1969–82, Early Web 1983–94, Figma Era 2019–23). You scroll through a chapter;
at the end, the chapter itself *becomes* the transition into the next era — a CRT powers
off, glass shatters. The transitions are the product, not decoration. That framing drives
most of the architecture below: everything is built so a transition can be a real
full-screen GPU effect between two live DOM chapters without stutter.

## Stack

Vanilla TypeScript + Vite. GSAP ScrollTrigger for scroll. WebGL 2 for transition shaders
only. html2canvas to turn DOM into shader textures. Tone.js for synthesized ambient audio.
No framework, no state library, no CSS framework — chapters are hand-authored period
pieces, and a component abstraction would fight that rather than help it.

**Test layers, deliberately split:**
- **Vitest** (`npm run test:unit`) owns `tests/unit/*.test.ts` — pure logic, node env, no
  jsdom. Manifest derivation, DOM-order drift guard, `createChapter` wiring.
- **Playwright** (`npm test`) owns `tests/*.spec.ts` — real browser: DOM, transitions,
  shader compilation, deep-links, visual snapshots.
- `playwright.config.ts` pins `testMatch` **on purpose**. Playwright's default pattern
  grabs `*.test.ts` and then errors on Vitest internals. Don't unpin it.

---

## System 1 — Chapter identity and ordering

`src/data/manifest.ts` is the single source of truth for **which chapters exist and in
what order**. Everything derives from `MANIFEST.filter(c => c.live)`:

- the hash router's valid-hash set (`validChapterIds()`),
- the scroll engine's chapter order (`chapterOrder()`),
- the lobby's era grid.

Before Phase 2 these were three hand-maintained lists that could silently disagree. The
one failure mode this can't catch by itself is the DOM: `index.html`'s
`.chapter-scroll-spacer` order must match manifest order, so
`tests/unit/manifest.test.ts` asserts that explicitly. That test is a real guard, not
ceremony — if it fails, chapters transition into the wrong neighbor.

**Scope discipline:** `manifest.ts` holds identity + ordering only. `chapters.ts` holds
content (facts, palette, fonts), keyed by the same id, **only for live chapters**. Don't
put facts in the manifest; don't put placeholder chapters in `chapters.ts`. This split
was contested during planning (Codex T1) and settled deliberately: the roadmap has 8
entries, the content model has 3, and folding them together pollutes both.

**Adding a chapter:** flip `live` → add the `#chapter-<id>` scene + spacer in
`index.html` (order must match) → add content to `chapters.ts` → author the module with
`createChapter` → register it in `main.ts` **before** `initRouter()`.

---

## System 2 — The chapter lifecycle

Two files: `engine/chapter.ts` (the manager) and `engine/create-chapter.ts` (the scaffold).

**`chapterManager`** owns the DOM swap model. Every chapter scene is `position: fixed`,
full viewport. Inactive chapters sit at `translateX(-100vw)`; the active one is at
`translateX(0)`. Exactly one is active.

> **`display: none` is forbidden here.** It removes the element from layout, which breaks
> the `IntersectionObserver` that drives lazy init and makes html2canvas capture an empty
> box. This is the single most important invariant in the codebase.

The manager also owns **lazy init**: a chapter's expensive setup runs once, on first
activation or when it comes within a viewport of the scroll position — whichever happens
first. `activate()` triggers init immediately rather than waiting for intersection, so
deep-linking straight to a chapter doesn't render an empty scene.

**`createChapter`** (Phase 2 T10) is the scaffold every chapter is built on. It was
extracted only after three real chapters existed — rule of three. Two would have frozen
the wrong abstraction, since ARPANET and Early Web are both text-reveal chapters and
Figma Era (GSAP card choreography) is the one that proves what actually varies.

```ts
createChapter({ id, render, onMount?, onInit?, onProgress?, onDwellEnter?, ambient? })
```

Lifecycle:

| Phase | When | What belongs here |
|---|---|---|
| `render(ctx) → string` | mount | The template. Keep it pure — no DOM reads, no side effects. |
| `onMount(ctx)` | mount, same tick | Static listeners, one-time DOM setup (e.g. ARPANET's SVG filter). |
| ambient | **lazy** — first activate/intersect | `startChapterAmbient(id)`, unless `ambient: false`. |
| `onInit(ctx)` | lazy, right after ambient | Build elements, start animations, wire per-chapter state. |
| `onProgress(p, ctx)` | lazy — subscribed *after* `onInit` | Per-tick scroll response, `p` normalized 0–1. |
| `onDwellEnter(ctx)` | wired at **mount** | Progress-indicator pulse at the dwell zone. |

Two ordering choices are load-bearing, and both mirror what all three chapters were
already doing by hand:

- **Progress subscribes inside the init callback**, not at mount, because every progress
  handler assumes `onInit` already built the elements it mutates.
- **`dwell-enter` is wired at mount**, because the transition engine can dispatch it
  against a chapter whose init hasn't run yet.

The scaffold owns `getChapter`, the template write, `chapterManager.register`,
`startChapterAmbient`, `onChapterProgress`, and the `dwell-enter` listener. **A chapter
module must not call those directly** — bypassing the scaffold is exactly how the three
Phase 1 chapters drifted apart. A chapter marked `live` with no content record throws a
named error at mount rather than failing deep inside `render`.

---

## System 3 — Scroll, dwell, and the transition pipeline

### Scroll

Each chapter has an invisible **200.4vh spacer** in document flow; the visible scene is
fixed. GSAP ScrollTrigger watches the spacer. That odd `.4` is the mechanism: the last
0.4vh is the **dwell zone**.

```
progress 0 ─────────── chapter scroll ─────────── 0.998 ──┤ dwell ├── 1.0
                                                      capture starts   transition fires
```

`onChapterProgress(id, cb)` delivers 0–1 **normalized to exclude the dwell zone**, so a
chapter's own animation finishes before the dwell beat starts. At `progress ≥ 0.998`,
dwell entry fires: html2canvas capture begins and the era's progress indicator pulses. At
`progress = 1`, the transition request fires.

Capture starting at dwell entry rather than at the transition moment is what buys the
~500ms head start that keeps the shader from stuttering on its first frame.

### The nav latch (router ↔ scroll ownership)

The subtlest thing in the codebase. During hash navigation, **the router owns the active
chapter until the user genuinely scrolls.** `beginNavLatch()` sets a latch released only
by a real gesture — `wheel`, `touchstart`, or `keydown` — never a timer.

This replaced a fixed 200ms suppression window that was a race. GSAP's settle time
depends on layout and asset timing, so on a slow or cold load its reconciliation
callbacks fired *after* the window closed, `onEnter` called `activate()` on the previous
chapter, and a deep-link to `#figma-era` landed on ARPANET. Fast loads won the race and
hid the bug.

**Consequence to remember when writing tests:** a *programmatic* `scrollTo` never drives
a transition. Only real user scrolling does. A Playwright test that scrolls
programmatically and expects a shader will fail correctly.

`initScrollEngine()` must run **after** `initRouter()`. If the scroll engine builds
triggers while spacers are still in a hidden container, GSAP computes every position as 0
and then spuriously fires `onLeaveBack` and transition requests on the first layout
recalculation. `main.ts` documents this ordering; don't reorder it.

### Transition

`engine/transition.ts` orchestrates:

1. Dwell entry → `html2canvas` captures the `from` chapter.
2. Dwell exit → lock scroll, bring `to` on-screen `visibility: hidden` so it can be
   captured in its real rendered state, capture it too.
3. `Promise.race([Promise.all([from, to]), 500ms])` — gate on **both** textures. A
   null texture renders a black screen, so the gate is a correctness requirement, not an
   optimization. Timeout or failure falls back to `fadeSwap`.
4. Upload both as GL textures, schedule the audio crossfade via `Tone.now()`, then run
   the shader in a rAF loop over the transition's duration.
5. Swap chapters, reset the canvas, unlock scroll.

**Fallback paths all land on `fadeSwap`** (150ms fade to black, swap, 150ms out):
touch devices, `prefers-reduced-motion`, capture timeout, capture failure, a shader that
isn't compiled, and a browser with no WebGL2 at all. Without the shader-missing guard a
missing shader held the scroll lock for the full duration on a blank canvas.

### WebGL

`engine/webgl.ts` holds **one** WebGL2 context for the life of the page, so compiled
programs stay valid. The canvas is **1×1px at rest** and resizes to fullscreen only
during a transition — a persistent fullscreen canvas costs compositing on every frame of
normal scrolling.

The vertex shader takes no VBO: it derives a full-screen triangle from `gl_VertexID`.
Shaders precompile during `requestIdleCallback`, using `KHR_parallel_shader_compile` to
poll for completion when available, so the first transition doesn't pay compile cost.

Uniform contract every transition shader gets: `uFrom`, `uTo` (sampler2D),
`uProgress` (0–1), `uResolution` (device px). A shader that doesn't declare one gets a
null location, and setting a null uniform is a GL no-op — so the contract is uniform
without forcing every shader to declare everything.

**The engine never throws.** It's constructed eagerly at module scope and `main.ts`
imports it, so a constructor throw happens during module *evaluation* and takes down the
whole module graph — a blank page, not a degraded one. When WebGL2 is absent (Safari < 15,
WebGL disabled, blocklisted GPUs, VMs and remote desktops), `webgl.supported` goes false,
every GL method no-ops, `precompileAll` leaves the shader map empty, and transitions route
to `fadeSwap`. `getContext` itself is wrapped in try/catch, not just null-checked, because
hardened and privacy-patched browsers throw from the probe rather than returning null.

**Shaders must be authored source-agnostic.** `glass-shatter` samples only
`uFrom`/`uTo`/`uResolution` and makes no assumption about which chapter it's bridging.
It currently debuts as a temporary `early-web → figma-era` bridge; its canonical home is
`flat → figma-era`. Because it's source-agnostic, that relocation is a one-line key change
in `transitions.ts` with no shader edit. Phase 1 used the same temp-bridge pattern for CRT.

### Transitions are relationships

`data/transitions.ts` keys on `'fromId->toId'`, not on a chapter property. A transition
belongs to the *pair*, not to either chapter — which is what lets a shader be relocated
without touching a chapter, and what makes an unmapped pair a clean no-op rather than an
error.

---

## System 4 — Audio

`engine/audio.ts`. Everything is **synthesized** — no audio files. ARPANET is brown noise
through a 180 Hz lowpass at −30 dB (machine-room hum, felt not heard). Figma Era is a
C3+G3 perfect fifth at −32 dB. Keystrokes are a ~22 ms pink-noise burst through an
1800 Hz lowpass at −26 dB with 50–100% velocity variation, so rapid typing doesn't read
as machine-gun uniformity.

**All scheduling goes through `Tone.now()`. No per-frame audio callbacks** — that's a
hard project constraint, because per-frame audio work competes with the shader for the
main thread exactly when the shader can least afford it.

Web Audio requires a gesture, so Tone.js is **dynamically imported on the first
`click`/`touchstart`**, not at boot. The lobby card tap needed to enter any chapter
supplies that gesture naturally. A synchronous `unlocking` guard prevents a rapid
click+touchstart pair from double-importing.

A chapter with no ambient bed authored yet still calls `startChapterAmbient` — it's a
no-op today, and keeping the call uniform means the bed lands for free when written.

---

## Bundle shape (don't regress this)

Entry chunk is GSAP + app code, ~64 KB gzip — what's needed at first paint. **Tone.js and
html2canvas are dynamic `import()`s**, each its own async chunk:

- Tone loads on first gesture (audio can't start before one anyway).
- html2canvas is idle-preloaded via `requestIdleCallback` in `initTransitionEngine`, so
  it's warm long before any capture without blocking paint.
- Both use `import type` for their types so the types cost nothing at runtime.
- `share-card.ts` reuses `loadHtml2canvas()` exported from `transition.ts` rather than
  importing html2canvas itself — one shared cached chunk, not two copies.

Converting either back to a static import re-inflates cold paint from ~64 KB to ~167 KB
gzip. This has been measured; don't undo it.

---

## Sharp edges

- **`IntersectionObserver` rootMargin must use `px` or `%`.** A `vh` value throws a
  silent SyntaxError that kills the entire module graph — blank page, no obvious cause.
- **html2canvas cannot resolve SVG filter URL references** (`filter: url(#phosphor-glow)`).
  Capture strips the inline filter and restores it after. It also can't capture WebGL or
  `backdrop-filter`, which is why the share card is a purpose-built off-screen node rather
  than a live screenshot, and why ARPANET's share glow uses `text-shadow` instead of the
  SVG filter.
- **Cluster visibility is a `.is-ready` class toggle, never a fill-mode keyframe.** A
  `@keyframes … both` fill pins `opacity` above normal declarations and defeats
  `.is-hidden`, leaving the UI cluster stuck visible on the lobby.
- **Era palettes are locked, not suggestions.** Figma accent `#00D4FF` (never purple/
  indigo). Early Web is 216-web-safe only. ARPANET is `#000000`/`#FF9500`. Each era has a
  brief in `docs/*-BRIEF.md` — read it before touching that chapter's CSS.
- **WSL2 dev loop:** `kill $(lsof -ti:3000) && npm run dev -- --host`. Vite's module cache
  goes stale; restart after edits. A node + `@playwright/test` screenshot script must live
  **inside the repo**, not a scratchpad dir, or the import can't resolve `node_modules`.
- **WSL2 headless has no GPU path**, so shader frame-rate profiling can only be done in
  headed Chrome on the host. That's why `SHADER-PROFILES.md` carries pending-verify notes.
- **`--update-snapshots` won't rewrite a baseline that already passes** under
  `maxDiffPixelRatio` (0.02). `rm` the PNG first to force a true regen.

---

## Decision log (the ones with teeth)

| Decision | Why it's this way |
|---|---|
| DOM swap via `translateX`, not `display:none` | Keeps chapters in layout for IntersectionObserver + html2canvas |
| One persistent WebGL context, 1×1 at rest | Programs stay valid across transitions; no idle compositing cost |
| WebGL engine degrades, never throws | It's constructed at module-eval time — a throw there is a blank site, not a lost effect |
| Gate shader on **both** textures | A null texture is a black screen, not a degraded effect |
| Nav latch released by gesture, not timer | Timers race GSAP's network-variable settle time |
| Transitions keyed on `from->to` pairs | A transition is a relationship; enables shader relocation |
| Shaders authored source-agnostic | Temp bridges relocate as a registry key change, no shader edit |
| Manifest = identity/order, chapters.ts = content | 8 roadmap entries vs 3 content records; merging pollutes both |
| `createChapter` extracted at three examples | Rule of three — two would have frozen a text-reveal-shaped abstraction |
| Tone + html2canvas dynamically imported | Keeps cold paint at ~64 KB instead of ~167 KB gzip |
| Audio scheduled via `Tone.now()` only | Per-frame audio competes with the shader for the main thread |

---

## Where to look next

- `PHASES.md` — the roadmap and what's checked off.
- `docs/CURRENT_TASK.md` — what's actively in flight right now.
- `docs/HANDOFF.md` — current-state architecture, ownership table, invariants.
- `docs/ENGINEERING_LOG.md` — dated record of every change and its reasoning.
- `docs/PHASE2-EARLY-WEB-PLAN.md` — the locked plan for the current phase slice.
- `docs/*-BRIEF.md` — per-era visual specs. Authoritative for that chapter's design.
- `docs/SHADER-PROFILES.md` — shader cost analysis and 60fps verification status.
