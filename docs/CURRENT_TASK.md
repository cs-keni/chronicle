# Current Task

**Phase:** Phase 1 — Week 4
**Status:** Backwards navigation complete — audio crossfade up next

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

3. **PENDING** — Keystroke sounds: Tone.js Synth per ARPANET terminal character
   - ARPANET ambient fades out over first 1s of transition
   - Figma Era fades in at 60% of transition (hook already stubbed in `transition.ts`)
   - Web Audio unlock + iOS tap fallback required first

3. **PENDING** — Keystroke sounds: Tone.js Synth per ARPANET terminal character

4. **PENDING** — Playwright visual regression baselines (lobby, ARPANET idle, Figma Era idle)

5. **PENDING (manual)** — Chrome DevTools GPU profiling (headed browser):
   - Open `http://localhost:3000/#arpanet`, record Performance during CRT transition
   - Verify 60fps, document in `docs/SHADER-PROFILES.md`

## Deferred

- TODO-005: phosphor glow sigma spike (σ=2, σ=3, σ=6 vs ThinkPad X61 BBS reference)
- Lobby visual polish (currently stub)
