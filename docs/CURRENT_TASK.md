# Current Task

**Phase:** Phase 1 — shipped
**Status:** Deployed to Vercel (https://chronicle-topaz-ten.vercel.app/). Fixed intermittent deep-link bug where `#figma-era` showed ARPANET (nav-latch race — see ENGINEERING_LOG 2026-07-07). Next: live-verify the fix on Vercel, then cross-browser smoke on real devices.

## Week 4 In Progress

1. **DONE** — Backwards navigation (`src/engine/scroll.ts`):
   - `fireBackwardsNav` fixed: scroll target now 85% through previous chapter (not 0%)
   - Double-fire guard (`backwardsNavInFlight`) prevents ScrollTrigger recursion during instant `scrollTo`
   - `dwellFiredMap` refactor: dwell state is now resettable; `resetDwellState(toId)` called on backwards nav so next forward pass re-triggers dwell capture correctly

2. **DONE** — Audio: Tone.js ambient + CRT crossfade (`src/engine/audio.ts`):
   - ARPANET: brown noise → 280Hz LPF → −24dB (machine room hum)
   - Figma Era: C3+G3 sine oscillators → −32dB (near-silent perfect-fifth drone)
   - CRT crossfade: all scheduled via `Tone.now()` at transition start — no per-frame callbacks
   - Web Audio unlock: `Tone.start()` on first `click`/`touchstart`; lobby card tap provides gesture
   - Backwards nav crossfade: `stopChapterAmbient(from)` + `startChapterAmbient(to)` in `fireBackwardsNav`

3. **DONE** — Keystroke sounds:
   - `Tone.NoiseSynth` white noise burst (~26ms envelope) per character typed
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

- TODO-005: phosphor glow sigma spike (σ=2, σ=3, σ=6 vs ThinkPad X61 BBS reference)
- Lobby visual polish (currently stub)
