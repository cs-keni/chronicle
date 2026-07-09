# Early Web Chapter — Design Brief

**Era:** 1983–1994 · **Chapter id:** `early-web` · **Status:** locked via /plan-design-review 2026-07-08

Design direction for the Early Web chapter. Locks the visual decisions before code
(the `vague-color-references` + `facts-rendering-undefined` learnings require this).
Mockup: `~/.gstack/projects/chronicle/designs/early-web-20260708/` (published artifact
`claude.ai/code/artifact/90b84c81-f18a-4437-a694-f9d8ed322238`). Content facts live in
`docs/EARLY-WEB-CONTENT.md`.

Aesthetic target: a real 1993 web page viewed in **NCSA Mosaic / early Netscape** —
system gray, Times New Roman, blue underlined links, dithered web-safe banner. Earnest,
cramped, typographically plain. The opposite of AI slop by construction.

---

## Palette (every value is hex — no descriptive names)

| Token | Hex | Use |
|-------|-----|-----|
| page | `#C0C0C0` | system-gray page background (the Mosaic default) |
| canvas | `#FFFFFF` | inner content ground where needed |
| ink | `#000000` | Times body text |
| navy | `#000080` | headings, `<hr>` groove rules, banner base |
| link | `#0000EE` | unvisited hyperlink |
| visited | `#551A8B` | visited hyperlink (MUST stay distinct — a11y rule) |
| red | `#CC0000` | year labels, "NEW" alerts |
| teal | `#008080` | web-safe accent, banner dither |
| shell | `#0A0A0A` | dark museum shell around the browser frame |

Constraint: stay inside the **216 web-safe palette** for chapter content — it's both
period-accurate and a fact the chapter teaches.

## Typography

| Role | Face | Size / weight |
|------|------|---------------|
| Headline | Times New Roman (system serif) | 19–30px, 700, navy |
| Body | Times New Roman | 15px / 1.4, black, measured ~60ch |
| Year + code | Courier New | 12–13px, red (year) / black (code) |
| Chrome + widgets | Arial | 11–12px — browser frame, counter, under-construction only |

System fonts only (period-accurate; no web fonts — Times/Courier/Arial were THE web
fonts of 1993). No `@font-face`.

## Layout — full period browser frame (P7.1)

The chapter renders inside a **full Netscape 1.0 / Mosaic browser window** sitting in
the dark museum shell:

```
┌─ dark museum shell (#0A0A0A) ───────────────────────────┐
│  ┌─ browser chrome (beveled #C0C0C0) ────────────────┐  │
│  │ [title bar: gradient #000080→#1084D0 · window ctl]│  │
│  │ [toolbar: Back Forward Home Reload Images (Arial)]│  │
│  │ [location: http://www.chronicle.net/early-web.html]│ │
│  ├────────────────────────────────────────────────────┤ │
│  │ [dithered navy→teal banner · "The Early Web" · NEW]│  │
│  │  gray page · single narrow left-aligned column     │  │
│  │  ── fact ── <hr> ── fact ── <hr> ── fact ──         │  │
│  │  [under construction hazard bar]                   │  │
│  │  [visitor hit-counter] [webring] [last updated]    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Single narrow left-aligned column, table-scaffolded, thin inset/beveled borders.
- The location bar (`http://www.chronicle.net/early-web.html`) is a deliberate
  "you are in 1993" cue.

## Fact rendering (P-content) — resolves `facts-rendering-undefined`

Each fact is a **titled section** in the page flow, separated by `<hr>` groove rules
(the era's own divider):

```
<h2 navy 700>  Headline
<span red courier>  YEAR
<p times 15/1.4>  body (max 60ch)
<hr groove navy>
```

Facts **reveal on scroll** (same pattern as ARPANET's terminal output) — the chapter's
`onChapterProgress` drives sequential appearance. Six facts (see EARLY-WEB-CONTENT.md):
CERN first page (1991), Mosaic's gray page + inline images (1993), blue/purple links
(1993), tables-for-layout (1994), the 216 web-safe palette (1994), GeoCities /
under-construction culture (1994).

## Progress indicator (P7.2) — the visitor hit-counter

Early Web's era-styled scroll-progress indicator is the **green odometer hit-counter**
(black box, `#00FF00` Courier digits, beveled border). Digits tick up as the visitor
scrolls (`000000` → `000427`). This reuses a period artifact AND reinterprets "scroll
progress" as the 90s "how many have visited" trope. (ARPANET uses an amber ASCII block
bar; this is Early Web's equivalent.)

## Arrival beat (P7.3) — Mosaic page-load assembly

When the CRT power-off shader finishes (ARPANET's amber terminal collapses to a white
line), the white line resolves into the gray page, which then **assembles the way 1993
pages did over slow connections**:

1. Dithered banner paints first.
2. Text streams in top-to-bottom.
3. The dithered image + hit-counter pop in last.

Turns the era-jump into a mini story (terminal → the web booting up), not a hard cut.
Reuses the per-fact scroll reveal. Keep the whole assembly under ~1.2s so it reads as
character, not lag.

## Motion & interaction

- **Motion:** one `<blink>`-style "NEW!" on the banner + the animated under-construction
  hazard bar. The page-load assembly. That's it — restraint is period-accurate too.
- **Hover:** links brighten; visited state is real (purple `#551A8B`).
- **`prefers-reduced-motion: reduce`:** blink stops, hazard bar static, page-load
  assembly collapses to an instant paint. (Matches the chapter engine's existing
  reduced-motion handling.)

## Responsive (P7.1 consequence)

The framed browser **window horizontal-scrolls** inside its viewport on narrow screens
(period-authentic — 1993 pages didn't reflow), or the whole frame scales down as one
unit. Do NOT reflow the table layout to a modern single-column stack — that breaks the
era illusion. Touch devices already skip the WebGL shader (fade fallback); the chapter
still renders at full CSS fidelity.

## Accessibility

- Navy/black on `#C0C0C0` passes AA; body text ≥15px.
- Visited vs unvisited link colors stay distinct (universal rule).
- The yellow under-construction bar is decorative — never the sole carrier of info.
- Keyboard focus visible on the (few) interactive elements; the webring/guestbook links
  are period decoration, not real nav — mark `aria-hidden` or make them inert.

## NOT in scope (design decisions deferred)

- **Real guestbook / webring behavior** — period decoration only, inert. No backend.
- **Multiple browser-chrome skins** (Mosaic vs Netscape vs IE) — pick one (Netscape 1.0)
  and commit; don't build a switcher.
- **Animated GIF artifacts as real GIFs** — recreate with CSS (hazard bar) rather than
  sourcing period GIFs (licensing + bundle).
- **Dithered banner as a real ordered-dither algorithm** — CSS layered gradients are
  close enough at banner scale; a true Floyd–Steinberg dither is out of scope.

## What already exists (reuse)

- ARPANET content-doc structure (`headline/year/body/visualArtifact`) — mirror it in
  EARLY-WEB-CONTENT.md.
- The chapter scaffolding (progress indicator slot, scroll-driven fact reveal, artifacts)
  — Early Web plugs into the same `createChapter` shape (once extracted, T10).
- `LOBBY-BRIEF.md`'s Early Web card (`#000080` navy border, system gray) — the lobby card
  and the chapter now share one palette.
