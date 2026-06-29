# Current Task

**Phase:** Phase 1 — Week 3
**Status:** Week 2 complete — ready for Week 3

## Week 2 Complete

All three Week 2 deliverables are done and committed:

1. **DONE** — `terminal.ts`: ARPANET typing scheduler, boot sequence, fast-forward on scroll, scroll-triggered facts
2. **DONE** — `network-map.ts`: SVG topology diagram (Dec 1969 BBN), stroke-dashoffset draw-in animation
3. **DONE** — Figma Era card restack: GSAP-driven A/B/C/D swap at 33% scroll progress; scroll height fix for last chapter

## Next Up — Week 3

html2canvas integration spike (TODO-001):
- Validate CSS filter capture (ARPANET phosphor glow SVG filter must survive capture)
- Verify main-thread block time < 16ms
- Gate: if block > 16ms, need offscreen canvas workaround or accept one dropped frame

CRT transition end-to-end verification:
- Full ARPANET → Figma Era flow at 60fps
- Chrome DevTools Performance recording
- Document baseline frame time in `docs/SHADER-PROFILES.md`

## Deferred

- Keystroke sounds (Tone.js) → Week 4 with audio crossfade
- Audio unlock / iOS fallback → Week 4
- Backwards navigation → Week 4
- Playwright visual regression baselines → Week 4
- TODO-005: phosphor glow SVG filter sigma spike (σ=2, σ=3, σ=6 comparison)
