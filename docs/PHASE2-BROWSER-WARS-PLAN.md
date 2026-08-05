# Phase 2 Slice 2 — Browser Wars (1995–2001)

Status: **SHIPPED 2026-08-04.** Plan locked via `/plan-ceo-review` 2026-08-03, design
locked via `/plan-design-review` 2026-08-04, implemented in 3 commits the same day.
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

**Added by design review:**
- **Font fallback holds** — with MS core fonts unavailable, the chapter still renders in a
  Comic-Sans-metric face (Comic Relief), not the system default. This is the AI-slop
  blacklist-11 regression guard; without it the failure is silent on Linux/Android.
- **Fact-text contrast** — computed contrast of `.bw-well` body copy ≥ 4.5:1 (target 17.4:1).
- **Touch targets** — dialog OK/Cancel ≥ 44px tall under touch emulation.
- **Lobby card goes live correctly** — `role="button"`, tabbable, "Explore →", and a visible
  focus ring that survives the `border-image` (assert `outline` is set).
- **Counter is interactive** — it is a `<button>`, Enter/Space increments, value changes.
- **Motion budget** — no more than 3 concurrently animated elements in the viewport.

**Chaos / hostile QA:**
- 5 rapid OK clicks → exactly one transition, no double-swap.
- Click OK then immediately hit browser Back.
- Scroll to dwell, wait past 15s, then click OK (auto-advance already ran — must not
  double-fire).

---

## Design — LOCKED via `/plan-design-review` 2026-08-04

**Full brief: `docs/BROWSER-WARS-BRIEF.md`.** Mockup:
`claude.ai/code/artifact/c060c5e0-f3df-4768-97ab-77aefc932cb2` (source in
`~/.gstack/projects/chronicle/designs/browser-wars-20260804/`). The brief is the source of
truth for T5/T6/T9/T10; what follows is the delta this plan needs to know about.

**AI slop risk: HIGH.** Geocities pastiche is a commodity template in 2026. Chronicle wins on
the *transition* and the *arc*, never on "looks 90s." Design review rated the plan **4/10 on
design completeness** — the engineering was 10/10 and the design was one paragraph naming four
colors. The brief closes that with 31 hex tokens, a type table, a layout diagram, an arrival
beat, a motion budget, and a dialog spec.

### The governing idea

**The page inside the fiction has no hierarchy. The chapter does.** The fact well is the
widest, most central, calmest object; every loud thing lives in the rails and never occludes
content. Decoration is period-ugly; fact text holds WCAG AA (`#1A1A1A` on `#FFFFFF` = 17.4:1).

### Three conflicts with already-shipped code, all resolved

| # | Conflict | Evidence | Resolution |
|---|---|---|---|
| C1 | D3.1 (Netscape throbber) vs D3.3 (IE4 frame) — an IE4 window cannot carry an N-comet | decided separately, never cross-checked | **[auto-decided] IE4 frame + IE4 throbber.** D3.1's throbber is REVERSED. Netscape demotes to a badge — the loser reduced to a button. Early Web (Netscape 1.0) → Browser Wars (IE4) tells the browser war in two window chromes with no copy. |
| C2 | Palette omits `#00FFFF` | `lobby/style.css:184` ships a 5-stop gradient with cyan | **cyan added** to the chapter palette. Card and chapter share one palette, per the Early Web precedent. |
| C3 | Counter would reuse Early Web's `#00FF00` odometer | `early-web/style.css:277` | **counter is red `#FF2400`.** Two chapters cannot share one artifact. |

### The font stack is a live defect, not a polish item

`lobby/style.css:182` ships `'Comic Sans MS', 'Chalkboard SE', cursive`. Chalkboard SE is
macOS-only, so on Linux and Android both fall through to a generic `cursive` that is usually
not installed — landing on the system default. That is AI-slop blacklist item 11 arriving by
accident on roughly a third of devices, and the "correctly ugly" thesis dies silently.
**Fix: self-host a bundled comic face** (SIL OFL). Shipped as **Comic Neue** (23 KB, both weights, subset) — Comic Relief was the original call for metric compatibility but could not be sourced; Comic Neue is a redesign rather than a metric clone, so it sets slightly narrower. Cosmetic difference between two comic faces, not the failure this prevents.
**Papyrus is dropped** — no free metric clone, and no job left once WordArt ships as an SVG
asset rather than a typeface (which is what WordArt always was).

### New design decisions folded in

- **[auto-decided] Arrival beat — the 56k page load.** Tile → WordArt → marquee → well →
  GIFs popping in out of order and late, throbber spinning, all under 1.0s. **Jank is timing,
  never layout** — explicit `width`/`height` reserves space so nothing shifts. Without this,
  "lands like a wall" is an assertion rather than an experience. Early Web has an arrival
  beat; this chapter arrives by an *actively consented* OK click and had none.
- **[auto-decided] The visitor counter is click-to-inflate.** `SPEC:83` names it as an
  interactive artifact and the plan specified zero interaction. Clicking bumps it, as fast as
  you click — which teaches the actual fact by letting the visitor commit the fraud 90s page
  owners committed. Real `<button>`, accessible name, `aria-live="polite"`, no persistence.
- **[auto-decided] Six facts** (T4 said 6–8), matching Early Web's count.
- **[auto-decided] Facts reveal sequentially on scroll** via `onChapterProgress`, same as
  ARPANET and Early Web. Decorative links are **inert + `aria-hidden`**, same as Early Web.
- **[auto-decided] Mobile: the frame scales as one unit**, rails unwrap below the well, well
  never under 14px. This deliberately DIFFERS from Early Web's horizontal-scroll call, because
  TODO-008 shows that approach is unverified on hardware and this chapter carries an
  interactive dialog that must be reachable without horizontal panning.
- **Dialog buttons grow to 44px minimum touch height.** The one place period accuracy yields.
  This transition has **no `fadeSwap` downgrade on touch** — it is the only path mobile users
  get, so a 23px Win 3.1 button is not acceptable.
- **Backdrop blur is 4px**, deliberately not one of the three values already in the codebase
  (20/12/8px). Early Web must stay legible behind the dialog: the beat is being asked whether
  to leave a place you can still see.
- **Motion budget, binding:** 2 Hz max per element, max 3 concurrently animated elements in
  viewport. WCAG 2.3.1 fails above 3 flashes/sec; this sits at two-thirds of the threshold by
  construction rather than by after-the-fact measurement.

### System rule promoted (belongs in `AI_CONTEXT.md`)

Every chapter's scroll-progress indicator is a **period-native artifact of its own era**,
never a generic bar. ARPANET = amber ASCII block bar. Early Web = green odometer. Browser
Wars = IE4 throbber. Three chapters deep; chapter 4 should inherit it, not rediscover it.

**Emotional arc:** Early Web is quiet system gray. Browser Wars must land like a wall. The
violence of the contrast is the product (SPEC:59). The dialog's narrative job: *"Are you sure
you want to proceed?"* is a warning, the visitor clicks OK, and 1998 assaults them. Setup and
punchline. The arrival beat is the payoff and neither half works alone.

---

## Implementation Tasks

**Sequencing corrected per Codex #11.** The first draft put the engine before content and
design, contradicting the project's own "content before animation" rule, and split the
chapter (T6) from the registry move (T7) so the tree would sit knowingly red between
them. Content and design now come first, and the chapter + registry move land in **one
commit**.

### Commit 1 — content + design (no code)

- [x] **T5 (P1, human: ~3h / CC: ~25min)** — design — `docs/BROWSER-WARS-BRIEF.md`, every color as hex
  - Surfaced by: Section 11 — HIGH AI-slop risk; `vague-color-references` pitfall (9/10)
  - **DONE 2026-08-04** via `/plan-design-review`. 31 hex tokens, type table, layout diagram,
    fact-rendering pattern, arrival beat, motion budget, dialog spec, responsive + a11y.
    Mockup published: `claude.ai/code/artifact/c060c5e0-f3df-4768-97ab-77aefc932cb2`
- [x] **T4 (P1, human: ~2h / CC: ~20min)** — content — `docs/BROWSER-WARS-CONTENT.md`, **6** facts
  - Surfaced by: project rule — content before animation
  - **Count narrowed 6–8 → 6** by design review (matches Early Web; keeps the well scrollable
    rather than a wall of text)
  - Verify: visual/design-history scope; years accurate; mirrors ARPANET's content-doc shape
- [x] **T9 (P1, human: ~5h / CC: ~40min)** — assets — full authored asset inventory, **≤220 KB**
  - Surfaced by: D3.2. **Raised P2 → P1** per Codex #11. **Scope and budget both widened by
    design review** — the original list covered GIFs only and omitted the badges (now
    load-bearing narrative: Netscape demoted from browser to button), the IE4 toolbar icons,
    and the WordArt heading. Incomplete asset lists are where generic icons and emoji enter
    (AI-slop blacklist item 7).
  - Inventory (all 16-color dithered, all authored originals): 3 animated GIFs · **3 static
    first-frame PNG siblings (mandatory)** · 4 badges at 88×31 · 8 IE4 toolbar icons at 16×16 ·
    1 WordArt SVG with paths flattened · 1 background tile as a real 48×48 GIF
  - Verify: 220 KB budget held; `loading="lazy"`; explicit width/height on every image;
    **measured** flash rate ≤2 Hz per element
- [x] **T9b (P1, human: ~1h / CC: ~10min)** — assets — self-host a bundled comic face (SIL OFL)
  - Surfaced by: design review — **live defect, not polish.** `lobby/style.css:182` ships
    `'Comic Sans MS','Chalkboard SE',cursive`; Chalkboard SE is macOS-only, so Linux/Android
    fall through to a generic `cursive` that is usually absent and land on the system default.
    That is AI-slop blacklist item 11 reached by accident on ~1/3 of devices.
  - Files: `src/assets/fonts/`, `src/chapters/browser-wars/style.css`, `src/chapters/lobby/style.css`
  - Verify: chapter renders in a Comic-Sans-metric face on a Linux browser with no MS fonts
    installed; **drop Papyrus entirely** (no free metric clone; WordArt is an SVG asset now)

### Commit 2 — engine (behavior-preserving for existing transitions)

- [x] **T1 (P1, human: ~2h / CC: ~15min)** — data — `kind` discriminator; `RunnerId` literal union; optional `shader?` on the dom variant
  - Surfaced by: D1; Codex #3 (hybrids must stay representable), #4 (`string` admits invalid state)
  - Files: `src/data/transitions.ts`
  - Verify: `tsc` clean; existing shader transitions byte-identical in behavior
- [x] **T2 (P1, human: ~1h / CC: ~10min)** — tests — transition adjacency drift guard
  - Surfaced by: Section 2 — CRITICAL GAP (silent dead-end chapter)
  - Files: `tests/unit/transitions.test.ts` (new)
- [x] **T2b (P1, human: ~1.5h / CC: ~15min)** — tests — live-chapter wiring completeness (scene + spacer + registration)
  - Surfaced by: Codex #10 — adjacency alone checks registry keys, not DOM/`main.ts` wiring
  - Files: `tests/browser-wars.spec.ts` (new)
- [x] **T2c (P1, human: ~1h / CC: ~10min)** — engine — actually implement the target-initialized check before capture
  - Surfaced by: Codex #9 — Slice 1 claimed this mitigation; `isInitialized()` is called from nowhere
  - Files: `src/engine/transition.ts`
  - Verify: capture waits for / asserts `chapterManager.isInitialized(toId)`
- [x] **T3a (P1, human: ~3h / CC: ~20min)** — engine — **pure refactor**: extract `returnToChapter(id, pct)` from `fireBackwardsNav`
  - Surfaced by: Eng review — Beck's "make the change easy, then make the easy change".
    The first draft bundled this structural change with the new behavior; split so each
    is independently revertible.
  - Files: `src/engine/scroll.ts`
  - Verify: **zero behavior change** — full existing suite green before any new code lands
- [x] **T3b (P1, human: ~1.5d / CC: ~55min)** — engine — `win31-dialog` runner on native `<dialog>` + `transition-paused` state
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

- [x] **T6 (P1, human: ~2d / CC: ~70min)** — chapter — `src/chapters/browser-wars/` via `createChapter`
  - Files: chapter dir; `src/data/chapters.ts`; `src/data/manifest.ts`; `index.html`; `src/main.ts`
  - **Build to `docs/BROWSER-WARS-BRIEF.md`, not to this plan.** Includes, per design review:
    the IE4 frame + **IE4 throbber** (D3.1 reversed); the asymmetric `172px / 1fr / 148px`
    grid — **never `repeat(3, 1fr)`**, which is AI-slop blacklist item 2 one keystroke away;
    the fact well with sequential scroll reveal; the **56k arrival-beat assembly** (<1.0s,
    jank in timing never layout); the **click-to-inflate visitor counter** as a real
    `<button>`; decorative links inert + `aria-hidden`
  - Verify: zero `border-radius` in the chapter; every image has explicit width/height
- [x] **T7 (P1, human: ~1h / CC: ~10min)** — data — glass-shatter → `browser-wars->figma-era`; remove `early-web->figma-era`
  - **Must land in the same commit as T6** (Codex #11) — flipping the chapter live
    without the registry move leaves a dead-end chapter
- [x] **T8 (P1, human: ~2.5h / CC: ~20min)** — ui — code-overlay REGISTRY entry + share-card branch + **lobby card live state**
  - Surfaced by: `chronicle-global-ui-per-chapter` pitfall (9/10) — definition of done
  - **Lobby card added by design review.** `manifest.ts:26` flipping to `live: true` changes
    the card from `role="presentation"` to `role="button"` and swaps "Coming Soon" for
    "Explore →" (`lobby/index.ts:20-22`, `:38`) — and the card has **no designed live state**.
    Add: the generic live lift (`lobby/style.css:111`), an era-specific hover matching the
    ARPANET (`:135`) / Figma Era (`:163`) precedent (rainbow `border-image` rotates, 3s/rev),
    and `outline: 3px solid #00FFFF; outline-offset: 2px` for focus — `outline` renders
    outside `border-image` so it cannot be swallowed.
  - Files: `src/ui/code-overlay.ts`, `src/ui/share-card.ts`, `src/chapters/lobby/style.css`
- [x] **T10 (P1, human: ~1.5d / CC: ~55min)** — a11y — flash budget, reduced-motion, AA, touch targets
  - Surfaced by: D5, D6; **rescoped twice** — per Codex #8 (CSS cannot pause a GIF or control
    a native `<marquee>`; needs JS plus static first-frame alternatives) and again by design
    review (touch targets, marquee AT handling, counter semantics)
  - Files: `src/chapters/browser-wars/index.ts`, `style.css`, `assets/`,
    `src/transitions/win31-dialog.css`
  - **Design-review additions:** dialog buttons grow to **44px min touch height** (period
    accuracy yields here — this transition has no `fadeSwap` downgrade on touch, so it is the
    only path mobile gets); `<marquee>` is `aria-hidden` with a visually-hidden static text
    sibling (AT handling of `<marquee>` is unreliable and the element is deprecated); counter
    is a `<button>` with accessible name + `aria-live="polite"`; dialog buttons need a
    `:focus-visible` ring **in addition to** the 1px dotted period rect, which reads poorly on
    `#C0C0C0`
  - Verify: flash rate ≤2 Hz per element and ≤3 concurrent animated elements; marquee stops;
    GIFs swap to stills; fact text 17.4:1; `#00FF00`/`#FFFF00`/`#FF00FF` carry no text on white
- [x] **T11 (P1, human: ~3h / CC: ~25min)** — tests — full Playwright suite per the test plan
- [x] **T11b (P1 — CRITICAL REGRESSION, human: ~1h / CC: ~10min)** — tests — repair `scrollChapterToEnd` for gated transitions
  - Surfaced by: Eng review test diagram — **mandatory under the regression iron rule, no
    approval needed**. `tests/visual.spec.ts:52` `scrollChapterToEnd()` assumes every
    transition completes on its own. Once Browser Wars is inserted, the existing
    `ARPANET → Early Web → Figma Era` chain test scrolls Early Web to its end and **hangs
    on the dialog** until the 8s timeout. This test breaks the moment T6/T7 land.
  - Files: `tests/visual.spec.ts`
  - Verify: helper detects a gated transition, drives the dialog, and the 4-chapter chain
    passes; the existing 3-chapter assertions still hold for the ungated legs
- [x] **T12 (P2, human: ~30min / CC: ~10min)** — docs — ENGINEERING_LOG / HANDOFF / AI_CONTEXT / CURRENT_TASK / PHASES / TODOS
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
| A | ~~T5~~ (done), T4, T9, T9b | `docs/`, `assets/`, `src/assets/fonts/` | — |
| B | T1, T2, T2b, T2c, T3a, T3b | `src/engine/`, `src/data/`, `tests/` | — |
| C | T6, T7, T8, T10, T11, T11b | `src/chapters/`, `src/ui/`, `index.html` | A + B |

Launch **A and B in parallel worktrees** — content/design authoring shares no module with
the engine work. Merge both, then C. Lane C is sequential internally (T6 and T7 must be
one commit).

## Design review findings (7 passes, 4/10 → 9/10)

Run 2026-08-04. Full brief written to `docs/BROWSER-WARS-BRIEF.md`; mockup hand-authored
(the gstack designer had no API key configured) and published at
`claude.ai/code/artifact/c060c5e0-f3df-4768-97ab-77aefc932cb2`.

| Pass | Before | After | Headline finding |
|---|---|---|---|
| 1 · Information Architecture | 3/10 | 9/10 | 8+ competing elements, no stated hierarchy. Resolved: the page inside the fiction has none, the chapter does — well gets primacy, noise to the rails. |
| 2 · Interaction States | 4/10 | 9/10 | Transition states were already 10/10 (the rescue registry is excellent). The chapter's own states were near-absent — the visitor counter, named as an interactive artifact by `SPEC:83`, had zero interaction spec. |
| 3 · User Journey | 5/10 | 9/10 | No arrival beat. Early Web has one; this chapter arrives by an *actively consented* OK click and specified nothing for the first 800ms. "Lands like a wall" was an assertion. |
| 4 · AI Slop Risk | 5/10 | 9/10 | 0 of 7 hard rejections. 2 blacklist hits: item 11 (`system-ui` as display face) arriving **by accident** via the font fallback, and item 7 (emoji) enabled by an incomplete asset inventory. |
| 5 · Design System | 4/10 | 9/10 | **Three conflicts with already-shipped code** — the throbber/frame contradiction, the missing `#00FFFF`, and the counter colliding with Early Web's green odometer. |
| 6 · Responsive & A11y | 5/10 | 9/10 | A11y intent was strong (D5/D6); responsive was absent entirely. Touch targets on the dialog were the sharp edge: 23px Win 3.1 buttons on the one transition with **no touch fallback**. |
| 7 · Unresolved Decisions | — | — | 18 resolved, 2 deferred to TODOs (TODO-009 frame morph, TODO-010 exit contrast). |

**The three findings worth reading if you read nothing else:**

1. **The font fallback is a live defect that fails silently.** `lobby/style.css:182` already
   ships a stack whose only non-Microsoft entry is macOS-only. On Linux and Android the
   chapter renders in the system default — AI-slop blacklist item 11, reached by accident, on
   roughly a third of devices, with no error anywhere. The chapter reads as *badly made*
   rather than *1998*, and the whole "correctly ugly" thesis dies. This is T9b.
2. **D3.1 and D3.3 contradict each other.** An IE4 window cannot carry a Netscape throbber.
   Two locked decisions made in separate passes, never cross-checked. The fix is better than
   the original: Early Web (Netscape 1.0 frame) → Browser Wars (IE4 frame) tells the browser
   war in two window chromes, and Netscape demotes to a badge.
3. **The chapter's own interactive artifact had no spec.** The plan freed the counter from
   progress duty specifically so it could be the artifact `SPEC:83` names — and then never
   said what it does. Now: clicking inflates it, which teaches the historical fact by letting
   the visitor commit the fraud 90s page owners committed.

**Method note worth keeping.** The plan is 571 lines of which ~25 were design, and it absorbed
17 engineering findings with real rigor. None of them were about what the thing looks like. A
plan can be exhaustively reviewed and still be 4/10 on the axis nobody reviewed.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 6 proposals, 5 accepted, 1 deferred |
| Outside Voice | Codex | Independent 2nd opinion | 1 | issues_found | 12 findings, 12/12 applied |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 4/10 → 9/10, 18 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** 12 findings, all applied. Three verified directly against source before
  acting: `scroll-locked` disables pointer events (`global.css:90`), `isInitialized` is
  called from nowhere (`chapter.ts:70`), `fireBackwardsNav` is private (`scroll.ts:169`).
- **CROSS-MODEL:** no tension across any of the three reviews — each found a disjoint problem
  class. Codex caught unverified assumptions about existing code; the eng review caught a
  missing platform built-in, an audio lifecycle gap, and a test regression; the design review
  caught three conflicts with already-shipped CSS plus a silent font-fallback failure. None of
  the three would have found the others' set, and the design review's findings were the only
  ones invisible to code inspection alone.
- **STALENESS:** CEO / Eng / Codex reviews were logged at `b9bf061`; HEAD is `f5b29da`, 4
  commits later. Those 4 are docs-and-plan commits (no `src/` changes), so the architectural
  conclusions still hold — but the design review added T9b and widened T6/T8/T9/T10, which
  eng review has not seen. Re-run `/plan-eng-review` before implementing if you want the
  font-hosting and lobby-card work architecturally validated.
- **VERDICT:** CEO + ENG + DESIGN CLEARED — ready to implement. Build T6 against
  `docs/BROWSER-WARS-BRIEF.md`, not against this plan's prose.

NO UNRESOLVED DECISIONS
