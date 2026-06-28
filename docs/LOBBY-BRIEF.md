# Lobby Design Brief
## Chronicle Chapter 0 — The Museum Entrance

Pre-implementation gate. This brief must be complete before any lobby code is written. It covers all mandatory design decisions identified in the `/plan-design-review` session (2026-06-28).

---

## What the Lobby Is

The lobby is chapter 0. It's the default entry point when visiting `chronicle.design` with no hash. It contains no title, no tagline, no nav bar, no header — **the era-styled card grid IS the identity statement**. A visitor understands what Chronicle is by looking at the cards, not by reading copy.

The cards do the work. The ARPANET card looks like a real terminal. The Browser Wars card looks like a real 1998 webpage. The design concept is legible at a glance because the product is its own explanation.

---

## Background Treatment

**Color:** `#0D0D0D` — one step warmer than pure black, cooler than the chapter backgrounds. This creates a visual separation from ARPANET (`#000000`) and Figma Era (`#0A0A0A`) without declaring a new visual language.

**Noise grain:** Same SVG noise overlay at 3% opacity as Figma Era (consistency at the system level, since the lobby is meta-layer). This makes the background feel intentional rather than empty.

**No other background elements.** No gradient. No blobs. No decorative shapes. The background is a neutral stage for the cards.

---

## Grid Layout

### Card Grid

**Desktop (>1024px):** 4 columns, 2 rows. 8 cards total (2 live + 6 coming-soon stubs).

```
[ ARPANET ]  [ EARLY WEB ]  [ BROWSER WARS ]  [ POST-CRASH ]
[ MOBILE  ]  [ FLAT/MAT  ]  [ FIGMA ERA    ]  [ AI WEB     ]
```

**Tablet (640–1024px):** 2 columns, 4 rows.

**Mobile (<640px):** 1 column, 8 rows (stacked). Reduced card height.

### Grid Spec

```css
.lobby-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* desktop */
  gap: 16px;
  padding: 40px 48px;
  max-width: 1200px;
  margin: 0 auto;
}
```

Vertical centering: `min-height: 100vh; display: flex; align-items: center` on the lobby container — the grid should feel centered in the viewport, not top-aligned.

---

## Card Dimensions

```
Width:   auto (fills grid column)
Height:  240px (desktop) / 200px (tablet) / 160px (mobile)
Padding: 20px
Border-radius: 4px (era-neutral — no strong opinion from any one era)
```

The 4px border-radius is intentional — it's the radius that belongs to no specific era. Not 0 (too harsh, too System UI), not 12px (too Figma Era glassmorphism), not 2px (too Material). Neutral enough that each card's own styling reads first.

---

## Card Anatomy

Each card has:

```
[Era label — top left]
[Year range — top left, below era label]
[Animation zone — center/bottom 60% of card]
[Status badge — bottom right: "EXPLORE →" or "COMING SOON"]
```

**Era label:** 11px / 500 / letter-spacing: 0.08em / uppercase. Color matches each era's text color (ARPANET: `#FF9500`, Figma Era: `#FFFFFF`, etc.).

**Year range:** 10px / 400 / 0.5 opacity of the era's text color.

**Status badge:**
- Live chapters: `EXPLORE →` in era's text color, 10px / 600 / letter-spacing: 0.1em
- Coming soon: `COMING SOON` in same style but 0.4 opacity

---

## Era Card Styling

Each card is styled in its era's authentic visual grammar. This is the lobby's core design concept.

### Live Cards (Phase 1)

**ARPANET card:**
```css
background: #000000;
color: #FF9500;
font-family: 'Courier New', monospace;
border: 1px solid rgba(255, 149, 0, 0.2);
/* Scanline effect at 20% opacity (lighter than chapter — it's a preview) */
```
Animation zone: amber monospace text types a command, cursor blinks, loops every 2s.
```
CONNECTED TO NODE 1...
> LOGIN: GUEST_
```

**Figma Era card:**
```css
background: #0A0A0A;
color: #FFFFFF;
border: 1px solid rgba(255,255,255,0.08);
backdrop-filter: blur(8px);
```
Animation zone: a three-option pill selector — one option active with `#00D4FF` background pill. The active state ripples outward and resets, loops every 2s.

### Coming Soon Stubs

**Early Web (1983–1994):**
```css
background: #C0C0C0;
color: #000000;
font-family: 'Times New Roman', serif;
border: 2px solid #000080;
```
Static. No animation. Styled like a real Windows 3.1 dialog box tile.

**Browser Wars (1995–2001):**
```css
background: #FFFFFF;
border: 3px solid;
border-image: linear-gradient(45deg, #FF00FF, #FFFF00, #00FF00, #00FFFF) 1;
font-family: 'Comic Sans MS', cursive;
```
Optional: a tiny animated GIF of a spinning construction cone or star in the corner. Static fallback is fine. The border-image gradient IS the design statement.

**Post-Crash / Web 2.0 (2002–2007):**
```css
background: #EEF5FF;
color: #4A90D9;
font-family: Verdana, sans-serif;
border: 1px solid #C8DDF5;
border-radius: 8px;
```
Static. The visual grammar of rational, restrained, pre-Flat design.

**Mobile / Skeuomorphic (2008–2012):**
```css
background: linear-gradient(to bottom, #D4A96A, #8B5E3C);
color: #FFF8EC;
font-family: 'Helvetica Neue', Arial, sans-serif;
border: 1px solid rgba(0,0,0,0.3);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
```
The leather gradient and the inset highlight ARE the texture. No actual image needed.

**Flat / Material (2013–2018):**
```css
background: #2196F3;
color: #FFFFFF;
font-family: Roboto, sans-serif;
border-radius: 0;
box-shadow: 0 4px 16px rgba(33,150,243,0.4);
```
Long shadow on the title text (CSS text-shadow cascade). Flat color, no gradients except the box-shadow.

**AI Web (2024+):**
```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.06);
```
Subtle animated gradient: a very slow `conic-gradient` rotating behind the glass layer at 0.2rpm. The "ambient gradient pulse" = the conic rotation peeking through the glass. Colors: `rgba(120,80,255,0.15)` → `rgba(0,212,255,0.15)` → `rgba(120,80,255,0.15)`. Think "spatial computing" not "purple SaaS."

---

## Hover Behavior

**Live cards:**
- `transform: scale(1.02)` — subtle lift
- `box-shadow` brightens slightly (era-appropriate shadow, 20% more opacity)
- Cursor: `pointer`
- Duration: `150ms ease-out`
- The looping animation continues during hover (does not pause or reset)

**Coming Soon stubs:**
- `opacity: 0.7` on hover (dims slightly instead of lifting — these are disabled)
- Cursor: `not-allowed`
- No scale, no shadow change
- Optional tooltip on desktop: `title="Coming in Phase 2"` — native browser tooltip, no custom UI

---

## Entry Animation

Cards stagger in on first load. Not all at once — that reads as a grid revealing itself. This reads as cards arriving one by one.

```css
/* Each card starts hidden */
.lobby-card {
  opacity: 0;
  transform: translateY(16px);
  animation: card-arrive 400ms ease-out forwards;
}

@keyframes card-arrive {
  to { opacity: 1; transform: translateY(0); }
}
```

**Stagger:** 40ms delay per card in reading order (left-to-right, top-to-bottom).
```
Card 1 (ARPANET): delay 0ms
Card 2 (Early Web): delay 40ms
Card 3 (Browser Wars): delay 80ms
...
Card 8 (AI Web): delay 280ms
```

Total animation sequence: 280ms + 400ms = ~680ms from first paint to all cards settled. Fast enough to feel snappy; staggered enough to feel intentional.

---

## Lobby → Chapter Transition

Clicking any live card triggers:
1. Hash router updates: `window.location.hash = '#chapter-id'`
2. Lobby fades to black: `0.3s ease-in` opacity to 0
3. Chapter fades in from black: `0.5s ease-in` (same as direct-link entry spec)

This is the same code path as direct-link entry — the hash router's `fade-from-black` function is reused with no new component. The lobby fade-out is the only addition.

---

## What LOBBY-BRIEF.md Mandates for Implementation

Before any lobby code is committed, the implementer must confirm:
- [ ] Background color `#0D0D0D` applied to lobby container
- [ ] Grid is 4 columns desktop / 2 columns tablet / 1 column mobile
- [ ] Card height 240px / 200px / 160px per breakpoint
- [ ] Each era card is styled in its own grammar (specs above)
- [ ] ARPANET card loops typing animation at 2s interval
- [ ] Figma Era card loops pill selection at 2s interval
- [ ] Coming-soon cards: hover dims to 0.7 opacity, cursor not-allowed
- [ ] Entry stagger: 40ms per card, 400ms ease-out
- [ ] Lobby → Chapter: 0.3s fade-to-black + existing direct-link fade-from-black

---

## NOT In Scope

- A title ("Chronicle") or tagline anywhere in the lobby — the cards are the explanation
- A loading skeleton state (lobby CSS is trivial; no async wait)
- Pagination or filtering of chapters
- Mobile card reorder (same reading order on all breakpoints)
- Any lobby state that persists between visits (no "welcome back" logic)
