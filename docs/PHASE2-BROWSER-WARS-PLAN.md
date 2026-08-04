# Phase 2 Slice 2 — Browser Wars (1995–2001)

Status: **PLAN LOCKED** via `/plan-ceo-review` (SELECTIVE EXPANSION) 2026-08-03.
Predecessor: `docs/PHASE2-EARLY-WEB-PLAN.md` (Slice 1, shipped).

Kenny stepped away mid-review with explicit authority: *"choose whatever you'd
recommend."* Every decision below that was not answered directly is marked
**[auto-decided]** with its reasoning, so any of them can be reversed on sight.

---

## Decisions locked

| # | Decision | Answer |
|---|---|---|
| D1 | Early Web → Browser Wars transition | **Interactive, concrete.** Win 3.1 dialog with a real OK button. Add a `kind` discriminator to the transition registry; implement ONE concrete DOM runner. No plugin architecture until a second DOM transition exists (rule of three). |
| D2 | Review posture | **Selective expansion.** Roadmap scope is the baseline; extras cherry-picked individually. |
| D3.1 | Era-native micro-details | **All three accepted:** real `<marquee>` tag, Netscape throbber as progress indicator, badge + webring cluster. |
| D3.2 | Animated GIF provenance | **Author originals in period style.** Satisfies SPEC's "actual GIFs" with zero provenance risk; period-correct 16-color dithered encoding is also the smallest encoding. |
| D3.3 | IE4-era browser frame | **[auto-decided] INCLUDE.** The era is named for the browser war; framing the chapter in evolved IE4 chrome makes the browser itself the narrative device. Reuses the Early Web frame CSS pattern. |
| D3.4 | Fold in TODO-007 (chapter DOM from manifest) | **[auto-decided] DEFER to Slice 3.** Slice 2 already changes the transition engine. A second boot-path change in one slice is how `nav-latch-race` happened — an intermittent bug that only reproduced under real network latency. Slice 1 deferred it for the same reason. |
| D4 | Dialog escape routes | **[auto-decided]** OK / forward-scroll / Enter / Space / PageDown all advance. Esc / Cancel / scroll-up return to Early Web at 85%. 15s auto-advance as last-resort safety net. |
| D5 | Contrast vs authenticity | **[auto-decided]** Decoration may be period-ugly. **Fact text must hold WCAG AA.** A chapter nobody can read loses the content the project calls its soul. |
| D6 | Flash safety | **[auto-decided] BASELINE, not optional.** Flash rate stays under the WCAG 2.3.1 three-flashes threshold; full `prefers-reduced-motion` degradation. Shipping a photosensitive-seizure vector is not a scope choice. |

---

## The central architectural problem, and how it's solved

`SPEC.md:71` specs this transition as *"A Windows 3.1 dialog box appears mid-screen:
'Are you sure you want to proceed?' **OK button launches next chapter**."*

That single word — *button* — is the whole slice. Every Chronicle transition to date is
automatic: dwell exit fires it, a scroll lock holds, a shader plays on a timer, the
chapter swaps, the lock releases. A click-gated transition holds the scroll lock for an
**unbounded** time. A user who never clicks is trapped.

### The blocker the first draft missed (found by Codex, verified in code)

`src/styles/global.css:90` —

```css
body.scroll-locked {
  overflow: hidden;
  pointer-events: none;   /* ← the OK button would never be clickable */
  touch-action: none;
}
```

The existing scroll lock **disables pointer events on the whole body**. That is correct
for an automatic shader transition, where the user must not be able to interact with a
frozen frame. It is fatal for a user-gated one. The first draft of this plan said
"everything else in the existing lifecycle is unchanged" — that was false, and the
dialog would have rendered perfectly and accepted no clicks.

**Resolution: a user-gated transition gets its own body state, not a reuse.**

```css
body.transition-paused {
  overflow: hidden;        /* page cannot scroll past the boundary */
  /* pointer-events NOT disabled — the transition IS an interaction */
}
```

`lockScroll()` / `unlockScroll()` stay exactly as they are for shader transitions.

### No-trap, guaranteed by construction rather than by timer

The first draft used a 15-second auto-advance as the safety net. Codex is right that
this is actively wrong: a user reading with assistive technology, or who switched tabs,
gets advanced into the next era **without consent**, and the warning log would fire on
correct behavior rather than on a fault.

**Auto-advance is dropped.** No-trap is guaranteed structurally instead:

1. `body.transition-paused` is applied **only after** the dialog is confirmed mounted in
   the DOM. Mount failure never pauses scroll.
2. The runner is wrapped in try/catch — any throw falls through to `fadeSwap`.
3. The dialog offers many exits (below), and none of them are time-based.

A user who walks away returns to a dialog patiently waiting. That is correct behavior,
not a trap.

The remaining design — the action that got the user here also being a way through:

```
        dwell exit (early-web spacer, progress = 1)
              │
              ▼
      ┌──────────────────┐   OK click / wheel-down / touchmove
      │  AWAITING_INPUT  │──────────────┐  Enter / Space / PageDown
      │ transition-      │              ▼
      │   paused         │        ┌───────────┐
      │ dialog shown     │        │ ADVANCING │──▶ chapter swap ──▶ browser-wars
      │ OK focused       │        └───────────┘
      └───┬──────────┬───┘
          │          │  hashchange (router navigates elsewhere)
 Esc /    │          └──────────────▶ ┌─────────┐
 Cancel / │                           │  ABORT  │ teardown, no swap,
 scroll-up│                           └─────────┘ no restore — router owns
          ▼
  ┌────────────────────┐
  │ RETURN → early-web │  lands at 85%, clear of the dwell zone
  │ scroll released    │  so it does not immediately re-loop
  └────────────────────┘
```

Two independent user-driven exits, plus a router abort:
1. Forward-scroll intent advances (the natural instinct works, via `wheel`/`touchmove`
   listeners — actual scrolling stays pinned).
2. Esc / Cancel / scroll-up returns (a real escape route, and period-accurate — a
   Win 3.1 dialog without Cancel isn't a Win 3.1 dialog).
3. `ABORT` on hashchange — the runner must not swap *or* restore, because the router
   already owns the active chapter. Codex caught that a two-value `'advance' | 'cancel'`
   contract makes hash navigation unrepresentable: both outcomes would stomp the
   router's target. The contract is three-valued.

**Once-only settlement.** `transitionInFlight` guards a second transition *request*; it
does nothing about two callbacks racing *inside* an already-running dialog (OK clicked
as the abort fires). The runner owns its own single-settlement latch and teardown.

**Unexpected upside:** this is Chronicle's first transition that works *identically on
touch*. It's DOM, not WebGL, so the `isTouchDevice → fadeSwap` downgrade never applies.
Mobile users get the real transition for the first time in the project.

---

## Architecture

### Registry shape (additive)

```ts
// src/data/transitions.ts
type RunnerId = 'win31-dialog';           // literal union, NOT string —
                                          // an arbitrary string must not type-check

type TransitionDef =
  | { kind: 'shader'; shader: string; duration: number }
  | { kind: 'dom'; runner: RunnerId; enterMs: number; shader?: string };
                                          // shader? is optional, NOT excluded:
                                          // SPEC:71 wants "DOM overlay + shader blur"
                                          // enterMs, NOT duration — see below

'arpanet->early-web':      { kind:'shader', shader:'crt-power-off', duration:2500 }
'early-web->browser-wars': { kind:'dom',    runner:'win31-dialog',  enterMs:1200 }
'browser-wars->figma-era': { kind:'shader', shader:'glass-shatter', duration:2000 }
// 'early-web->figma-era' REMOVED — glass-shatter's temp bridge relocates.
```

**Two corrections from the outside voice, both applied.** The first draft typed `runner`
as `string`, which admits an invalid state — every typo type-checks with no resolver
described. It is now a literal union, so adding a runner is a deliberate type-level edit.

More seriously, the first draft's `kind: 'shader' | 'dom'` made the two **mutually
exclusive** — which contradicts the very SPEC line it claims to serve. `SPEC.md:71`
specifies *"DOM overlay + shader blur on background,"* and three of the four remaining
transitions in the catalog are likewise hybrids. A discriminator that forbids hybrids
would obstruct exactly the future it was justified by. `shader?` is optional on the
`dom` variant.

**Slice 2 ships the background blur as CSS `backdrop-filter`**, not a shader — the
technique is already proven in-repo by Figma Era. The `shader?` slot stays open for when
a real blur shader is worth authoring.

**`enterMs`, not `duration`** (eng review). On a shader transition, `duration` drives the
rAF progress ramp from 0 to 1. A user-gated dialog has **no fixed duration** — it ends
when a human acts. Keeping a field named `duration` on the dom variant invites someone to
write a timer against it, which is precisely how the rejected auto-advance would sneak
back in. `enterMs` names what it actually is: the appear animation.

---

## Use the native `<dialog>` element (eng review, P1)

The plan implied hand-rolling a modal. **The platform has a built-in**, and it hands over
for free almost everything T3 and T10 were going to build by hand:

| Need | Hand-rolled | `<dialog>` + `showModal()` |
|---|---|---|
| Render above everything | z-index management | **top layer** — z-index irrelevant |
| Background blur target | extra element | **`::backdrop`** pseudo-element |
| Background non-interactive | manual `inert` | **automatic** |
| Esc closes (our Cancel) | keydown handler | **built in** |
| Focus management | focus-trap logic | built in; the W3C APA group concluded manual trapping is **not needed** |
| Dialog semantics for AT | manual ARIA | implicit |

Cross-browser viable since 2022–23. This is **boring by default** in Choose Boring
Technology terms: spend the innovation tokens on the shader and the era design, not on
rebuilding a modal primitive that every browser already ships.

**One thing to verify empirically during T3b:** `showModal()` promotes the dialog into the
**top layer**, which renders outside the normal ancestor stacking context. It may
therefore already escape a `body { pointer-events: none }` ancestor. If it does,
`body.transition-paused` becomes belt-and-braces rather than load-bearing. Keep
`transition-paused` regardless — relying on an untested top-layer interaction is exactly
the unverified-assumption class of bug that produced the original `scroll-locked` miss.

### Dependency delta

```
BEFORE                              AFTER
transition.ts                       transition.ts
  ├─ webgl.ts                         ├─ webgl.ts
  ├─ chapter.ts                       ├─ chapter.ts
  ├─ scroll.ts                        ├─ scroll.ts
  ├─ transitions.ts                   ├─ transitions.ts  (now discriminated)
  └─ audio.ts                         ├─ audio.ts
                                      └─ transitions/win31-dialog.ts   ← NEW
```

`win31-dialog.ts` is statically imported (small: DOM + CSS, no heavy deps). **This does
add to the entry chunk** — the first draft claimed "the 64 KB entry chunk is untouched,"
which was false and conflated the runner with its GIF assets. Only the GIFs sit outside
the JS bundle. Budget: the runner + its CSS should land under ~2 KB gzip; if it exceeds
that, make it a dynamic `import()` on first dwell of `early-web` (the same idle-preload
pattern `transition.ts` already uses for html2canvas).

### Runner contract

```ts
type Settlement = 'advance' | 'cancel' | 'abort';

interface DomTransitionRunner {
  run(ctx: {
    fromId: string;
    toId: string;
    def: TransitionDef;
    signal: AbortSignal;     // router fires this on hashchange
  }): Promise<Settlement>;
}
```

`transition.ts` branches once on `def.kind`:
- `'advance'` → chapter swap, as today.
- `'cancel'` → restore `fromId` at 85%, no swap.
- `'abort'` → teardown only. **No swap and no restore** — the router already owns the
  active chapter, and touching it would recreate the `nav-latch-race` class of bug.

**The lifecycle is NOT unchanged**, contrary to the first draft. Two real refactors are
required and are now explicit in T3:
- `body.transition-paused` is a new state distinct from `scroll-locked`.
- `fireBackwardsNav` is **private** (`scroll.ts:169`), owns its own in-flight guard,
  fade, audio crossfade, and dwell reset. Cancel cannot "reuse it verbatim." T3 exports
  a shared `returnToChapter(id, pct)` from `scroll.ts` and refactors `fireBackwardsNav`
  onto it, so the two paths cannot drift.

---

## CRITICAL GAP found — transition adjacency drift

The glass-shatter relocation is the slice's only **non-additive** edit. Remove
`early-web->figma-era`, add `early-web->browser-wars`, move glass-shatter to
`browser-wars->figma-era`. If any key is wrong, or `browser-wars` isn't flipped live in
the manifest, `getTransition` returns `null`, `handleTransitionRequest` returns early,
and the user reaches the end of a chapter with **no way forward and no error**. Silent —
the exact failure class the manifest drift-guard exists to prevent.

**Fix (baseline, P1):** a Vitest guard asserting every adjacent pair in `chapterOrder()`
has a registered transition.

```ts
it('every adjacent live chapter pair has a registered transition', () => {
  const order = chapterOrder();
  for (let i = 0; i < order.length - 1; i++) {
    expect(hasTransition(order[i], order[i + 1])).toBe(true);
  }
});
```

~15 lines. **But it is not sufficient on its own** — Codex correctly noted that it checks
registry keys only. A live chapter also needs a `#chapter-{id}` scene, a
`.chapter-scroll-spacer`, and an `initX()` registration in `main.ts`, all still
hand-wired in `index.html` and `src/main.ts`. Miss any one and the route is broken or
blank, and the adjacency test stays green.

**T2b closes the rest:** a Playwright assertion that for every live manifest chapter,
the scene element exists, the spacer exists in the right order, and the chapter
registers with `chapterManager`. Together T2 + T2b make a dead-end chapter genuinely
impossible to ship. (This is also the friction TODO-007 would remove wholesale — see
NOT in scope.)

---

## Error & rescue registry

| Codepath | Failure mode | Rescued? | Rescue action | User sees | Logged? |
|---|---|---|---|---|---|
| `runDomTransition` | dialog root fails to mount | Y | throw caught → `fadeSwap`; pause state never applied | clean fade | Y (warn) |
| dialog | user never interacts | Y | **by design** — dialog waits; scroll pinned but page usable | dialog waiting | N |
| dialog | double-click OK | Y | runner's once-only settlement latch + disable on first click | one transition | N |
| dialog | OK and abort race | Y | same single-settlement latch | first wins | Y (debug) |
| dialog | hashchange mid-dialog | Y | `AbortSignal` → `'abort'`, teardown only | router target | Y (debug) |
| dialog | Esc / Cancel / scroll-up | Y | `returnToChapter(early-web, 0.85)` | stays in era | Y (debug) |
| **audio** | **crossfade fires at dialog open, user cancels** | **Y (eng review)** | **crossfade fires on `'advance'` settlement only** | correct era bed | N |
| GIF asset | 404 / blocked | Y | `onerror` → hide; CSS fallback | no broken icon | Y (debug) |
| transition registry | adjacency gap | Y (T2) | build-time test failure | never ships | test |
| wiring | live chapter missing scene / spacer / registration | Y (T2b) | build-time test failure | never ships | test |
| `createChapter` | live chapter, no content record | Y | named throw (shipped T10) | dev-time error | Y |
| capture | `toEl` captured before init → blank texture | **N ← PRE-EXISTING GAP** | see below | possible blank shatter | N |

**Correction — a rescue that does not exist.** The first draft listed an "existing
target-initialized assert (Slice 1 fold #6)" as the mitigation for blank destination
textures. Codex challenged it and the code confirms: `chapterManager.isInitialized()` is
defined at `chapter.ts:70` and **called from nowhere**. `transition.ts` captures `toEl`
without ever checking it. The Slice 1 plan described this mitigation as intent; it was
never implemented, and this plan inherited the claim without verifying it.

It is now **T2c**, a real task, and it matters more here than it did in Slice 1: Browser
Wars is the first chapter whose visual identity depends on image assets that may not have
decoded when the capture runs.

---

## Test plan

**Vitest (pure logic):**
- Every adjacent live pair has a registered transition (the CRITICAL GAP guard).
- Registry `kind` values are valid; `dom` entries carry `runner` + `autoAdvanceMs`.
- Manifest: `browser-wars` live, order 3, spacer order matches (existing drift guard).

**Playwright (browser):**
- Full 4-chapter chain: `arpanet → early-web → browser-wars → figma-era`.
- `#browser-wars` deep-link lands correctly; neighbors stay off-screen.
- Dialog appears at Early Web dwell exit; OK advances.
- Esc cancels → still in Early Web, scroll unlocked, not re-looping.
- Forward-scroll (wheel) while dialog is open advances (the no-trap guarantee).
- **The dialog is actually clickable** — a direct regression test for Codex #2. Assert
  `body` is NOT `.scroll-locked` while the dialog is open, and that a real click on OK
  lands. This is the finding that would have shipped a dead button.
- Hashchange mid-dialog aborts: no swap, no 85% restore, router's target wins.
- Touch emulation: dialog path runs (no `fadeSwap` downgrade) — new capability.
- `prefers-reduced-motion`: dialog instant, marquee paused, no flashing.
- Code overlay `?` opens real browser-wars source (REGISTRY entry present).
- Share `s` renders the Browser Wars card, not Early Web's.

**Chaos / hostile QA:**
- 5 rapid OK clicks → exactly one transition, no double-swap.
- Click OK then immediately hit browser Back.
- Scroll to dwell, wait past 15s, then click OK (auto-advance already ran — must not
  double-fire).

---

## Design brief requirements (feeds `docs/BROWSER-WARS-BRIEF.md`)

**AI slop risk: HIGH.** Geocities pastiche is a commodity template in 2026 (Neocities,
Cameron's World, dedicated Geocities builders). Chronicle cannot win on "looks 90s." It
wins on the *transition* and on the *arc* — the ugliness earns its place because you
just left Mosaic and you're heading to Figma. Countermeasure: every color as hex before
any code (per the `vague-color-references` pitfall, 9/10).

**Locked palette (SPEC.md:52):** `#FF00FF` magenta, `#FFFF00` yellow, `#00FF00` lime,
on `#FFFFFF`. Tiled background. Type: Comic Sans MS, Papyrus, WordArt-style gradient
headings — with a declared fallback stack, since neither font exists on Linux/Android.

**The contrast split (D5):** decoration is period-ugly by design; **fact text holds WCAG
AA**. Facts render in a readable well inside the gaudy page — which is itself
period-accurate, since real 90s pages put body copy in a white table cell.

**Progress indicator:** the Netscape throbber (the animated N/comet in browser chrome
that spun while loading). Period-native, and it leaves the visitor counter free to be
the *interactive artifact* SPEC:83/108 assigns it — resolving the collision with Early
Web's odometer, which took the hit-counter metaphor first.

**Emotional arc:** Early Web is quiet system gray. Browser Wars must land like a wall.
The violence of the contrast is the product (SPEC:59).

---

## Implementation Tasks

**Sequencing corrected per Codex #11.** The first draft put the engine before content and
design, contradicting the project's own "content before animation" rule, and split the
chapter (T6) from the registry move (T7) so the tree would sit knowingly red between
them. Content and design now come first, and the chapter + registry move land in **one
commit**.

### Commit 1 — content + design (no code)

- [ ] **T4 (P1, human: ~2h / CC: ~20min)** — content — `docs/BROWSER-WARS-CONTENT.md`, 6–8 facts
  - Surfaced by: project rule — content before animation
  - Verify: visual/design-history scope; years accurate
- [ ] **T5 (P1, human: ~3h / CC: ~25min)** — design — `docs/BROWSER-WARS-BRIEF.md`, every color as hex
  - Surfaced by: Section 11 — HIGH AI-slop risk; `vague-color-references` pitfall (9/10)
  - Verify: zero descriptive color names; fallback stack for Comic Sans / Papyrus declared
- [ ] **T9 (P1, human: ~4h / CC: ~30min)** — assets — author period GIFs (16-color dithered, ≤150 KB total)
  - Surfaced by: D3.2. **Raised P2 → P1** per Codex #11: the chapter and the flash-safety
    measurement both depend on these existing.
  - Verify: budget held; `loading="lazy"`; explicit width/height; **measured** flash rate

### Commit 2 — engine (behavior-preserving for existing transitions)

- [ ] **T1 (P1, human: ~2h / CC: ~15min)** — data — `kind` discriminator; `RunnerId` literal union; optional `shader?` on the dom variant
  - Surfaced by: D1; Codex #3 (hybrids must stay representable), #4 (`string` admits invalid state)
  - Files: `src/data/transitions.ts`
  - Verify: `tsc` clean; existing shader transitions byte-identical in behavior
- [ ] **T2 (P1, human: ~1h / CC: ~10min)** — tests — transition adjacency drift guard
  - Surfaced by: Section 2 — CRITICAL GAP (silent dead-end chapter)
  - Files: `tests/unit/transitions.test.ts` (new)
- [ ] **T2b (P1, human: ~1.5h / CC: ~15min)** — tests — live-chapter wiring completeness (scene + spacer + registration)
  - Surfaced by: Codex #10 — adjacency alone checks registry keys, not DOM/`main.ts` wiring
  - Files: `tests/browser-wars.spec.ts` (new)
- [ ] **T2c (P1, human: ~1h / CC: ~10min)** — engine — actually implement the target-initialized check before capture
  - Surfaced by: Codex #9 — Slice 1 claimed this mitigation; `isInitialized()` is called from nowhere
  - Files: `src/engine/transition.ts`
  - Verify: capture waits for / asserts `chapterManager.isInitialized(toId)`
- [ ] **T3a (P1, human: ~3h / CC: ~20min)** — engine — **pure refactor**: extract `returnToChapter(id, pct)` from `fireBackwardsNav`
  - Surfaced by: Eng review — Beck's "make the change easy, then make the easy change".
    The first draft bundled this structural change with the new behavior; split so each
    is independently revertible.
  - Files: `src/engine/scroll.ts`
  - Verify: **zero behavior change** — full existing suite green before any new code lands
- [ ] **T3b (P1, human: ~1.5d / CC: ~55min)** — engine — `win31-dialog` runner on native `<dialog>` + `transition-paused` state
  - Surfaced by: D1, D4; Codex #2/#1/#6; eng review (native `<dialog>`, `enterMs`, audio)
  - Files: `src/transitions/win31-dialog.ts` + `.css` (new), `src/engine/transition.ts`, `src/styles/global.css`
  - **Includes:** native `<dialog>` + `showModal()` (top layer, `::backdrop`, inert, Esc
    for free); `body.transition-paused` (no `pointer-events:none`); three-valued
    settlement with `AbortSignal`; once-only settlement latch; **audio crossfade moved to
    fire on `'advance'` only**
  - Verify: OK advances; Esc/Cancel returns @85% **with Early Web's ambient bed intact**;
    wheel advances; hashchange aborts without swap or restore; 5 rapid OK clicks → one
    transition; empirically confirm whether top layer escapes ancestor `pointer-events`

### Commit 3 — chapter + registry move (atomic; tree never red)

- [ ] **T6 (P1, human: ~1.5d / CC: ~50min)** — chapter — `src/chapters/browser-wars/` via `createChapter`
  - Files: chapter dir; `src/data/chapters.ts`; `src/data/manifest.ts`; `index.html`; `src/main.ts`
- [ ] **T7 (P1, human: ~1h / CC: ~10min)** — data — glass-shatter → `browser-wars->figma-era`; remove `early-web->figma-era`
  - **Must land in the same commit as T6** (Codex #11) — flipping the chapter live
    without the registry move leaves a dead-end chapter
- [ ] **T8 (P1, human: ~2h / CC: ~15min)** — ui — code-overlay REGISTRY entry + share-card branch
  - Surfaced by: `chronicle-global-ui-per-chapter` pitfall (9/10) — definition of done
- [ ] **T10 (P1, human: ~1d / CC: ~40min)** — a11y — flash ceiling, reduced-motion, AA on fact text
  - Surfaced by: D5, D6; **rescoped** per Codex #8 — CSS alone cannot pause an animated
    GIF and does not control a native `<marquee>`. Needs JS control plus **static
    first-frame asset alternatives**, swapped under `prefers-reduced-motion`.
  - Files: `src/chapters/browser-wars/index.ts`, `style.css`, `assets/` (static variants)
  - Verify: measured flash rate under WCAG 2.3.1; marquee stops; GIFs swap to stills; fact text AA
- [ ] **T11 (P1, human: ~3h / CC: ~25min)** — tests — full Playwright suite per the test plan
- [ ] **T11b (P1 — CRITICAL REGRESSION, human: ~1h / CC: ~10min)** — tests — repair `scrollChapterToEnd` for gated transitions
  - Surfaced by: Eng review test diagram — **mandatory under the regression iron rule, no
    approval needed**. `tests/visual.spec.ts:52` `scrollChapterToEnd()` assumes every
    transition completes on its own. Once Browser Wars is inserted, the existing
    `ARPANET → Early Web → Figma Era` chain test scrolls Early Web to its end and **hangs
    on the dialog** until the 8s timeout. This test breaks the moment T6/T7 land.
  - Files: `tests/visual.spec.ts`
  - Verify: helper detects a gated transition, drives the dialog, and the 4-chapter chain
    passes; the existing 3-chapter assertions still hold for the ungated legs
- [ ] **T12 (P2, human: ~30min / CC: ~10min)** — docs — ENGINEERING_LOG / HANDOFF / AI_CONTEXT / CURRENT_TASK / PHASES / TODOS
  - Includes the TODO-006 closure owed to `TODOS.md`

---

## NOT in scope

- **TODO-007** (generate chapter DOM from manifest) — deferred to Slice 3. Two boot-path
  changes in one slice is how `nav-latch-race` happened.
- **Generalized runner architecture** (approach C) — deferred until BSOD gives a second
  real DOM transition. Rule of three.
- **Extracting a shared browser-frame component** from Early Web + Browser Wars — that's
  rule-of-two, the exact mistake caught in Slice 1. Revisit at a third framed chapter.
- **Browser Wars → Post-Crash (BSOD wipe)** — Post-Crash doesn't exist. glass-shatter
  bridges to Figma Era in the interim, same temp-bridge pattern as Slice 1.
- **Sourcing archived GeoCities GIFs** — provenance risk on a public portfolio piece.

## What already exists (reused, not rebuilt)

- `createChapter` scaffold (shipped T10 today) — chapter is a spec, not hand-wiring.
- Manifest derivation + spacer drift guard.
- `fireBackwardsNav`'s 85% landing logic — reused verbatim for dialog Cancel.
- `fadeSwap` — the fallback every new failure path lands on.
- Early Web's browser-frame CSS *pattern* (not extracted, deliberately).
- `transitionInFlight` guard — already prevents double-fire; extends to the dialog.

## Dream state delta

Leaves Chronicle at 4 of 8 chapters with a transition engine that knows two kinds
instead of one. SPEC's remaining catalog is three more hybrids (BSOD overlay+dissolve,
phone-unlock CSS3D+shader, texture-strip alpha mask), so the second kind is the
unlock that makes the back half of Phase 2 tractable. Reversibility 4/5.

---

## Outside voice — Codex (cross-model)

Run automatically as a standard review step. Codex returned **12 findings and the verdict
"the plan is not implementation-ready."** That was correct. Three findings were verified
directly against the code before acting on them:

| # | Finding | Verified | Disposition |
|---|---|---|---|
| 2 | `body.scroll-locked` sets `pointer-events:none` — the OK button would never be clickable | ✅ `global.css:90` | **APPLIED** — new `transition-paused` state |
| 9 | The "existing target-initialized assert" does not exist | ✅ `isInitialized` called from nowhere | **APPLIED** — now T2c |
| 5 | `fireBackwardsNav` is private; cannot be "reused verbatim" | ✅ `scroll.ts:169`, not exported | **APPLIED** — T3 extracts `returnToChapter` |
| 1 | Two-valued settlement can't express hashchange | reasoning | **APPLIED** — three-valued + `AbortSignal` |
| 3 | `shader \| dom` forbids the hybrids SPEC requires | ✅ `SPEC.md:71` | **APPLIED** — optional `shader?` |
| 4 | `runner: string` admits invalid states | reasoning | **APPLIED** — literal union |
| 6 | `transitionInFlight` doesn't stop intra-dialog double settlement | ✅ `transition.ts:70` | **APPLIED** — settlement latch |
| 7 | 15s auto-advance advances without consent | reasoning | **APPLIED** — dropped entirely |
| 8 | CSS cannot pause a GIF or a native `<marquee>` | reasoning | **APPLIED** — T10 rescoped |
| 10 | Adjacency test misses DOM/`main.ts` wiring | ✅ hand-wired | **APPLIED** — added T2b |
| 11 | Sequencing contradicts "content before animation"; T6/T7 split leaves tree red | ✅ | **APPLIED** — re-sequenced into 3 commits |
| 12 | "Entry chunk untouched" is false for a static runner import | ✅ | **APPLIED** — corrected + budget set |

**CROSS-MODEL:** no genuine tension — every finding was a defect in the first draft, not
a difference of opinion. The most valuable was #2: the CEO review reasoned carefully about
trapping users behind a scroll lock and never checked what that lock actually does. A
plan that reads as thorough can still be built on an unverified assumption about
existing CSS. Second most valuable was #9, where the review inherited a claimed mitigation
from the Slice 1 plan without confirming it shipped — a reminder that a prior plan's
*intent* is not evidence of *implementation*.

**VERDICT:** plan revised against all 12.

---

## Eng review findings (5, all folded)

| # | Finding | Conf. | Disposition |
|---|---|---|---|
| 1 | Hand-rolling a modal when the platform ships `<dialog>` + `showModal()` — top layer, `::backdrop`, inert background, Esc, and focus management for free | 9/10 | **APPLIED** — T3b built on native `<dialog>` |
| 2 | `duration` is meaningless on a user-gated transition and invites a timer | 8/10 | **APPLIED** — renamed `enterMs` |
| 3 | Audio crossfade unhandled: firing at dialog-open then cancelling leaves the wrong era's bed playing | 8/10 | **APPLIED** — crossfade on `'advance'` settlement only |
| 4 | T3 bundled a structural refactor with new behavior | 7/10 | **APPLIED** — split T3a (pure) / T3b (behavior) |
| 5 | **REGRESSION:** `scrollChapterToEnd()` assumes auto-completing transitions; the existing 3-chapter chain test hangs on the dialog | 9/10 | **APPLIED** — T11b, mandatory under the regression iron rule |

Finding 3 is the one neither the CEO review nor Codex caught: `transition.ts:143` fires
`crossfadeForTransition` *before* the transition runs. On a cancellable transition that
means the ambient bed can fade into a chapter the user never enters — Browser Wars audio
playing over an on-screen Early Web.

## NOT in scope (eng review additions)

- **Generalized runner registry** — still deferred to a second DOM transition (BSOD).
- **`<dialog>` polyfill** — native support has been cross-browser since 2022–23; the
  project already requires WebGL2-era browsers, and the `fadeSwap` path covers the rest.

## Worktree parallelization

| Lane | Steps | Modules | Depends on |
|---|---|---|---|
| A | T4, T5, T9 | `docs/`, `assets/` | — |
| B | T1, T2, T2b, T2c, T3a, T3b | `src/engine/`, `src/data/`, `tests/` | — |
| C | T6, T7, T8, T10, T11, T11b | `src/chapters/`, `src/ui/`, `index.html` | A + B |

Launch **A and B in parallel worktrees** — content/design authoring shares no module with
the engine work. Merge both, then C. Lane C is sequential internally (T6 and T7 must be
one commit).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 6 proposals, 5 accepted, 1 deferred |
| Outside Voice | Codex | Independent 2nd opinion | 1 | issues_found | 12 findings, 12/12 applied |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | recommended before implementation |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** 12 findings, all applied. Three verified directly against source before
  acting: `scroll-locked` disables pointer events (`global.css:90`), `isInitialized` is
  called from nowhere (`chapter.ts:70`), `fireBackwardsNav` is private (`scroll.ts:169`).
- **CROSS-MODEL:** no tension — every Codex finding was a defect in the draft, not a
  difference of opinion. The two reviews found disjoint problem classes: Codex caught
  unverified assumptions about existing code; the eng review caught a missing platform
  built-in, a lifecycle gap in audio, and a test regression. Neither would have found the
  other's set.
- **VERDICT:** CEO + ENG CLEARED — ready to implement. `/plan-design-review` recommended
  first, since Section 11 rated AI-slop risk HIGH for this specific chapter.

NO UNRESOLVED DECISIONS
