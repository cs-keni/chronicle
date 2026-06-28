# Chronicle — Scroll-Driven Era Museum

## Concept

Chronicle is a scroll-driven museum of interface design history. You scroll
through a single vertical page and the entire visual language of the browser
changes around you — not as a CSS trick, but as a cinematic scene change. Each
era of computing history is rendered in the authentic visual grammar of that
time: the ARPANET era feels like a live terminal session, the early web era
looks like a real 1996 Geocities page (but art-directed), the present era
is hyper-minimal and dark. The content — real facts, real events, real design
artifacts from each period — is the soul of the experience. The animations are
in service of that content, not decorating it.

The defining mechanic: **chapter transitions are GLSL shaders, hand-authored
per transition.** Not a crossfade. Not a wipe. The ARPANET-to-early-web
transition looks like a CRT powering off, then the phosphor reassembling into
color pixels. The dot-com-to-post-crash transition is a Windows Blue Screen
of Death that glitches into the next chapter. Each transition is a 2–4 second
piece of original visual art that only happens once as you scroll through.

---

## The 10-Second Test

A first-time visitor sees:
- A pitch-black screen with an amber cursor blinking at the top-left corner
- Monospaced text types itself out: `CONNECTED TO ARPANET NODE 1 — 1969`
- Below the fold, the outline of a network map glows into existence
- There is no UI. No nav bar. No header logo. Nothing but this.

Ten seconds in, they scroll. The CRT flickers, the image compresses into a
horizontal scan line, and then expands as a grainy, pixelated early browser.
The color temperature shifts from amber to harsh blue-white.

They stop scrolling to figure out what just happened. That is the goal.

---

## Design Language

**Overall register:** Cinematic Documentary. Each chapter is a directed scene,
not a slideshow. Pacing, contrast, and surprise matter more than density of
information.

### Chapter Visual Identities

| Chapter | Era | Palette | Typography | Texture |
|---------|-----|---------|------------|---------|
| ARPANET | 1969–1982 | `#000000` bg, `#FF9500` amber type | Courier New only. No other font. | CRT phosphor glow, scanlines at 30% opacity |
| Early Web | 1983–1994 | `#C0C0C0` (literal system gray), `#000080` navy, `#FF0000` | Times New Roman + system fonts | Dithered gradients, pixelated icons, 1px black border on everything |
| Browser Wars | 1995–2001 | Garish: `#FF00FF`, `#FFFF00`, `#00FF00` on white | Comic Sans, Papyrus, WordArt gradients | Animated GIFs (actual), tiled backgrounds, marquee text |
| Post-Crash / Web 2.0 | 2002–2007 | Desaturated blues `#4A90D9`, lots of white | Verdana, Georgia, rational spacing | Subtle gradients, rounded corners, Web 2.0 gloss overlays |
| Mobile / Skeuomorphic | 2008–2012 | Warm: leather textures, linen, `#E8D5A3` | Helvetica Neue, tight tracking | Stitched edges, embossed type, felt and metal textures |
| Flat / Material | 2013–2018 | Google's 2014 palette: `#2196F3`, `#F44336`, `#4CAF50` | Roboto, geometric sans everywhere | No texture, long box shadows, FABs, elevation |
| Figma Era | 2019–2023 | Near-black `#0A0A0A`, white, electric blue `#00D4FF` | `-apple-system, BlinkMacSystemFont, 'Geist', 'Inter'`. Variable weight. (SF Pro is Apple-proprietary — system font stack only) | Glass blur (`backdrop-filter: blur()` — exact px value in FIGMA-ERA-BRIEF.md), noise grain, floating cards |
| AI Web | 2024+ | TBD — brief authored in Phase 2 | TBD | TBD |

**The contrast between chapters is violent and intentional.** The Browser Wars
chapter is ugly on purpose — ugly in a way that requires craft to make
correctly ugly. The ugliness IS the historical accuracy.

### Transition Shader Catalog

Each chapter-to-chapter transition is a 2–4s GLSL fragment shader, hand-authored.
No two transitions use the same effect.

| Transition | Effect | Technical Approach |
|---|---|---|
| ARPANET → Early Web | CRT power-off: image compresses to a horizontal white line, then expands as the next era | Vertex displacement + brightness curve |
| Early Web → Browser Wars | A Windows 3.1 dialog box appears mid-screen: "Are you sure you want to proceed?" OK button launches next chapter | DOM overlay + shader blur on background |
| Browser Wars → Post-Crash | BSOD wipe: the screen turns blue with white error text, then dissolves into clean white | Full-screen overlay + dissolve shader |
| Post-Crash → Mobile | The page "unlocks" like a phone — a swipe gesture visualization, then rotation to portrait, then rotate back to landscape in new era | CSS 3D perspective + shader blend |
| Mobile → Flat | Every texture and gradient strips away in sequence — leather first, then gradients, then shadows, until only flat color remains | Progressive alpha mask over texture layers |
| Flat → Now | The screen cracks subtly (like phone glass), then shatters into dark fragments, then resolves to the near-black present | Triangle fragment system + WebGL |

---

## What Makes It Unrecognizable

**From NYT Snow Fall:** Snow Fall is static content with layered images. Chronicle's
chapters have interactive artifacts within them — a working terminal in ARPANET,
a "visitor counter" that increments in the Browser Wars era, a dark mode toggle
that was introduced in the Modern chapter. The content is alive.

**From design agency scroll sites:** Those sites have one visual language that
doesn't change. Chronicle has seven. The visual transitions ARE the product.

**From timeline infographics:** There is no timeline sidebar. No dots. No
connecting lines. You ARE in the era. It's immersive, not illustrative.

**The thing nobody has done:** The transition shaders. Every scroll-driven site
uses CSS transitions or GSAP crossfades. Custom GLSL transitions that are
semantically meaningful to the content they're transitioning between — a BSOD
for the dot-com crash — have not been done in a publicly deployed web project
at this quality level.

---

## Technical Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Scroll engine | GSAP ScrollTrigger | Industry standard, most control over pin/unpin logic |
| Chapter transitions | Custom GLSL fragment shaders (WebGL 2) | CSS cannot do CRT effects, BSOD dissolves, or glass shatter |
| WebGL context | Raw WebGL 2 (for shaders), Three.js acceptable for the glass-shatter transition | Minimal abstraction over shader pipeline |
| Typography | Variable fonts per chapter | Axes animated by GSAP during within-chapter scroll |
| Interactive artifacts | Vanilla DOM | Working terminal (ARPANET), visitor counter (Browser Wars) |
| Sound | Tone.js | Ambient audio per era, Web Audio-based so it crossfades correctly |
| Build | Vite + vanilla TS | No React — direct DOM control needed for chapter swapping |
| Performance | Intersection Observer, chapter lazy-init | Only the visible chapter's animation system runs |

**Chapter data model** — chapters are JSON objects with:
```json
{
  "id": "arpanet",
  "yearRange": "1969–1982",
  "palette": { "bg": "#000000", "text": "#FF9500" },
  "fontFamily": "Courier New",
  "artifacts": ["terminal", "network-map"],
  "ambientAudio": "arpanet-beeps.mp3",
  "facts": [...]
}
```

> Note: `transitionOut` is NOT a chapter property. Transitions are relationships between chapters and live in `src/data/transitions.ts`, keyed by `{from, to}` pair (D5).

The render engine reads this and applies the chapter's visual system. New eras
can be added by adding a new JSON object + implementing any new artifacts.

---

## Visual Quality Targets

These are non-negotiable. If any of these aren't met, the project doesn't ship.

1. **The ARPANET chapter must look like a real terminal.** Not a font that looks
   terminal-ish. A real amber phosphor CRT effect — the slight rounding of the
   text at the edges, the scanline overlay, the subtle screen-edge vignette,
   the phosphor glow bleeding around bright characters. Reference: old ThinkPad
   X61 running a green-screen BBS.

2. **The Browser Wars chapter must be authentically ugly.** Gaudy animated GIFs
   (real ones, appropriately ridiculous), a tiled background pattern, a hit
   counter, a "Best viewed in Internet Explorer 4.0" badge. This requires taste
   to execute correctly — ugly done wrong just looks broken. Ugly done right
   looks like a period piece.

3. **The transition shaders must have no perceptible frame drop.** Each shader
   is profiled. If a shader can't run at 60fps on a MacBook Air M3, it gets
   simplified until it does. The experience of the transition is that it feels
   like a cut in a film — fast, sure, deliberate.

4. **The typing effect in the ARPANET chapter must sound right.** Individual
   keystrokes play at slightly randomized timing and pitch (like a real
   typewriter). Not evenly spaced. Not all the same pitch. If it sounds like
   a notification sound, it's wrong.

5. **The "Now" chapter must feel like the future, not like a current design
   trend.** Glassmorphism exists today. The "Now" chapter should push into
   something that feels ahead of where design is — the kind of thing that
   looks like a design concept from 2028. This will require the most creative
   design work in the project.

---

## Feature Breakdown

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Scroll engine: chapters pin correctly, progress bar accurate
- [ ] Chapter data model: JSON structure, render engine reads it
- [ ] ARPANET chapter: full visual identity — terminal effect, ambient audio, CRT shader
- [ ] Modern chapter: full visual identity — glassmorphism, dark palette, variable fonts
- [ ] First transition shader: CRT power-off between ARPANET and next chapter
- [ ] These two chapters alone should be shippable as a proof-of-concept

### Phase 2 — Full Chapter Build-Out (Weeks 5–14)
- [ ] All 7 chapters fully designed, animated, audible
- [ ] All 6 transition shaders authored and profiled
- [ ] Interactive artifacts per chapter (terminal, visitor counter, etc.)
- [ ] Variable font axes wired to scroll position within each chapter

### Phase 3 — Polish (Weeks 15–22)
- [ ] Within-chapter parallax: text at different depths
- [ ] Per-chapter easter eggs (hidden in each era)
- [ ] Mobile: chapters reflow — less immersive but still functional
- [ ] Accessibility: reduced motion mode degrades to static-per-chapter
- [ ] Performance audit: every shader profiled, lazy loading, font subsetting
- [ ] The "Now" chapter pushed to feel genuinely ahead of current design

### Phase 4 — Depth (Months 6+)
- [ ] Add more facts/events to each chapter's data model
- [ ] New chapters: "The Metaverse Attempt" (2020–2022), "The AI Web" (2023+)
- [ ] Community: a form for people to submit forgotten moments from each era
- [ ] Blog post: "How We Built Chronicle" with the shader source code

---

## Key Design Decisions

1. **Content comes before animation.** If a chapter has bad facts or shallow
   content, no animation saves it. The writing and research for each chapter
   are equal to the engineering work.

2. **No chapter reuses another chapter's transition.** Six transitions, six
   unique effects. This is firm.

3. **Sound is on by default, but the first sound plays only after the first
   intentional scroll.** Not on page load.

4. **The Browser Wars chapter uses real 90s design conventions, not a
   pastiche of them.** This requires research: actual color palettes, actual
   typefaces, actual UI widget styles. A designer who didn't live through the
   90s gets this wrong. Reference Geocities screenshots.

5. **No chapter longer than 2 viewport-heights of scrolling.** If a chapter
   needs more space, the content is too dense. Cut, don't expand.

---

## Open Questions

- **Subject scope:** "History of the Internet" is large. Should the chapters
  focus on visual/design history specifically (the design of the web) rather
  than technical events? That's a tighter editorial lens and plays to our strengths.
- **Transition timing:** Scroll-triggered transitions need a "dwell" moment —
  the user should be at 100% of a chapter before the transition begins. How
  long is the dwell? Too short feels rushed; too long feels sticky.
- **Audio licensing:** Ambient sounds per era need to be either original
  recordings or Creative Commons. Budget this.

---

## Estimated Investment

Minimum shippable, impressive version: **4–6 months**
Reference-quality, all shaders, all chapters, all artifacts: **12+ months**
