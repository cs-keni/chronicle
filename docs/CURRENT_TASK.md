# Current Task

**Phase:** Phase 2 Slice 2 (Browser Wars) — **PLAN + DESIGN BOTH LOCKED**, implementation not started. Plan: `docs/PHASE2-BROWSER-WARS-PLAN.md`. Design brief: `docs/BROWSER-WARS-BRIEF.md` (**build T6 against the brief, not the plan's prose**). Mockup: `claude.ai/code/artifact/c060c5e0-f3df-4768-97ab-77aefc932cb2`. Reviewed via `/plan-ceo-review` (SELECTIVE EXPANSION, 5 of 6 accepted), Codex outside voice (12 findings, all applied), `/plan-eng-review` (5 findings, all folded), and `/plan-design-review` 2026-08-04 (4/10 → 9/10, 18 decisions, T5 completed in-review).

**Next step: implement in 3 commits** — (1) T4 content + T9 assets + T9b Comic Relief self-host; (2) T1/T2/T2b/T2c/T3a/T3b engine; (3) T6+T7 atomic + T8/T10/T11/T11b/T12.

**Start with T9b.** It fixes a defect already live in `main`: `lobby/style.css:182` ships `'Comic Sans MS','Chalkboard SE',cursive`, and Chalkboard SE is macOS-only, so Linux/Android render the card (and would render the whole chapter) in the system default. Silent failure, no error anywhere.

**Three design decisions that reverse or widen the locked plan** — `[auto-decided]`, reversible on sight: D3.1's Netscape throbber is **reversed** to IE4's (an IE4 window cannot carry an N-comet; D3.1 and D3.3 were decided separately and collide); the palette gains `#00FFFF` to match the already-shipped lobby card; the visitor counter is **red** `#FF2400`, not Early Web's green.

**Phase 2 Slice 1 (Early Web):** code complete; one manual verify left
**Status:** Building per `docs/PHASE2-EARLY-WEB-PLAN.md`. **Commit 1 (T1–T3, `e5fe1bc`)** — manifest foundation. **Commit 2 (T4–T9, T11, T12) done 2026-07-09** — the Early Web chapter is LIVE. Chronicle now runs `ARPANET → (CRT) → Early Web → (glass-shatter) → Figma Era`. Full NCSA Mosaic/Netscape frame (web-safe palette, Times/Courier/Arial, dithered banner, hazard bar, green odometer hit-counter as the scroll indicator, Mosaic page-load arrival beat). glass-shatter shader authored source-agnostic; shader-missing→fadeSwap guard added; CRT relocated to its canonical slot; direct arpanet→figma removed. Code overlay + share card gained Early Web branches. Verified: tsc clean, vitest 7/7, build clean (entry 64.02 KB gzip), Playwright 14/14, headed screenshot confirms the frame. **Commit 3 (T10) done 2026-08-03** — `createChapter` extracted to `src/engine/create-chapter.ts`; all three chapters refactored onto it; 10 new Vitest cases. Verified: tsc clean, vitest 17/17, Playwright 14/14, build clean (entry 64.18 KB gzip). **Slice 1 is code complete.**

**Only remaining Slice 1 item — manual, needs headed Chrome (cannot run in WSL2 headless, no GPU path):** profile glass-shatter at 60fps. Open `#early-web`, DevTools Performance record through the `early-web → figma-era` transition, document the result in `docs/SHADER-PROFILES.md` (section + pending-verify note already written). Cheapest lever if frames drop: lower `DENSITY` in `src/shaders/glass-shatter.frag`.

**After Slice 1:** the remaining 5 Phase 2 chapters + their transitions are separate slices. Open TODOs: TODO-007 (generate chapter DOM from manifest — A1 option B, deferred by choice), TODO-008 (validate Early Web mobile horizontal-scroll on a real device — needs hardware).

**Closed 2026-08-03:** TODO-006 (WebGL2-absent hardening) — `webgl.ts` threw at module-evaluation time, which blanked the whole site on any browser without WebGL2. Now degrades via `webgl.supported` → `fadeSwap`; guarded by `tests/webgl-fallback.spec.ts`. `docs/AI_CONTEXT.md` created (was a carry-over gap since Phase 1).

**Phase 1:** shipped + deployed (https://chronicle-topaz-ten.vercel.app/). Lobby + ARPANET + Figma Era + CRT + code overlay + share card + share nudge. Chrome/Chromium verified; Safari/Firefox smoke test deferred out of Phase 1 scope per Kenny 2026-07-08.

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
