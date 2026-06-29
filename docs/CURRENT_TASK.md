# Current Task

**Phase:** Phase 1 — Week 2
**Status:** In progress

## Active Work

ARPANET chapter — completing Week 2 artifacts:

1. **DONE** — `terminal.ts` typing scheduler: boot sequence, scroll-triggered facts, fast-forward on scroll, cursor blink
2. **DONE** — `network-map.ts`: SVG node diagram (SRI/UTAH/UCLA/UCSB), draw-in animation, fade-in on chapter activate
3. **NEXT** — Figma Era card restack: full A/B/C card swap at 1/3 and 2/3 scroll progress

## What Was Just Done

Built `ArpanetTerminal` class (`src/chapters/arpanet/terminal.ts`):
- Queued typing at 80ms/char (boot), 60ms (headlines), 20ms (body)
- `fastForward()` cancels all pending timeouts + flushes queue instantly on scroll
- 8 facts revealed at 12.5% scroll intervals across the ARPANET chapter
- Terminal container auto-scrolls to latest line

Verified in browser: boot sequence types correctly, facts reveal on scroll, fast-forward works, no console errors.

## Deferred

- Keystroke sounds (Tone.js) → Week 4 with audio crossfade
- Audio unlock / iOS fallback → Week 4
