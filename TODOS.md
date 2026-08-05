# Chronicle — TODOS

Deferred items from plan review. Each item has the context needed to pick it up
in any future session without relying on chat history.

---

## TODO-001: html2canvas spike before transition engine

**What:** Before building the CRT power-off transition engine, run a 30-minute
spike: render the ARPANET chapter with all CSS effects (SVG filter, scanlines,
vignette, Courier New), call `html2canvas()`, measure capture time and inspect
output fidelity.

**Why:** The entire transition architecture (D11) depends on html2canvas capturing
a live CSS chapter as a WebGL texture within ~200-400ms. Complex CSS (SVG filters,
variable fonts, gradients) is known to cause html2canvas inaccuracies and slowdowns.
If this doesn't work on the ARPANET chapter, the pipeline needs a different approach
before any transition code is written.

**Pros:** Catches a foundational risk before a week of work is built on a wrong
assumption. 30-minute spike is cheap.

**Cons:** None — this validates the architecture, not a nice-to-have.

**Where to start:** `src/shaders/crt-power-off/` — create a throwaway `spike.ts`
that mounts the ARPANET chapter, calls html2canvas, logs timing, and screenshots
the output. Compare to a real screenshot of the same chapter.

**Depends on:** ARPANET chapter CSS being implemented (T4, T7 in Phase 1).

---

## ~~TODO-002: SF Pro font licensing clarification in SPEC.md~~ ✓ DONE

**What:** Update the Modern chapter typography spec to be explicit about SF Pro's
legal status. SF Pro cannot be downloaded and hosted as a web font — it is
Apple-proprietary. Update SPEC.md to specify the correct font stack:
`-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif`.

**Why:** A future contributor reading the spec's current text ("Geist, Inter, SF Pro.
Variable weight.") might download and host SF Pro, which is a font license violation.
The system font stack is correct for web use: SF Pro appears on Apple devices legally
(system font reference), Inter/Geist appears on everything else.

**Pros:** Prevents a legal issue before it's committed. 15-minute edit.

**Cons:** None.

**Where to start:** SPEC.md → Chapter Visual Identities table → "Now" row →
Typography column. Also update the Key Design Decisions or add a note in the
Technical Stack section about the font licensing constraint.

**Depends on:** Nothing. Can be done immediately.

---

## ~~TODO-003: "Now" chapter design brief~~ ✓ DONE → `docs/FIGMA-ERA-BRIEF.md`

**What:** Produce a 1-2 page design brief for the Modern/"Now" chapter before
starting its implementation. Research speculative 2028 interface patterns and
commit to a visual direction.

**Why:** The spec explicitly says the "Now" chapter "requires the most creative
design work in the project" and "should push into something that feels ahead of
where design is." This is the only chapter where the design brief is intentionally
undefined. Going into implementation without a direction leads to generic
glassmorphism (which the spec explicitly wants to avoid).

**Pros:** Locks in a visually ambitious direction before building. Prevents rework.
**Cons:** Requires 1-2 hours of dedicated creative/research time (not engineering).

**Research directions:**
- Apple Vision Pro UI patterns (spatial UI without hardware dependency)
- Speculative design from Figma's Config 2024/2025 keynotes
- "Ambient computing" UI concepts (UI that recedes rather than demands attention)
- AI-native interfaces: UI that changes based on inferred context
- Motion as primary communication (reduce text, increase choreography)

**Where to start:** Create `docs/NOW-CHAPTER-BRIEF.md`. Research for 60-90 min,
write 1 page of visual direction, share for feedback before implementing the chapter.

**Depends on:** Nothing. Should be done BEFORE Phase 1 Modern chapter implementation.

---

## ~~TODO-004: ARPANET chapter content research and writing~~ ✓ DONE → `docs/ARPANET-CONTENT.md`

**What:** Research and write 5-8 facts/artifacts about how computing interfaces
looked in 1969–1982 (visual/design history only — per D6 content scope decision).

**Why:** The spec says "content comes before animation. If a chapter has bad facts
or shallow content, no animation saves it." The ARPANET chapter needs real historical
content about the VISUAL grammar of early computing before the chapter is built
around it. Placeholder content leads to layout decisions that don't fit real content.

**Pros:** Establishes the soul of the chapter before the structure. Prevents content
retrofit (which is always harder than content-first design).

**Cons:** Requires historical research, not just engineering.

**Content scope (D6):** Visual/design history only. Focus on:
- What did a VT100/VT52 terminal session look like and why?
- The visual language of mainframe terminals: amber vs. green phosphor, why?
- Xerox PARC's Alto GUI (1973): what was visually revolutionary about it?
- The ARPANET NCP interface: what did network communication look like visually?
- Typography constraints: why Courier/monospaced? What made it feel authoritative?

**Research sources:**
- Computer History Museum (computerhistory.org/collections/)
- Xerox PARC Archive at Stanford
- RFC 1 (1969): what did early ARPANET docs look like typographically?
- CHM's "Birth of the Web" collection

**Where to start:** Create `docs/ARPANET-CONTENT.md`. 5-8 facts minimum. For each:
{ headline, year, body (2-3 sentences), visual_artifact (description of what to show) }

**Depends on:** D6 decision (visual/design history only) — already decided.
Should be done BEFORE Phase 1 ARPANET chapter implementation.

---

## TODO-005: ARPANET phosphor glow SVG filter spike

**What:** Iterate `feGaussianBlur` sigma values (suggest testing σ=2, σ=3, σ=6) and `feColorMatrix` channel weights against the quality target reference (ThinkPad X61 running a green-screen BBS). Lock the winning values in SPEC.md.

**Why:** The plan specifies `feColorMatrix + feGaussianBlur` on the chapter root but no values. Two implementers will produce completely different glows — one too subtle (no atmosphere), one too heavy (garish). Quality target #1 says "the phosphor glow bleeding around bright characters" — that is the visual bar. Without locked values, this requires a redesign round after implementation.

**Pros:** 30-minute visual spike prevents a Week 2 redesign. Exact values can be documented and versioned.
**Cons:** None — this validates the most subjective visual effect in the project.

**Context:** The ARPANET chapter's amber phosphor glow is the defining visual of Chronicle's most critical chapter. It must feel like real CRT hardware, not a CSS novelty. Reference image: `computerhistory.org/collections/` VT100 terminal photography. Try: sigma=3 as baseline; raise to 6 if the glow feels weak at normal pixel density.

**Where to start:** Create `src/chapters/arpanet/spike-glow.html` — mount the chapter DOM with a test sentence in Courier New, apply the SVG filter with varying sigma, screenshot the result. Compare to reference. Lock sigma + matrix in `SPEC.md` → ARPANET row → Texture column.

**Depends on:** ARPANET chapter CSS skeleton being in place (Week 2 start).

---

## ~~TODO-006: WebGL2-absent hardening — degrade instead of throw~~ ✓ DONE 2026-08-03 (`61c7d9d`)

**Resolution:** `webgl.ts` no longer throws. `webgl.supported` is false when WebGL2 is
absent; every GL method no-ops; `precompileAll` leaves the shader map empty so
`getShader()` returns undefined. `transition.ts` routes `!webgl.supported` to `fadeSwap`
alongside the touch and reduced-motion cases. The `getContext` probe is wrapped in
try/catch, not merely null-checked — hardened browsers throw from the probe. Guarded by
`tests/webgl-fallback.spec.ts` (3 tests, all failing before the fix, confirming the blank
page was real and not theoretical).

Original entry preserved below for context.

---


**What:** Wrap WebGL2 context creation in `src/engine/webgl.ts` (line ~40, throws
`'WebGL2 not available'` at module construction) so an absent context degrades to the
fade-only transition path instead of throwing and crashing the whole app.

**Why:** `webgl.ts` is constructed eagerly from `main.ts`. If `getContext('webgl2')`
returns null (old browser, blocklisted GPU, headless env), the throw kills the entire
ES module graph before any chapter renders — a blank page, not a degraded experience.
The touch/reduced-motion `fadeSwap` fallback in `transition.ts:89` cannot help because
it never runs; the crash is at construction, upstream of it. ~98% of browsers have
WebGL2, so this is low-incidence but hard-crash severity.

**Pros:** Turns a total-blank-page failure into a graceful fade-only degradation.
Chapters still render at full CSS fidelity; only shader transitions are lost.
**Cons:** Small refactor to make `webgl` construction non-throwing (a null-context
flag + guards in `resizeForTransition`/`render`/`precompileAll`); transition engine
must check the flag and route to `fadeSwap`.

**Context:** Surfaced by Codex outside voice during the Phase 2 Slice 1 eng review
(2026-07-08). Pre-existing since Phase 1 — NOT introduced by the Early Web slice, which
is why it was deferred out of that slice's scope rather than folded in. Reproduce by
stubbing `getContext('webgl2')` to return null.

**Where to start:** `src/engine/webgl.ts` constructor — set a `this.available = false`
flag instead of throwing when `gl` is null; guard the public methods; in
`src/engine/transition.ts` `handleTransitionRequest`, treat `!webgl.available` the same
as `isTouchDevice` (go straight to `fadeSwap`).

**Depends on:** Nothing. Can be done independently of Phase 2.

---

## TODO-007: Generate chapter DOM (divs + spacers) from the manifest

**What:** Generate the `.chapter-scene` divs and `.chapter-scroll-spacer` elements from
`src/data/manifest.ts` at boot (in `main.ts`), so `index.html` no longer hand-lists
chapters and adding a chapter becomes fully data-only.

**Why:** After the Phase 2 Slice 1 manifest refactor, router validity and scroll order
derive from the manifest, but the HTML chapter divs + spacers stay hand-authored (A1
option A). That still leaves two hand-edited, order-sensitive lists in `index.html` per
new chapter. Generating them from the manifest closes the last hand-wired coupling and
pays off across the remaining 4 chapters.

**Pros:** Adding a chapter becomes a single manifest entry + a chapter module — no
`index.html` edits, no spacer-order mistakes. **Cons:** Changes a working boot path;
must preserve the router-before-scroll init ordering (GSAP position bug, ENGINEERING_LOG
2026-06-30) and the nav-latch guards (`nav-latch-race` learning). Non-trivial to get the
lazy-init + IntersectionObserver timing identical to the hand-authored version.

**Context:** Surfaced as A1 option B during the Phase 2 Slice 1 eng review (2026-07-08),
deferred to keep that slice's boot-path change small. Revisit when hand-authoring the
remaining chapter div/spacer pairs becomes the friction point.

**Where to start:** `src/main.ts` — after importing the manifest, loop over live
chapters to create `#chapter-{id}` scenes + `data-chapter-id` spacers before
`initRouter()`. Keep `#chapter-lobby` handling as-is. Verify against the existing
Playwright e2e + nav-latch tests.

**Depends on:** Phase 2 Slice 1 manifest (`src/data/manifest.ts`) landing first.

**Update 2026-08-03 (Slice 2 CEO review):** re-evaluated for folding into Slice 2 and
**deferred again, to Slice 3**. Slice 2 already changes the transition engine
(`kind` discriminator + a DOM runner + a new `transition-paused` body state). Stacking a
second boot-path change into the same slice is precisely how `nav-latch-race` happened —
an intermittent bug that only reproduced under real network latency and never on
localhost. Additional evidence for doing it eventually: the Slice 2 review had to add
**T2b**, a wiring-completeness test, purely because chapter scenes, spacers, and
`main.ts` registration are still hand-wired. TODO-007 would delete the need for that test.

---

## TODO-008: Validate Early Web mobile horizontal-scroll on a real device

**What:** Once the Early Web chapter is built, validate on a real phone that the period
browser-window **horizontal-scroll** behavior (locked in EARLY-WEB-BRIEF.md P7.1) reads
as intentional 1993 authenticity, not a broken layout. Confirm the hit-counter progress
indicator and the Mosaic page-load arrival assembly still work at 375px.

**Why:** The design decision deliberately does NOT reflow the table layout to a modern
single-column stack (that would break the era illusion). Instead the framed browser
window horizontal-scrolls (or scales as one unit). This is period-accurate but an unusual
mobile UX — worth confirming it feels intentional on real hardware, since "looks broken"
and "looks authentically 1993" are a fine line on a 375px screen.

**Pros:** Catches the case where the era illusion reads as a bug to a modern phone user.
**Cons:** Needs a real device (or accurate emulation); can't fully trust desktop devtools
for touch-scroll feel.

**Context:** Surfaced during the Phase 2 Slice 1 design review (2026-07-08, P7.1 decision).
The design decision is LOCKED — this is a post-build verification, not a reopen. Pairs with
the cross-browser testing that was deferred out of Phase 1 (that deferral was Chrome-only;
this is specifically the mobile-viewport feel of one chapter).

**Where to start:** After Early Web ships to the Vercel preview, open `#early-web` on a
real phone. Check: does the browser-frame horizontal-scroll feel deliberate? Do the
counter + arrival assembly hold at 375px? Consider a `scale-to-fit` fallback if
horizontal-scroll reads as broken.

**Depends on:** Early Web chapter (Phase 2 Slice 1) being built.

---

## TODO-009: Browser frame morphs Netscape 4 → IE4 across the Browser Wars scroll

**What:** Instead of a fixed IE4 frame, start the Browser Wars chapter framed in Netscape
Navigator 4 (continuing Early Web's Netscape 1.0 lineage) and transform the chrome into
Internet Explorer 4 as the visitor scrolls 1995 → 2001. The browser war happens *in the
frame* while you read about it.

**Why:** `SPEC.md:87` says "the visual transitions ARE the product." This is the strongest
available expression of that inside a single chapter, and it is uniquely well-matched to
this chapter because the era is literally named after the thing the chrome would be doing.
The fixed-IE4 version (shipped in Slice 2) already tells the story across two chapters —
Netscape 1.0 in Early Web, IE4 here — but tells it in two still frames rather than one
motion.

**Pros:** Turns scroll position into historical argument; the single most memorable idea
surfaced during the design review; reuses the progress-driven layer pattern the chapter
already has for fact reveal.
**Cons:** Needs a progress-driven chrome layer with two full sets of browser chrome assets
(toolbar icons, throbber, title bar) and a crossfade or morph between them. Roughly doubles
the T9 chrome asset inventory.

**Context:** Surfaced during the Phase 2 Slice 2 design review (2026-08-04) as option 6B.
Deferred because Slice 2 already rewrites the transition engine (`kind` discriminator, DOM
runner, new `transition-paused` body state), and stacking a second visual system into the
same slice is the pattern that produced `nav-latch-race`. The fixed-frame decision is
LOCKED for Slice 2 — this is an enhancement, not a reopen.

**Where to start:** After Browser Wars ships. The chapter's `onChapterProgress` already
drives sequential fact reveal; the chrome swap hangs off the same signal. Author the
Netscape 4 chrome asset set first and verify the two frames are dimensionally identical so
the morph does not reflow the page inside them.

**Depends on:** Browser Wars chapter (Phase 2 Slice 2) being built.

---

## TODO-010: Design the Browser Wars → Figma Era exit contrast

**What:** Give the `browser-wars → figma-era` transition the same design attention the
`early-web → browser-wars` dialog got. Right now glass-shatter is a relocated registry key
with no chapter-specific design thinking behind it.

**Why:** This is the project's second-most violent contrast — maximum chromatic chaos
running into near-black minimalism — and it is currently the *only* major transition in
Chronicle that nobody has designed, only wired. `SPEC.md:59` calls the violence of the
contrast "intentional," which it cannot be while it is incidental.

**Pros:** The arrival into Figma Era is the payoff for the whole Browser Wars chapter;
getting it right retroactively improves the chapter you just left. Also the last transition
before the project's most polished existing chapter, so it is the one most likely to be
seen.
**Cons:** glass-shatter already exists and works; this is refinement, not repair. Easy to
over-invest.

**Context:** Surfaced during the Phase 2 Slice 2 design review (2026-08-04). glass-shatter
was authored for `early-web → figma-era` as a temporary bridge and is being relocated by T7
to `browser-wars → figma-era`. It was never designed for its new neighbours. Questions worth
answering: does the shatter read differently coming out of a magenta-and-lime page than it
did out of system gray? Should the fragments carry the era's colours? Is there an exit beat
(the mirror of the 56k arrival assembly) where the chaos drains before it shatters?

**Where to start:** After Browser Wars ships, view the transition live and judge it against
the `early-web → browser-wars` dialog, which now has a full design spec in
`docs/BROWSER-WARS-BRIEF.md`. Run `/design-review` on the live transition rather than
planning it cold.

**Depends on:** Browser Wars chapter + T7 registry move (Phase 2 Slice 2).
