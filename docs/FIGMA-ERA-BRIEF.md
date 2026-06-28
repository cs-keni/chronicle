# Figma Era Chapter Brief
## Visual Direction: 2019–2023

Pre-implementation gate for the Figma Era chapter (`src/chapters/figma-era/`). This brief locks design direction before any chapter code is written.

---

## The Era in One Sentence

Design went from taste to system: Figma made design collaborative, component-based, and token-driven — and the visual output became the dark-mode glassmorphism language that defined every app from 2019 to 2023.

---

## What Happened (Context for Implementers)

**2019:** Apple ships system-wide dark mode in macOS Mojave and iOS 13. Every app ships a dark theme in six months. Dark becomes the default for "serious" design work.

**2020:** Design systems become the primary output of design teams — not individual screens, but Figma component libraries that generate every screen. Design tokens (`--color-accent`, `--radius-md`) emerge as the shared language between design and code.

**2021:** Glassmorphism explodes. WWDC 2021 UI, visionOS previews, every SaaS dashboard. The aesthetic: translucent frosted surfaces stacked at different z-depths, colored light bleeding through layers. Backdrop filters everywhere.

**2022:** Geist, Inter, and the variable font era. Typography becomes systematic — a type scale enforced by tokens, variable axes tied to contexts (display vs. body vs. label). Fonts stop being chosen per-project and start being "the design system's font."

**2023:** The aesthetic peaks and begins to feel dated. But at its best — Apple's visionOS previews, Linear's interface, Vercel's dashboard — it was genuinely beautiful: disciplined, spatial, light as air.

**The tension this chapter must hold:** It should feel like the state of the art — not ironic retro like ARPANET, but not visually exhausted like a 2023 SaaS clone. It should feel like the best version of this era, not the average.

---

## Visual Identity

### Color System

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0A0A0A` | Chapter background |
| `--text-primary` | `#FFFFFF` | Body text, headings |
| `--text-secondary` | `rgba(255,255,255,0.6)` | Labels, captions, secondary content |
| `--accent` | `#00D4FF` | Electric blue — pill borders, glow effects, highlights, active states |
| `--accent-glow` | `rgba(0, 212, 255, 0.15)` | Soft ambient glow behind accent elements |
| `--card-bg` | `rgba(255,255,255,0.05)` | Glassmorphism card backgrounds |
| `--card-border` | `rgba(255,255,255,0.08)` | Card border — subtle, just enough to separate from background |
| `--grain-opacity` | `3%` | Noise grain overlay intensity |

**Do not use purple, violet, or indigo.** `#00D4FF` (electric blue) is the accent color — it reads as Vision Pro / spatial computing, not SaaS template.

### Typography

**Display:** Geist (Google Fonts) — the typeface designed for Vercel/Next.js; represents the 2022 design-system aesthetic. Load via `@import 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900'` or self-host.

**Body:** System font stack — `-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif`. Falls through to Inter on non-Apple devices.

**Type scale:**
```
--text-xs:   11px / 1.4  / 500   (labels, badges)
--text-sm:   13px / 1.5  / 400   (captions, secondary)
--text-base: 16px / 1.6  / 400   (body)
--text-lg:   20px / 1.4  / 500   (card titles)
--text-xl:   28px / 1.2  / 600   (section headings)
--text-2xl:  40px / 1.1  / 700   (chapter headline)
```

### Glassmorphism Spec

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
```

**`blur(20px)` is the canonical value.** Not `blur(4px)` (too transparent, loses depth), not `blur(40px)` (too frosted, too 2021 Dribbble). `20px` reads as spatial, not decorative.

**Fallback** (`@supports not (backdrop-filter: blur(20px))`): `background: rgba(20, 20, 25, 0.85)` — solid dark with slight transparency. No blur.

### Noise Grain

```css
.chapter-figma-era::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('noise.svg');
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}
```

Noise SVG: `<svg xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="1"/></svg>` at 200×200px, tiled. 3% opacity is the spec — do not exceed 5% (starts reading as dirty rather than atmospheric).

---

## Layout: The Floating Cards

### Card Count and Arrangement

**3 content cards visible at a time.** They are stacked at slightly different z-depths and rotated subtly — not flat on a grid. Think: documents scattered on a glass desk, not a Notion page.

```
Layout (desktop, >1280px):

  [  Card A  ]
         [  Card B  ]
  [  Card C  ]

```

- Card A: left-aligned, slight negative rotate (-1.5deg), z-index 2
- Card B: center-right, no rotation, z-index 3 (top, most prominent)
- Card C: left-aligned, slight positive rotate (1deg), z-index 1 (behind B)
- Overlap: cards overlap by ~60px on the horizontal axis

**Not a grid. Not a masonry layout.** The cards are positioned with absolute coordinates within a relative container. The "scattered" arrangement is intentional — it creates spatial depth without WebGL.

### Card Dimensions

```
Width:  420px (desktop) / 90vw (mobile)
Height: 280px
Padding: 24px
Border-radius: 16px
```

### Card Content Structure

Each card shows one `fact` from the `facts[]` array:
```
[Year badge — small, #00D4FF text, glass pill]
[Headline — 20px/500, white]
[Body — 14px/400, 0.6 opacity, 2-3 sentences]
[Visual artifact description — rendered below body as an ambient visual]
```

### Scroll Behavior Within Chapter

The chapter is 200vh. As the user scrolls:
- **0–30vh:** Boot arrival animation plays (see below), then first card settles
- **30–80vh:** Cards shift and restack — the card at position A sinks, B rises to prominence, C slides in from below
- **80–130vh:** Second set of facts; cards restack again
- **130–180vh:** Third set; cards begin dissolving slightly at edges
- **180–200vh:** Closing beat zone — cards fade, "END OF KNOWN HISTORY" appears

---

## Boot Arrival Animation

When the user enters Figma Era via the CRT power-off shader, the chapter must feel like a continuation of the CRT effect, not a hard cut.

### Sequence

1. **t=0:** CRT shader completes; chapter background (`#0A0A0A`) is revealed
2. **t=0→80ms:** A single 2×2px pixel at `color: #00D4FF` appears at viewport center (top: 50%, left: 50%)
3. **t=80→600ms:** The pixel expands outward via `transform: scale()` — not clip-path, not opacity, just scale. The expansion curve: `cubic-bezier(0.16, 1, 0.3, 1)` (a spring-like ease-out that accelerates fast then gently decelerates). The pixel should feel like it's being released, not eased.
4. **t=600ms:** The expanding element dissolves (opacity: 0) as the first glass card fades in
5. **t=600→900ms:** First card fades in: `opacity: 0 → 1`, `translateY(12px) → translateY(0)`, `ease-out 300ms`

### Implementation Note

The expanding pixel is a `<div>` with `position: fixed; top: 50%; left: 50%; width: 2px; height: 2px; background: #00D4FF; border-radius: 50%` transformed via `scale()`. At maximum scale it covers ~`calc(100vmax * 1.5)` — enough to fill the viewport. The expansion is a visual callback to the CRT shader's expand phase (0.6–1.0) where the CRT line expanded to reveal the new chapter.

### Direct-Link Entry (no CRT shader)

If the user arrives at `#figma-era` directly (no preceding transition), the boot animation is skipped. Chapter fades in from black at 0.5s ease-in, then the first card appears normally.

---

## Progress Indicator

7 pill dots, bottom-center:

```
◉ ● ● ● ○ ○ ○
```

- Active: `◉` — filled circle with `#00D4FF` glow ring
- Visited: `●` — filled circle, `rgba(0,212,255,0.4)` (dimmed accent)
- Upcoming: `○` — empty circle, `rgba(255,255,255,0.2)`
- Container: glass pill — `backdrop-filter: blur(8px)`, `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.06)`, `border-radius: 100px`, `padding: 8px 16px`
- Pill spacing: `8px` gap between pills

---

## Interactive Artifact: Dark Mode Toggle

**Phase 2 only.** The dark mode toggle is the signature interactive artifact for this chapter — dark mode was the defining UI decision of 2019 (iOS 13). It's a live toggle that actually switches the chapter between its dark state (`#0A0A0A`) and a light variant (`#FAFAFA`). The toggle is styled as an era-accurate iOS 13 toggle switch. Phase 1 does not implement this.

---

## End State (Phase 1)

At the bottom of the 200vh chapter:

```css
.chapter-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 80px 24px;
}
```

**Text:** `END OF KNOWN HISTORY. MORE CHAPTERS LOADING.`
- Font: Geist, 13px, `letter-spacing: 0.12em`, `color: rgba(255,255,255,0.4)`, uppercase

**Pill CTA:** `Explore more →`
- Style: glass pill — `border: 1px solid #00D4FF`, `color: #00D4FF`, `background: rgba(0,212,255,0.05)`, `border-radius: 100px`, `padding: 10px 20px`, Geist 13px/500
- On hover: `background: rgba(0,212,255,0.12)`, `box-shadow: 0 0 16px rgba(0,212,255,0.2)`, 150ms ease
- On click: navigates to `#` (lobby)

---

## NOT In Scope (Phase 1)

- Dark mode toggle (Phase 2 interactive artifact)
- Variable font axes wired to scroll position (Phase 2)
- Card hover micro-interactions (Phase 3)
- Ambient audio (Phase 2 — audio assets TBD)
- The `backdrop-filter` blur degradation path on Firefox (Firefox doesn't support `backdrop-filter` by default without a flag as of 2023 — the fallback is a solid dark background, already specified above)

---

## Reference Visual Grammar

The best implementations of this era's aesthetic:
- **Linear.app** — the gold standard of dark-mode design systems. Studied the spacing, the muted grays, the selective use of color.
- **Vercel Dashboard** — Geist typeface in production. The type hierarchy maps exactly to what this chapter should feel like.
- **Apple visionOS UI previews (2023)** — the glassmorphism that this chapter is reaching toward. Translucent panels, depth, spatial hierarchy.
- **Figma's own Config keynote slides (2022, 2023)** — component-native design, token-driven, dark by default.

**Avoid:** The generic SaaS dark dashboard — purple gradients, glowing cards everywhere, decorative blobs. The Figma Era at its best was disciplined and spatial, not decorative.
