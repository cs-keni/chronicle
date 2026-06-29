# Current Task

**Phase:** Phase 1 — Week 3 (html2canvas spike complete)
**Status:** Week 3 core work done — manual GPU profiling pending

## Week 3 Complete (automated)

1. **DONE** — html2canvas integration spike (TODO-001):
   - SVG filter fix: `el.style.filter = 'none'` during capture, restore after
   - Timing measured: ARPANET 364ms, Figma Era 167ms
   - Gate at transition: 167ms (ARPANET already resolved from dwell entry)
   - Transition fires, chapter swap correct, no errors
   - Results in `docs/SHADER-PROFILES.md`

2. **DONE** — `transitionInFlight` bug fixed (could double-fire fadeSwap on touch)

3. **PENDING (manual)** — Chrome DevTools GPU profiling in headed browser:
   - Open `http://localhost:3000/#arpanet` in headed Chrome
   - Record Performance during ARPANET → Figma Era transition
   - Verify 60fps, document dropped frames
   - Update `docs/SHADER-PROFILES.md` with headed baseline

## Next Up — Week 4

- Backwards navigation: reverse scroll → 0.15s fade-to-black → swap → fade-from-black
- Audio: Tone.js crossfade during CRT transition (ARPANET ambient → Figma Era ambient)
- Audio unlock + iOS tap fallback (Web Audio API requires user gesture)
- Keystroke sounds for ARPANET terminal (Tone.js Synth)
- Playwright visual regression baselines (lobby, ARPANET idle, Figma Era idle)
- Touch device smoke test: does fadeSwap path work correctly?

## Deferred

- TODO-005: phosphor glow sigma spike (σ=2, σ=3, σ=6 vs ThinkPad X61 BBS reference)
- Lobby visual polish (currently stub)
- CRT shader GPU profiling in headed browser (requires manual step)
