# Current Task

**Phase:** Phase 1 — shipped
**Status:** Deployed to Vercel (https://chronicle-topaz-ten.vercel.app/). Fixed intermittent deep-link bug (`#figma-era` showed ARPANET — nav-latch race) and code-split the bundle (Tone + html2canvas lazy; initial JS 167→59 KB gzip). ARPANET content accuracy pass done 2026-07-08 (TODO-004). Both Phase 1 STRETCH goals shipped 2026-07-08: code overlay (`?` view-source panel) + share card (`s`, branded 1200×630, Web Share/clipboard/download). New `src/ui/` layer — see ENGINEERING_LOG + HANDOFF. Next: cross-browser smoke test on real devices (needs hardware).

**Known issue:** `tests/visual.spec.ts` "ARPANET idle" snapshot now fails on environmental anti-aliasing drift (fails on clean tree too — not tied to any code change). Needs baseline regen in a stable CI env or a `maxDiffPixelRatio` threshold. Do NOT trust this snapshot for phosphor/CRT/content regressions (verify by eye).

## Week 4 In Progress

1. **DONE** — Backwards navigation (`src/engine/scroll.ts`):
   - `fireBackwardsNav` fixed: scroll target now 85% through previous chapter (not 0%)
   - Double-fire guard (`backwardsNavInFlight`) prevents ScrollTrigger recursion during instant `scrollTo`
   - `dwellFiredMap` refactor: dwell state is now resettable; `resetDwellState(toId)` called on backwards nav so next forward pass re-triggers dwell capture correctly

2. **DONE** — Audio: Tone.js ambient + CRT crossfade (`src/engine/audio.ts`):
   - ARPANET: brown noise → 180Hz LPF → −30dB (machine room hum; deepened 2026-07-07 audio pass, was 280Hz/−24dB)
   - Figma Era: C3+G3 sine oscillators → −32dB (near-silent perfect-fifth drone)
   - CRT crossfade: all scheduled via `Tone.now()` at transition start — no per-frame callbacks
   - Web Audio unlock: `Tone.start()` on first `click`/`touchstart`; lobby card tap provides gesture
   - Backwards nav crossfade: `stopChapterAmbient(from)` + `startChapterAmbient(to)` in `fireBackwardsNav`

3. **DONE** — Keystroke sounds:
   - `Tone.NoiseSynth` pink-noise burst (~22ms envelope) → 1800Hz LPF (Q 1.2) → −26dB per character typed (warmed 2026-07-07 audio pass, was white noise / −30dB / no filter — read as harsh digital static)
   - Velocity variation 50–100% prevents machine-gun uniformity of rapid-fire clicks
   - Fast-forward flushes without calling `typeChar` — no clicks during skip

4. **DONE** — Playwright visual regression baselines (lobby, ARPANET idle, Figma Era idle):
   - `playwright.config.ts` + `tests/visual.spec.ts` + 3 baseline PNGs written
   - Fixed GSAP init-order bug (see ENGINEERING_LOG.md 2026-06-30) — initRouter before initScrollEngine
   - All 3 tests pass: 3/3 (7.3s)

5. **PENDING (manual)** — Chrome DevTools GPU profiling (headed browser):
   - Open `http://localhost:3000/#arpanet`, record Performance during CRT transition
   - Verify 60fps, document in `docs/SHADER-PROFILES.md`

## Deferred

- TODO-005: **DONE** — phosphor glow. Real issue was an inverted `feMerge` order (blur composited over sharp text → all-over blur, not a halo). Fixed by putting `glow` under `SourceGraphic`; σ=2. No sigma spike needed. See ENGINEERING_LOG 2026-07-07 authenticity polish.
- TODO-004: **DONE** — ARPANET content quality pass. Fixed 4 factual errors (phosphor types P4/P12→P1/P3, baud 300≈30 cps not 10, VT100 cell 7×9 dot matrix, PARC ~a few miles). See ENGINEERING_LOG 2026-07-08.
- Lobby visual polish (currently stub)
