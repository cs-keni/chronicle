# Browser Wars Chapter — Design Brief

**Era:** 1995–2001 · **Chapter id:** `browser-wars` · **Status:** locked via /plan-design-review 2026-08-04

Design direction for the Browser Wars chapter. Locks every visual decision before code
(`vague-color-references` 9/10 requires this, and `PHASE2-BROWSER-WARS-PLAN.md` §11 rated
AI-slop risk **HIGH** for this chapter specifically).

Mockup: `~/.gstack/projects/chronicle/designs/browser-wars-20260804/browser-wars-mockup.html`
(published artifact `claude.ai/code/artifact/c060c5e0-f3df-4768-97ab-77aefc932cb2`).
Content facts live in `docs/BROWSER-WARS-CONTENT.md`. Transition architecture lives in
`docs/PHASE2-BROWSER-WARS-PLAN.md`.

Kenny stepped away mid-review with explicit authority: *"choose your recommended option and
keep working."* Decisions taken under that authority are marked **[auto-decided]** so any of
them can be reversed on sight.

Aesthetic target: a real 1998 personal homepage viewed in **Internet Explorer 4** — tiled,
loud, cramped, asymmetric, hand-built in Notepad. Correctly ugly, which takes more craft than
tastefully ugly. The countermeasure against Geocities pastiche (a commodity template in 2026)
is that Chronicle wins on the **transition** and the **arc**, never on "looks 90s."

---

## The one idea this chapter is built on

**The page inside the fiction has no hierarchy. The chapter does.**

A real 1998 homepage had everything shouting at once. That is historically true and it is
also the definition of failed design. The resolution is not to tone the era down — it is to
give the *chapter* a hierarchy the *page* never had:

> The fact well is the widest, most central, calmest object on screen.
> Every loud thing lives in the rails around it and never occludes content.

Decoration may be period-ugly. **Fact text holds WCAG AA.** Both hold at once, and that
simultaneity is the craft the chapter is judged on. This is also period-honest: real 90s
pages put body copy in a white table cell for exactly this reason, so authenticity and
accessibility point the same direction here.

---

## Palette (every value is hex — no descriptive names)

### Museum shell

| Token | Hex | Use |
|-------|-----|-----|
| shell | `#0A0A0A` | dark museum ground (shared with Early Web) |

### IE4 browser chrome (Win95/98 system colors)

| Token | Hex | Use |
|-------|-----|-----|
| chrome | `#C0C0C0` | button face, toolbar, menu bar |
| chrome-hi | `#FFFFFF` | bevel highlight (top / left) |
| chrome-lo | `#808080` | bevel shadow (bottom / right) |
| chrome-dk | `#000000` | outer border |
| title-l | `#000080` | title bar gradient start |
| title-r | `#1084D0` | title bar gradient end |
| title-ink | `#FFFFFF` | title bar text |

### The page

| Token | Hex | Use |
|-------|-----|-----|
| page | `#FFFFFF` | base under the tile |
| magenta | `#FF00FF` | tile motif, well frame, NEW! ornament |
| yellow | `#FFFF00` | tile motif, hazard bar, badge ground |
| lime | `#00FF00` | marquee ink, tile motif |
| cyan | `#00FFFF` | webring panel, mail ornament, lobby-card focus ring |
| ink | `#000000` | all hard borders, marquee ground |

`cyan` is **not** in `SPEC.md:52`'s three-color row. It is added deliberately: the lobby's
Browser Wars card at `src/chapters/lobby/style.css:184` already ships a 5-stop
`border-image` gradient containing `#00FFFF`. Without cyan in the chapter palette, card and
chapter diverge — and `EARLY-WEB-BRIEF.md` closes by explicitly tying the two together.

### Links

| Token | Hex | Contrast on `#FFFFFF` | Use |
|-------|-----|---|-----|
| link | `#0000FF` | 8.6:1 | unvisited |
| visited | `#800080` | 8.5:1 | visited — **must stay distinct** (universal rule) |
| active-link | `#FF0000` | 4.0:1 | :active only, never body text |

### The fact well (the calm centre)

| Token | Hex | Contrast | Use |
|-------|-----|---|-----|
| well-frame | `#FF00FF` | — | 4px table frame (loud) |
| well-ground | `#FFFFFF` | — | inner cell |
| well-rule | `#000000` | — | 1px inner border + `<hr>` |
| well-ink | `#1A1A1A` | **17.4:1** on white — AAA | fact body copy |
| well-year | `#C71585` | **5.4:1** on white — AA | year label |

### Marquee, counter, WordArt

| Token | Hex | Use |
|-------|-----|-----|
| marquee-bg | `#000000` | marquee ground |
| marquee-ink | `#00FF00` | marquee text — 15.3:1 on black |
| counter-bg | `#000000` | odometer box |
| counter-digit | `#FF2400` | **red** LED digits — 5.5:1 on black |
| wa-stop-1 / 2 / 3 | `#FF00FF` / `#FF0080` / `#FFFF00` | WordArt gradient |
| wa-outline | `#000000` | WordArt 2.5px stroke |
| wa-shadow | `#008080` | WordArt hard offset shadow |

**The counter is red, not green** — `src/chapters/early-web/style.css:277` already runs a
`#00FF00` odometer. Two chapters cannot share one artifact; the eye reads it as the same
object and the era-jump loses a beat.

### Contrast rules (binding)

- `#00FF00` (1.4:1), `#FFFF00` (1.1:1), and `#FF00FF` (3.1:1) **never carry text on white.**
  They are frames, fills, and ornament grounds only.
- Any text on the tiled background is decoration and must not be the sole carrier of
  information.
- Everything inside the fact well is `#1A1A1A` or `#C71585`. No exceptions.

---

## Typography

| Role | Stack | Size / weight |
|------|-------|---------------|
| Decoration & chrome copy | `"Comic Sans MS", "Comic Relief", "Chalkboard SE", cursive` | 13–15px / 400–700 |
| Fact body | `Verdana, Geneva, "DejaVu Sans", sans-serif` | 15px / 1.6 / 400, measure ~62ch |
| Fact headline | `Verdana, Geneva, sans-serif` | 17px / 700 |
| Year label | `"Courier New", monospace` | 12px / 700 / `.08em` |
| Browser + dialog chrome | `"MS Sans Serif", "Microsoft Sans Serif", Tahoma, Verdana, sans-serif` | 11–12px |
| WordArt heading | — not a font — | SVG asset |

**Self-host Comic Relief (SIL OFL, ~28KB woff2 subset). This is P1, not polish.**
`lobby/style.css:182` currently ships `'Comic Sans MS', 'Chalkboard SE', cursive`, and
Chalkboard SE is macOS-only. On Linux and Android both fall through to a generic `cursive`
that is usually not installed, so the browser lands on the system default — which is AI-slop
blacklist item 11 (`system-ui` as the primary display face) arriving by accident on roughly a
third of devices. The chapter then reads as a *badly made* website rather than a *1998*
website, and the entire "correctly ugly" thesis dies silently. Comic Relief is metric-
compatible with Comic Sans specifically, so machines that have the real face still use it.

**Papyrus is dropped.** [auto-decided] It has no free metric clone, and once WordArt ships
as an asset it has no remaining job.

**WordArt is an SVG asset, not a typeface.** WordArt was always a rendered picture, so
shipping it as SVG is *more* period-accurate than any font choice — and it removes the
headline's font dependency entirely. Gradient `#FF00FF → #FF0080 → #FFFF00`, 2.5px `#000000`
stroke via `paint-order: stroke`, hard `#008080` offset shadow at +8/+6px, italic
Impact/Arial Black outline geometry, flattened to paths at build so no font is required.

**Verdana carries the facts.** Matthew Carter designed it in 1996 as *the* screen face and
Microsoft shipped it everywhere. It is simultaneously the most period-correct and the most
legible option available, so the contrast split costs nothing.

---

## Layout — the IE4 frame on the museum shell

The whole era renders inside a **full Internet Explorer 4 window** sitting in the dark shell:

```
┌─ dark museum shell (#0A0A0A) ─────────────────────────────────────┐
│ ┌─ IE4 chrome (beveled #C0C0C0) ─────────────────────────────────┐ │
│ │ [title: #000080→#1084D0 gradient · "— □ ✕"]                    │ │
│ │ [menu: File Edit View Go Favorites Help]                        │ │
│ │ [toolbar: ◀Back ▶Fwd │ ✕Stop ⟳Refresh ⌂Home │ …    (e)throbber] │ │
│ │ [Address: http://www.chronicle.net/~browserwars/index.html]     │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ [marquee bar · #00FF00 on #000000]                              │ │
│ │ [WordArt "BROWSER WARS" — left-aligned, NOT centred]            │ │
│ │  ┌ 172px ─┐ ┌──────── 1fr ────────┐ ┌ 148px ┐                   │ │
│ │  │ badges │ │  ╔═ FACT WELL ═════╗ │ │counter│                   │ │
│ │  │ ×4     │ │  ║ headline        ║ │ │       │                   │ │
│ │  │        │ │  ║ YEAR            ║ │ │ gif   │                   │ │
│ │  │ webring│ │  ║ body ~62ch      ║ │ │ gif   │                   │ │
│ │  │        │ │  ║ ── hr ──        ║ │ │ gif   │                   │ │
│ │  │        │ │  ╚═════════════════╝ │ │       │                   │ │
│ │ [footer: guestbook · links · © 1998 · best viewed 800×600]      │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ [status bar: Done │ Internet zone]                              │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

- Asymmetric three-track grid `172px / 1fr / 148px`. **Not** three equal columns — that is
  AI-slop blacklist item 2, and it is one careless `repeat(3, 1fr)` away.
- Left-weighted, table-scaffolded, inconsistent gutters. 1998 pages were not balanced.
- Zero `border-radius` anywhere in the chapter. Every border is 1px hard black or a 2px
  beveled outset.
- The Address bar (`http://www.chronicle.net/~browserwars/index.html`) is the "you are in
  1998" cue, same device as Early Web's location bar. The `~username` path is deliberate.

**Frame continuity (resolves D3.1 × D3.3 contradiction).** [auto-decided] Early Web is framed
in **Netscape 1.0**; Browser Wars is framed in **Internet Explorer 4**. The two chapters
together tell the browser war in two window chromes with no copy required. The throbber is
therefore **IE4's own**, not Netscape's N-comet — an IE4 window cannot carry a Netscape
throbber, and D3.1 and D3.3 were decided separately without noticing they collide. Netscape
survives as a "Netscape Now!" badge in the cluster: the loser reduced to a button, which is
what actually happened.

---

## Fact rendering (resolves `facts-rendering-undefined`)

**Six facts**, matching Early Web's count. [auto-decided — T4 said 6–8; six keeps the well
scrollable rather than a wall of text.]

Each fact is a section inside the shared well, separated by a 1px `#000000` rule:

```
<h3 Verdana 17/700 #1A1A1A>   Headline
<span Courier 12/700 #C71585>  YEAR or YEAR → YEAR
<p Verdana 15/1.6 #1A1A1A>     body (max 62ch)
<hr 1px #000000>
```

Facts **reveal sequentially on scroll**, driven by the chapter's `onChapterProgress` — the
same pattern ARPANET and Early Web already use. [auto-decided: consistency across chapters
is invisible when right and jarring when wrong.]

The well itself: `4px solid #FF00FF` outer frame, 3px padding, `1px solid #000000` inner
border, `16px 18px` inner padding, `#FFFFFF` ground. The loud frame wrapping the calm cell
is the contrast split expressed as a single component.

---

## Progress indicator — the IE4 throbber

The animated IE "e" in the top-right of the browser chrome rotates while the chapter is in
motion and rests when settled. Period-native, and it leaves the visitor counter free to be
the interactive artifact `SPEC.md:83/108` assigns it.

**System rule (promote to `AI_CONTEXT.md`):** every chapter's scroll-progress indicator is a
period-native artifact of its own era, never a generic bar. ARPANET = amber ASCII block bar.
Early Web = green odometer hit-counter. Browser Wars = IE4 throbber. This is now a pattern
three chapters deep and chapter 4 should inherit it rather than rediscover it.

---

## Interactive artifact — the visitor counter

`SPEC.md:83` names the Browser Wars visitor counter specifically as one of the things that
makes Chronicle unrecognizable next to a static scroll piece. It must actually do something.

**Clicking the counter inflates it.** Each click bumps the number, and it keeps bumping as
fast as you click. This teaches the historical fact by letting the visitor commit the fraud:
90s hit counters were trivially inflatable and people refreshed their own pages to run the
number up. The interaction *is* the content.

- Seeded at `001482`, six digits, `#FF2400` on `#000000`, `Courier New` 19px/700.
- Rendered as a real `<button>` with an accessible name ("Visitor counter — click to
  increment"), visible focus ring, and Enter / Space activation.
- `aria-live="polite"` on the digit group so screen-reader users get the joke too.
- No persistence. [auto-decided: a portfolio piece is overwhelmingly first visits, and the
  gag has to land on load, not on return.]

---

## Arrival beat — the 56k page load

Early Web has a named arrival beat (the Mosaic page-load assembly). Browser Wars arrives by
the user **clicking OK** — the most deliberate arrival in the project, the only one the
visitor actively consents to. If the chapter merely appears, "lands like a wall" is an
assertion rather than an experience.

The page assembles the way 1998 actually felt over a modem:

1. `0ms` — tiled background paints.
2. `120ms` — WordArt heading snaps in whole.
3. `220ms` — marquee starts scrolling.
4. `300ms` — the fact well paints, text first.
5. `380–900ms` — GIF ornaments and badges pop in **out of order and late**, staggered
   irregularly, not on an even curve.
6. Throbber spins throughout, stops at settle.

**The jank is timing, never layout.** Every image ships explicit `width`/`height` so space is
reserved and nothing shifts. Deliberate CLS would be a genuine accessibility problem, and the
effect does not need it — irregular arrival timing reads as a slow connection all by itself.

Total under **1.0s**, so it reads as character rather than lag. Under
`prefers-reduced-motion: reduce`, the whole assembly collapses to a single instant paint.

---

## Motion inventory & flash budget

A ceiling you measure afterwards is a bug report. A budget you design against is a guarantee.

| Element | Motion | Rate | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Marquee | continuous translate | 18s/loop, 0 flashes | animation off, text static and fully visible |
| IE4 throbber | rotate while progressing | 1 rev / 1.2s, 0 flashes | static first frame |
| Visitor counter | digits tick | scroll- and click-driven, not timed | jumps to value, no tick animation |
| UNDER CONSTRUCTION gif | 2-frame hazard shift | **2 Hz** | static PNG sibling |
| NEW! gif | 2-frame colour swap | **1.5 Hz** | static PNG sibling |
| EMAIL gif | 4-frame envelope | 1 Hz | static PNG sibling |
| Arrival assembly | staggered pop-in | one-shot, <1.0s | instant paint |
| Lobby card border | gradient rotation on hover | 3s/rev | static gradient |

**Binding budget: 2 Hz maximum per element, and no more than 3 concurrently animated
elements in the viewport at once.** WCAG 2.3.1 fails above 3 general flashes per second; this
budget sits at two-thirds of the threshold by construction.

CSS cannot pause an animated GIF and does not control a native `<marquee>` (Codex #8), so
**every animated GIF ships a static-first-frame PNG sibling** and the swap is done in JS on
the reduced-motion media query. The marquee is replaced with a static element, not merely
un-animated.

---

## Responsive

**390px and below** — [auto-decided] the frame **scales as one unit**; the rails unwrap to
horizontal strips *below* the well; the well is always the widest element and never drops
under 14px body text.

This deliberately **differs from Early Web's call** (horizontal-scroll the frame, never
reflow). Two reasons: TODO-008 is already open because that horizontal-scroll approach is
unverified on real hardware, and this chapter carries an interactive dialog that must be
reachable without horizontal panning. Order changes on mobile; the era does not.

The **dialog** on mobile: `max-width: min(300px, calc(100vw - 48px))`, and buttons grow to a
**44px minimum touch height**. This is the one place period accuracy yields — a 23px Win 3.1
button is not tappable, and this transition has **no `fadeSwap` downgrade on touch** (it is
DOM, not WebGL), so it is the only path mobile users get. It has to work.

---

## Accessibility

- Fact text `#1A1A1A` on `#FFFFFF` = **17.4:1** (AAA). Year label `#C71585` = 5.4:1 (AA).
  Body copy is 15px, headlines 17px.
- Visited (`#800080`) vs unvisited (`#0000FF`) link colors stay distinct — universal rule.
- Decorative links (guestbook, webring prev/random/next, email, "About me") are **inert and
  `aria-hidden`**, exactly as `EARLY-WEB-BRIEF.md` specified. Real-looking links that do
  nothing drain the goodwill reservoir.
- The `<marquee>` is `aria-hidden="true"`; its text is also present in a visually-hidden
  static element, because screen-reader handling of `<marquee>` is unreliable and the element
  is deprecated.
- The visitor counter is a real `<button>`: accessible name, visible focus, Enter/Space,
  `aria-live="polite"`.
- Tiled background is decoration and never the sole carrier of information.
- Flash rate under the WCAG 2.3.1 threshold by budget, not by measurement-after-the-fact.
- Win 3.1 dialog: native `<dialog>` + `showModal()` gives top layer, `::backdrop`, inert
  background, Esc, and focus management for free (see the plan). Buttons need a visible
  `:focus-visible` ring **in addition to** the period dotted focus rect, since the dotted
  rect is 1px `#000000` on `#C0C0C0` and reads poorly.

---

## The Windows 3.1 dialog — exact spec

The moment the whole slice exists for. The plan specifies its behaviour across 200 lines and
its appearance in zero. Anatomy, exact:

| Part | Spec |
|---|---|
| Panel | 372px wide, `#C0C0C0`, `1px solid #000000`, inset `1px #FFFFFF` top/left + `1px #808080` bottom/right |
| Shadow | **hard** `6px 6px 0 rgba(0,0,0,.55)` — never a soft blur |
| Title bar | **solid `#000080`** (the `#000080→#1084D0` gradient is Win95 and would be an era error), `#FFFFFF` bold 12px, title text **centred** |
| Control-menu box | 17×16px beveled box at far left with a 9×2px `#000000` bar |
| Icon | 32px circle, `2px solid #000000`, `?` in `#000080` Georgia/serif 22px — the Win 3.1 query icon |
| Message | "Are you sure you want to proceed?" · MS Sans Serif 13px `#000000` |
| Buttons | OK + Cancel, 76px min width, 23px tall desktop / **44px touch** |
| OK default state | extra `0 0 0 2px #000000` ring **plus** the 1px dotted inner focus rect |
| Pressed state | bevel inverts (`inset -1px -1px 0 #FFFFFF, inset 1px 1px 0 #808080`) |
| Backdrop | `backdrop-filter: blur(4px)` + `rgba(0,0,0,.18)` scrim |

**The 4px blur is deliberate and deliberately not one of the three values already in the
codebase** (`figma-era` uses 20px and 8px, `lobby` uses 8px and 12px). Early Web must stay
**legible** behind the dialog, because the emotional beat is being asked whether to leave a
place you can still see. A 20px blur throws that away.

**The dialog's narrative job** (name it, so implementation preserves it): "Are you sure you
want to proceed?" is a *warning*. The visitor clicks OK and is immediately assaulted by 1998.
That is a setup and a punchline. The dialog is Chronicle warning you about the era you are
about to enter, and the arrival beat is the payoff. Neither works without the other.

---

## Lobby card — the stub → live transition

[auto-decided] Flipping `manifest.ts:26` to `live: true` changes the card from
`role="presentation"` to `role="button"`, adds `tabindex`, and swaps "Coming Soon" for
"Explore →" (`lobby/index.ts:20-22`, `:38`). The card currently has **no designed live
state**. It gets:

- The generic live-card lift already in `lobby/style.css:111`
  (`translateY(-2px) scale(1.02)`), same as every live card.
- An era-specific hover, matching the ARPANET (`:135`) and Figma Era (`:163`) precedent: the
  rainbow `border-image` gradient **rotates**, 3s per revolution. Period-native (animated
  rainbow borders were everywhere) and it signals "live" without adding chrome.
- Focus: `outline: 3px solid #00FFFF; outline-offset: 2px`. `outline` renders outside the
  `border-image` so it cannot be swallowed by it, and cyan is now an in-palette token.
- Under `prefers-reduced-motion: reduce`, the border rotation stops and the gradient is
  static.

---

## Asset inventory (feeds T9 — budget **220 KB** total)

Every item 16-color dithered. Nothing in this chapter is left to improvisation, because
incomplete asset lists are exactly where generic icons and emoji enter.

| Asset | Count | Notes |
|---|---|---|
| Animated GIFs | 3 | UNDER CONSTRUCTION, EMAIL envelope, NEW! — each ≤2 Hz |
| Static first-frame PNGs | 3 | reduced-motion siblings, one per GIF — **mandatory** |
| 88×31 badges | 4 | Netscape Now!, Get Internet Explorer, Made With Notepad, Hosted on GeoCities |
| IE4 toolbar icons | 8 | 16×16 — Back, Forward, Stop, Refresh, Home, Search, Favorites, throbber |
| WordArt heading | 1 | SVG, paths flattened, no font dependency |
| Background tile | 1 | 48×48 real 16-color GIF (~400 bytes) — a vector tile would be a modern artifact |
| Comic Relief webfont | 1 | ~28KB woff2, subset to used glyphs |

**All authored originals.** No archived GeoCities assets — provenance risk on a public
portfolio piece, and period-correct 16-color dithered encoding is also the smallest.

---

## NOT in scope (design decisions deferred)

- **Frame morph Netscape 4 → IE4 across the scroll.** The strongest available expression of
  "the visual transitions ARE the product" (`SPEC.md:87`) — the browser war happening in the
  chrome while you read about it. Deferred because it needs a progress-driven chrome layer in
  a slice that already rewrites the transition engine. Logged as TODO-009.
- **Real guestbook behaviour.** Period decoration only, inert. It would compete with the
  counter for the interactive-artifact role and needs its own empty/populated/overflow states.
- **Escalating chaos density across 1995→2001.** Considered (junk thickens as the era
  degrades, which is historically true) and declined to keep the noise layer static.
- **Browser Wars → Figma Era exit contrast.** Maximum chaos into near-black minimalism is the
  project's second-most violent contrast and glass-shatter is currently just a relocated
  registry key. Logged as TODO-010.
- **Extracting a shared browser-frame component** from Early Web + Browser Wars — rule of two,
  the exact mistake caught in Slice 1. Revisit at a third framed chapter.

---

## What already exists (reuse, don't rebuild)

- `EARLY-WEB-BRIEF.md` section structure — this brief mirrors it deliberately.
- `LOBBY-BRIEF.md:132` + `lobby/style.css:179` — the Browser Wars card's hex is already
  shipped and is the source of the `#00FFFF` reconciliation.
- Early Web's browser-frame CSS **pattern** (not extracted — rule of two).
- The `createChapter` scaffold — chapter is a spec, not hand-wiring.
- The chapter engine's existing `prefers-reduced-motion` handling.
- ARPANET's content-doc shape (`headline` / `year` / `body` / `visualArtifact`) for
  `BROWSER-WARS-CONTENT.md`.
- The Courier year-label treatment — the one typographic constant across all three chapters.
