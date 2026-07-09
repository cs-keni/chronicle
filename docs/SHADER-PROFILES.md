# Shader Profiles

Performance baselines for Chronicle's WebGL transition shaders.

All timings measured on Chromium headless (Playwright) in WSL2 on a Windows dev machine.
Production target: Chrome + Firefox on M3 MacBook Pro and Windows i7. Headless timings
skew higher than production (software GL path, no GPU acceleration in most headless envs).

---

## CRT Power-Off (`crt-power-off`)

**Canonical use:** ARPANET → Figma Era (Phase 1 temporary; moves to ARPANET → Early Web in Phase 2)

**Duration:** 2500ms

**Phases:**
| Phase | Progress | Visual |
|---|---|---|
| Compress | 0.0–0.4 | ARPANET squishes vertically to thin white line (smoothstep ease) |
| Hold | 0.4–0.6 | White horizontal line, full width |
| Expand | 0.6–1.0 | White line expands to reveal Figma Era (smoothstep ease) |

### html2canvas Capture Times (TODO-001 spike — 2026-06-28)

| Capture | DOM complexity | Time | Notes |
|---|---|---|---|
| ARPANET (from) | Complex: terminal text ~90 lines, SVG network map, scanlines + vignette CSS pseudo-elements | **364ms** | Fires at dwell entry (~500ms before transition) |
| Figma Era (to) | Minimal: cards container (no cards yet), pip dots, end state div | **167ms** | Fires at transition time |

**Gate timing:** `Promise.all([captureFrom, captureTo])` resolves in ~167ms at transition time (ARPANET capture was already resolved from dwell entry). Shader starts 167ms after dwell exit.

**Main-thread block:** 364ms (ARPANET capture at dwell entry). This is the blocking event — the user sees cursor blink pause for ~364ms when entering the dwell zone. Well within the 500ms abort timeout.

**Target vs actual:** PHASES.md specifies < 16ms. Actual: 364ms. This is a known html2canvas limitation — it processes the full DOM synchronously. The impact is acceptable because:
1. The block fires at dwell *entry* (when user has ~0.002 * 200.4vh ≈ 3px left to scroll), not at the visible transition moment
2. The terminal is fast-forwarded at 99.8% progress, so no typing animation is interrupted
3. The pulsing progress indicator covers the 364ms pause visually
4. 364ms < 500ms abort timeout; we never fall back to fadeSwap on a capable machine

**Resolution:** Accept. Capture at dwell entry (not dwell exit) is the correct timing choice. If the block becomes user-visible on weaker hardware, options are: reduce `scale` from `Math.min(dpr, 2)` to `1`, or capture at 80% progress instead of dwell.

### SVG Filter Handling

ARPANET chapter has `filter: url(#phosphor-glow)` which html2canvas cannot resolve. Fixed in `captureChapter()` by temporarily setting `el.style.filter = 'none'` before capture and restoring after. No visual artifact — the capture happens off-screen conceptually (at dwell entry, while ARPANET is still visible), and the captured texture is used during the compress phase where the CRT effect already dominates over fine glow detail.

### WebGL Verification

Shader compilation: verified via `webgl.precompileAll()` at idle startup.

Runtime GL messages (headless only):
```
GL Driver Message (OpenGL, Performance): GPU stall due to ReadPixels
```
These appear during `uploadTexture()` calls in headless Chromium's software GL path. They do not appear in production (hardware-accelerated GPU). Safe to ignore.

### Full Transition Timing (headless baseline)

```
t=0ms      Dwell entry fires → ARPANET capture starts
t=364ms    ARPANET capture complete (364ms block)
t=500ms    User has exhausted dwell zone → transition fires
t=500ms    Figma Era capture starts
t=667ms    Figma Era capture complete (167ms block)
t=667ms    Both textures uploaded → CRT shader starts
t=3167ms   CRT shader ends (2500ms duration)
t=3167ms   chapterManager.activate('figma-era')
t=3167ms   Figma Era boot animation plays (600ms)
t=3767ms   Figma Era fully initialized
```

Note: `t=500ms` dwell-to-transition gap is an example. In practice the user controls this by scrolling speed. The 500ms abort timeout means the captures MUST complete before the user exhausts the dwell zone by more than 500ms.

### Frame Profiling (TODO — manual step)

Manual GPU profiling with Chrome DevTools → Performance → Record during a live transition has NOT been done yet. Required before Phase 1 ship:
- Open `http://localhost:3000/#arpanet` in Chrome (not headless)
- Start Performance recording
- Scroll through ARPANET chapter to dwell zone → transition fires
- Stop recording; check frame timeline for drops
- Target: 60fps throughout shader (0 dropped frames on M3)
- Document baseline here

---

## Glass-Shatter (`glass-shatter`)

**Canonical use:** Flat → Figma Era (PHASES:197). **Debuts** (Phase 2 Slice 1) as a
TEMPORARY Early Web → Figma Era bridge until Flat exists — the same temp-assignment
pattern CRT used in Phase 1. Authored strictly source-agnostic (samples only
`uFrom`/`uTo`/`uResolution`), so the later move to `flat→figma-era` is a
transition-registry key change with no shader edit.

**Duration:** 2000ms

**Effect:** `uFrom` cracks into ~11-across voronoi shards that break loose on a
staggered delay, slide away under gravity, and fade — revealing `uTo` beneath. A
bright crack highlight runs the shard borders as they separate.

### Cost characteristics (analytical — the 60fps gate rests on these)

| Property | Value | Why it matters |
|---|---|---|
| Voronoi neighbor search | **fixed 3×3 = 9 taps**, no dynamic loop length | Bounded ALU per fragment; the dominant cost, and it's constant |
| Texture fetches | 2 (`uFrom` displaced, `uTo`) | Same as CRT; no dependent-texture chains |
| Transcendental use | `hash2` sin per neighbor (9), one `normalize`, `smoothstep`s | Modest; no loops over transcendentals |
| Branching | none data-dependent beyond the F1/F2 compare | No divergent flow across a warp |
| `uResolution` use | aspect-correct the cell grid only | Square shards regardless of viewport AR |

The shader is a single full-screen triangle (no VBO) on the existing `webgl.ts`
pipeline — identical draw path to CRT, whose runtime the Phase 1 baseline already
found frame-cheap (the html2canvas capture, not the shader, was the block). The
bounded voronoi keeps per-fragment work constant, so there is no input that makes
this shader's frame cost spike.

### Missing-shader guard (fold #4)

If `glass-shatter` fails to compile (or hasn't finished the idle precompile),
`transition.ts` now checks `webgl.getShader()` and skips straight to `fadeSwap`
instead of holding the scroll lock for the full 2000ms on a blank canvas.
Covered by the Playwright fallback assertion.

### Frame Profiling (TODO — manual step, same as CRT)

Live headed GPU profiling (Chrome DevTools → Performance) during the
`early-web → figma-era` transition has NOT been run in this environment (WSL2
headless has no GPU path, so its numbers wouldn't be representative). Required as
the 60fps verify before this ships to production:
- Open `http://localhost:3000/#early-web` in headed Chrome
- Record Performance, scroll to the dwell zone → glass-shatter fires
- Target: 60fps throughout (0 dropped frames on M3); document the baseline here
- If any drop: lower `DENSITY` in `glass-shatter.frag` (fewer, larger shards) —
  the cheapest lever, no structural change

---

## Planned Shaders (Phase 2)

| Shader | Transition | Status |
|---|---|---|
| `crt-power-off` | ARPANET → Early Web (canonical) | **Live** — moved from Phase 1 temp |
| `glass-shatter` | Early Web → Figma Era (temp) → Flat → Figma Era (canonical) | **Live** — debuts as temp bridge |
| `windows-dialog` | Early Web → Browser Wars | Not started |
| `bsod-wipe` | Browser Wars → Post-Crash | Not started |
| `phone-unlock` | Post-Crash → Mobile | Not started |
| `texture-strip` | Mobile → Flat | Not started |
| TBD | Figma Era → AI Web | Not specified |
