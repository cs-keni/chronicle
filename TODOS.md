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

## TODO-003: "Now" chapter design brief (2028-feeling UI)

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

## TODO-004: ARPANET chapter content research and writing

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
