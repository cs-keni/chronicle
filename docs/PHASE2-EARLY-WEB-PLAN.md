# Phase 2 — Slice 1: Early Web chapter + foundation

**Status:** Plan locked via /plan-eng-review 2026-07-08 (Claude + Codex outside voice). Not yet implemented.
**Scope shape:** Foundation-first (chosen at Step 0 complexity gate).

Delivers the third chapter and lays the manifest/shader foundation. Codex's outside
voice reshaped four decisions — see "Locked decisions" and "Outside-voice folds".

---

## Goal

Add the Early Web chapter (1983–1994), relocate the CRT power-off transition to its
canonical `arpanet → early-web` home, and debut the glass-shatter shader as the
Figma Era entry transition — while collapsing the duplicated chapter-order sources
into a single derived manifest.

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| Step 0 | Slice shape | Foundation-first (manifest + Early Web + CRT relocate + glass-shatter debut) |
| A1 | Manifest source | **Promote the lobby's 8-entry roadmap to `src/data/manifest.ts`** (id/eraName/years/cssClass/live/order); derive `VALID_CHAPTERS` + `CHAPTER_ORDER` from its live subset. `chapters.ts` stays content-only (facts/palette) for live chapters, keyed by id. *(Revised per Codex T1 — chapters.ts has content for only 2 chapters; folding all 8 in would pollute the content model.)* |
| A2 | Shatter aspect ratio | Add a `uResolution` uniform to `webgl.ts` (benefits all 7 Phase 2 shaders) |
| CQ1 | DRY scaffold | Build Early Web on the existing pattern first, **then extract `createChapter` from all three** real examples. *(Revised per Codex T2 — extracting from 2 examples is rule-of-two and risks freezing the wrong abstraction.)* |
| CQ2 | Early Web readiness | Write `docs/EARLY-WEB-BRIEF.md` + `docs/EARLY-WEB-CONTENT.md` (hex palette + fact-rendering pattern + facts) BEFORE code |
| Test | Test layers | **Add Vitest** for pure-logic units (manifest derivation, drift guard, createChapter); keep Playwright for DOM/transition/shader-in-browser. *(Per Codex T3 — repo has only Playwright today.)* |
| Test | Visual strategy | DOM/behavior tests + add `maxDiffPixelRatio` (~0.02) to `playwright.config.ts`, then a reliable early-web idle baseline |
| Perf | glass-shatter | **Profile in-slice** — 60fps gate documented in SHADER-PROFILES.md is a verify condition on the shader task. *(Per Codex T4 — capture already exceeds 16ms; don't ship an unprofiled full-screen voronoi.)* |

### Glass-shatter sequencing (temp bridge, source-agnostic)

Glass-shatter's canonical home is `flat → figma-era` (PHASES:197), but Flat/Material
doesn't exist yet. It debuts as a **temporary** `early-web → figma-era` bridge — the
same pattern Phase 1 used for CRT (`arpanet → figma-era` temp). **Authored strictly
source-agnostic** (samples `uFrom`/`uTo`, no Flat-specific assumptions) so relocating
to `flat → figma-era` later is genuinely just a registry-key move (Codex T5 caution
accepted as a design constraint, not a deferral).

```
Phase 1 (shipped):   ARPANET ──crt──▶ Figma Era
This slice:          ARPANET ──crt──▶ Early Web ──glass-shatter(temp)──▶ Figma Era
Later Phase 2:       ARPANET ──crt──▶ Early Web ──…──▶ … ──▶ Flat ──glass-shatter──▶ Figma Era
```

### Outside-voice folds (accepted Codex gaps, no tension)

- **main.ts wiring** is a required step of the Early Web task (import `initEarlyWeb`,
  grab `#chapter-early-web`, register before `initRouter()`), not an omission.
- **Code overlay is in scope, not optional** — the `</>` button shows on every
  non-lobby chapter; without an early-web `REGISTRY` entry it opens an empty/stale panel.
- **Share card is in scope** — `share-card.ts` assumes `facts[0]` + ARPANET-vs-generic
  styling; Early Web needs its own card branch or an explicit period-correct style.
- **Shader-missing → immediate fadeSwap** — if glass-shatter fails to compile,
  `runShader` currently waits the full duration on a blank canvas. Guard: if the shader
  isn't compiled, skip straight to `fadeSwap`.
- **Doc updates** (HANDOFF / CURRENT_TASK / ENGINEERING_LOG / PHASES) are a task, per
  repo hygiene rules — not implicit.
- **"Behavior-preserving," not "pure structural"** — Commit 1 changes runtime wiring
  (router validity, scroll order, uResolution); it preserves the *external* arpanet→figma
  flow, which tests must verify, not assume.
- **"Reduces the order-drift hazard," not "near-trivial"** — adding a chapter still
  hand-wires HTML, spacers, main.ts, transition keys, code overlay, share, content, tests.
  The manifest kills the silent router/scroll↔HTML drift; it does not make chapters free.
- **Blank-destination-texture** (`transition.ts:97` captures `toEl` while hidden/possibly
  uninitialized) is a real failure mode DOM assertions can't see. Accepted limitation —
  D7 excludes pixel comparison. Mitigation: assert the target chapter is initialized
  before capture (cheap DOM check), leave texture-content verification out of scope.
- **WebGL2-absent throw** (`webgl.ts:40` throws at construction) is pre-existing (Phase 1,
  eager `webgl` in main.ts), not introduced here. Out of scope; captured as a TODO.

---

## Implementation order

**Commit 1 — manifest + uResolution (behavior-preserving foundation):**
1. Create `src/data/manifest.ts` from the lobby roadmap (8 entries; add `order`).
2. `lobby/index.ts` reads the manifest (retire its inline array).
3. `router.ts`: derive `VALID_CHAPTERS` from `manifest.filter(c => c.live)`.
4. `scroll.ts`: derive `CHAPTER_ORDER` from `manifest` (live, sorted by `order`).
5. `webgl.ts`: add `uResolution` to compiled uniforms + set in `render()`.
   Verify: full suite green (arpanet→figma flow **verified** unchanged), Vitest logic
   tests pass, `tsc` + build clean.

**Commit 2 — Early Web (behavioral):**
6. Write `docs/EARLY-WEB-BRIEF.md` + `docs/EARLY-WEB-CONTENT.md` (CQ2).
7. `index.html`: add `#chapter-early-web` div + `data-chapter-id="early-web"` spacer,
   positioned between arpanet and figma-era.
8. `src/data/chapters.ts`: add the `early-web` content entry (hex palette from brief,
   facts). `manifest.ts`: flip early-web `live: true`, `order` between the two.
9. `src/chapters/early-web/{index.ts,style.css}` + artifacts — **follow the existing
   chapter pattern (no helper yet)**.
10. `src/main.ts`: import `initEarlyWeb`, grab `#chapter-early-web`, register **before
    `initRouter()`** (init-order matters — GSAP bug, ENGINEERING_LOG 2026-06-30).
11. `src/shaders/glass-shatter.frag` — **source-agnostic** voronoi shatter (bounded 3×3,
    uses `uResolution`); register in `main.ts` `precompileAll`.
12. `src/data/transitions.ts`: `arpanet→early-web: crt-power-off`,
    `early-web→figma-era: glass-shatter`; remove `arpanet→figma-era`.
13. `src/engine/transition.ts`: guard `runShader` on shader-compiled; else `fadeSwap`
    immediately (fold #4).
14. `src/ui/code-overlay.ts`: add early-web `REGISTRY` entry (curated source tabs).
15. `src/ui/share-card.ts`: add an Early Web card branch (period-correct style).
    Verify: new + regression tests green; **glass-shatter holds 60fps (documented)**.

**Commit 3 — extract createChapter (cleanup, now 3 real examples):**
16. Extract `src/engine/create-chapter.ts` from arpanet + figma + early-web; refactor
    all three onto it. Verify: all three render + transition unchanged.

**Commit 4 — docs:** update HANDOFF / CURRENT_TASK / ENGINEERING_LOG / PHASES.

---

## Test plan

**Vitest (pure logic — new runner, Codex T3):**
- Manifest derivation: `VALID_CHAPTERS` / `CHAPTER_ORDER` correct from `manifest.ts`.
- `CHAPTER_ORDER` equals DOM spacer order (drift guard — the one silent failure mode).
- `createChapter` wiring (after Commit 3): registers, wires progress + dwell.

**Playwright (DOM / browser):**
- `#early-web` loads; facts render in the specified pattern; target initialized before
  any transition capture (fold #6 mitigation).
- Deep-link `#early-web` lands correctly.
- Lobby early-web card live → click navigates to `#early-web`.
- `arpanet→early-web` fires shader `crt-power-off`; `early-web→figma-era` fires
  `glass-shatter` (DOM-level transition-request assertion).
- glass-shatter compiles + uniforms (incl. `uResolution`) resolve via `gl.getUniform`.
- Shader-missing → fadeSwap fallback fires (fold #4).
- Code overlay opens real early-web source (not empty/stale) (fold #7).
- Share on `#early-web` renders the Early Web card, not the Figma card (fold #8).

**CRITICAL regressions (IRON RULE):**
- **R1** — `visual.spec.ts:53` "ARPANET → Figma Era transition" no longer describes
  reality. Rewrite to `arpanet→early-web→figma`. Not optional.
- **R2** — nav-latch + deep-link guards hold with a 3rd chapter inserted
  (`nav-latch-race` learning: onEnter/onUpdate/onLeaveBack all still check `isNavSuppressed()`).

Visual: add `maxDiffPixelRatio` to `playwright.config.ts`, then a reliable early-web baseline.

---

## What already exists (reuse, don't rebuild)

- **`lobby/index.ts` roadmap** — already 8 entries with `live`; PROMOTE it to
  `src/data/manifest.ts` as the single source (Codex T1). Not a new registry.
- **`chapters.ts`** — content model; stays content-only, keyed by id. Do NOT add
  placeholder chapters to it.
- **`transition.ts`** engine — transition-agnostic; glass-shatter reuses it unchanged
  (new `.frag` + registry key + the shader-missing guard).
- **`webgl.ts`** single-triangle frag pipeline (`uFrom/uTo/uProgress`) — glass-shatter
  is a frag shader on the same contract; only `uResolution` added.
- **Touch/reduced-motion fade fallback** (`transition.ts:89`) — protects weak GPUs
  from the shader (caveat: does NOT cover WebGL2-entirely-absent, `webgl.ts:40` throws
  at construction — pre-existing, see TODO).
- **CRT relocation** — data-only registry key change; shader untouched.

## NOT in scope (deferred)

- **The other 5 Phase 2 chapters** + their transitions — separate slices.
- **glass-shatter's canonical `flat→figma-era` home** — deferred until Flat exists;
  source-agnostic authoring makes the later move a key change.
- **Generating chapter DOM from the manifest** (A1 option B) — HTML stays hand-authored;
  captured as a TODO.
- **WebGL2-absent hardening** (`webgl.ts:40` throw) — pre-existing; captured as a TODO.

## Failure modes (per new codepath)

| Codepath | Realistic failure | Test? | Error handling? | User sees |
|----------|-------------------|-------|-----------------|-----------|
| Manifest derivation | `order` collision/gap → wrong CHAPTER_ORDER | Yes (Vitest drift guard) | Deterministic | Silent → drift-guard test is the guard |
| glass-shatter compile fail | shader missing → runShader waits full duration on blank | Yes (fallback test) | **NEW: skip to fadeSwap** (fold #4) | Clean fade instead of black |
| early-web→figma capture | timeout → fadeSwap | Existing | `transition.ts:117` catch | Clean fade |
| Blank destination texture | `toEl` captured hidden/uninit → blank shatter | Partial (init-check) | Assert target initialized pre-capture | Mitigated; texture content not pixel-verified (D7) |
| Deep-link #early-web | hash not in VALID_CHAPTERS → lobby | Yes | Router defaults to lobby | Lobby (acceptable) |
| uResolution unset | uniform null → cells stretch | Yes (uniform hook) | Resolved at compile | Test guards it |
| Code overlay early-web | no REGISTRY entry → empty panel | Yes (fold #7) | REGISTRY entry added | Real source |
| Share early-web | wrong (Figma) card | Yes (fold #8) | Early Web card branch | Correct card |

**Critical gaps (no test AND no handling AND silent):** none.

## Parallelization

| Lane | Steps | Depends on |
|------|-------|-----------|
| A | Commit 1 (manifest + uResolution) | — |
| B | EARLY-WEB brief + content docs | — |
| C | Commit 2 (chapter + shader + transitions + overlay + share) | A + B |
| D | Commit 3 (extract createChapter) | C |

Launch A + B in parallel worktrees (code vs content docs, no shared files). Merge,
then C, then D. glass-shatter.frag authoring inside C is independent of the chapter DOM.

---

## Implementation Tasks
Synthesized from this review's findings (Claude sections + Codex outside voice).

- [ ] **T1 (P1, human: ~4h / CC: ~30min)** — data/engine — create `src/data/manifest.ts` from the lobby roadmap; derive VALID_CHAPTERS + CHAPTER_ORDER; lobby reads it
  - Surfaced by: A1 + Codex T1 — manifest source is the roadmap, not chapters.ts
  - Files: `src/data/manifest.ts` (new), `src/engine/router.ts`, `src/engine/scroll.ts`, `src/chapters/lobby/index.ts`
  - Verify: arpanet→figma flow unchanged; Vitest derivation + drift-guard pass
- [ ] **T2 (P1, human: ~30min / CC: ~5min)** — engine — add `uResolution` uniform (compile + render)
  - Surfaced by: A2
  - Files: `src/engine/webgl.ts`
  - Verify: `gl.getUniform` resolves `uResolution`; render sets it
- [ ] **T3 (P1, human: ~1h / CC: ~15min)** — tooling/tests — add Vitest; write manifest-derivation + drift-guard unit tests
  - Surfaced by: Codex T3 — no unit-test layer exists
  - Files: `package.json`, `vitest.config.ts` (new), `tests/unit/manifest.test.ts` (new)
  - Verify: `vitest run` green
- [ ] **T4 (P1, human: ~3h / CC: ~20min)** — docs — write `EARLY-WEB-BRIEF.md` + `EARLY-WEB-CONTENT.md` (hex palette, fact-render pattern, ~6 facts)
  - Surfaced by: CQ2 — vague-color-references + facts-rendering-undefined learnings
  - Files: `docs/EARLY-WEB-BRIEF.md` (new), `docs/EARLY-WEB-CONTENT.md` (new)
  - Verify: every color is a hex; render pattern named
- [ ] **T5 (P1, human: ~1.5d / CC: ~45min)** — chapters — build Early Web chapter (follow existing pattern, NO helper yet) + full wiring
  - Surfaced by: Goal + Codex #1 (main.ts wiring)
  - Files: `index.html`, `src/data/chapters.ts`, `src/data/manifest.ts`, `src/chapters/early-web/*`, `src/main.ts`
  - Verify: `#early-web` loads, facts render, deep-link + lobby nav pass; registered before initRouter
- [ ] **T6 (P1, human: ~5h / CC: ~35min)** — shaders — author source-agnostic `glass-shatter.frag` (voronoi, bounded 3×3, uResolution) + precompile + **60fps profile gate** + shader-missing fadeSwap guard
  - Surfaced by: Goal + A2 + Codex T4 (profile) + Codex #10 (fallback)
  - Files: `src/shaders/glass-shatter.frag` (new), `src/main.ts`, `src/engine/transition.ts`, `docs/SHADER-PROFILES.md`
  - Verify: compiles; early-web→figma fires it; holds 60fps (documented); missing→fadeSwap
- [ ] **T7 (P1, human: ~1h / CC: ~10min)** — data — relocate transitions: `arpanet→early-web` crt, `early-web→figma` glass-shatter, remove `arpanet→figma-era`
  - Surfaced by: Goal — CRT relocation
  - Files: `src/data/transitions.ts`
  - Verify: transition-request tests assert correct shader per pair
- [ ] **T8 (P1, human: ~45min / CC: ~10min)** — ui — add early-web `REGISTRY` entry to code overlay (curated source tabs)
  - Surfaced by: Codex #7 — `</>` shows on every chapter; empty panel without entry
  - Files: `src/ui/code-overlay.ts`
  - Verify: overlay on #early-web shows real source, not stale
- [ ] **T9 (P1, human: ~1h / CC: ~15min)** — ui — add Early Web branch to share card (period-correct style)
  - Surfaced by: Codex #8 — share assumes ARPANET/Figma styling
  - Files: `src/ui/share-card.ts`
  - Verify: share on #early-web renders the Early Web card
- [x] **T10 (P1, human: ~3h / CC: ~20min)** — engine — extract `createChapter` from all THREE chapters; refactor onto it
  - Surfaced by: CQ1 + Codex T2 — rule of three, after Early Web exists
  - Files: `src/engine/create-chapter.ts` (new), `src/chapters/{arpanet,figma-era,early-web}/index.ts`
  - Verify: all three render + transition unchanged
  - **DONE 2026-08-03** — spec-object scaffold (`render` / `onMount` / `onInit` / `onProgress` / `onDwellEnter` / `ambient`). All three chapters refactored; 10 Vitest cases in `tests/unit/create-chapter.test.ts`. tsc clean, vitest 17/17, Playwright 14/14 (full chain + both deep-links + nav latch), build clean.
- [ ] **T11 (P1, human: ~2h / CC: ~15min)** — tests — **R1** rewrite `visual.spec.ts` e2e for arpanet→early-web→figma + **R2** nav-latch guards with 3 chapters
  - Surfaced by: Test review IRON RULE
  - Files: `tests/visual.spec.ts`
  - Verify: rewritten e2e passes; deep-link + nav-latch hold
- [ ] **T12 (P2, human: ~2h / CC: ~15min)** — tests/config — add `maxDiffPixelRatio` to `playwright.config.ts` + reliable early-web idle baseline
  - Surfaced by: Test review — flaky-snapshot open issue
  - Files: `playwright.config.ts`, `tests/visual.spec.ts-snapshots/`
  - Verify: idle snapshots stop failing on clean tree
- [ ] **T13 (P2, human: ~30min / CC: ~10min)** — docs — update HANDOFF / CURRENT_TASK / ENGINEERING_LOG / PHASES
  - Surfaced by: Codex #13 — repo doc-hygiene rules
  - Files: `docs/HANDOFF.md`, `docs/CURRENT_TASK.md`, `docs/ENGINEERING_LOG.md`, `PHASES.md`
  - Verify: docs reflect 3-chapter reality + manifest architecture

## Design decisions (locked via /plan-design-review 2026-07-08)

Full brief: `docs/EARLY-WEB-BRIEF.md`. Feeds task **T4**. Six decisions locked:

- **Palette** — every color pinned to hex (`#C0C0C0` page, `#000080` navy, `#0000EE`/`#551A8B` links, `#CC0000` red, `#008080` teal, `#0A0A0A` shell); stay inside the 216 web-safe palette.
- **Type** — Times New Roman (headline/body), Courier New (year/code), Arial (chrome/widgets only). System fonts, no web fonts.
- **Layout (P7.1)** — full period Netscape/Mosaic browser frame inside the dark shell; single narrow table-scaffolded column. Mobile: the framed window horizontal-scrolls (no modern reflow — preserves the era illusion).
- **Fact rendering (resolves `facts-rendering-undefined`)** — titled sections (navy headline + red Courier year + Times body) separated by `<hr>` groove rules, revealed on scroll.
- **Progress indicator (P7.2)** — the green visitor hit-counter ticks up with scroll (Early Web's equivalent of ARPANET's ASCII bar).
- **Arrival beat (P7.3)** — CRT white-line resolves into the gray page, which then *assembles* like a 1993 page over a slow connection (banner → text → image/counter), under ~1.2s.

## Approved Mockups

| Screen/Section | Mockup | Direction | Notes |
|----------------|--------|-----------|-------|
| Early Web chapter | `~/.gstack/projects/chronicle/designs/early-web-20260708/` · artifact `claude.ai/code/artifact/90b84c81-f18a-4437-a694-f9d8ed322238` | NCSA Mosaic / Netscape 1.0, 1993 web | Hand-built HTML (AI generator lacked API key); doubles as a head-start on the chapter CSS |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run for this slice |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 14 raised → 9 folded, 5 tensions resolved |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | Step 0 + A1/A2/CQ1/CQ2/test + R1/R2; 0 unresolved, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score 3/10 → 9/10, 6 decisions locked → EARLY-WEB-BRIEF.md |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** 14 findings. 9 were gaps in the plan, folded directly (main.ts wiring, code-overlay + share required not optional, shader-missing→fadeSwap, doc-update task, two overclaim reframes, blank-texture limitation, pre-existing WebGL2 throw). 5 were substantive tensions, all resolved with the user: manifest source = lobby roadmap not chapters.ts (T1), createChapter extracted after Early Web (T2), add Vitest for logic tests (T3), profile glass-shatter in-slice (T4), build glass-shatter now but source-agnostic (T5).
- **CROSS-MODEL:** Codex found real gaps the section review missed — most valuable: the chapters.ts-vs-roadmap data-model conflict and the rule-of-two premature abstraction. Both reviewers agree on the foundation-first shape and the temp-bridge shader pattern.
- **VERDICT:** ENG + DESIGN CLEARED — ready to implement Phase 2 Slice 1. Eng review CLEAR (architecture + tests locked); design review CLEAR (3/10 → 9/10, Early Web brief locked in `docs/EARLY-WEB-BRIEF.md`).

NO UNRESOLVED DECISIONS
