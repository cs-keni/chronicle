# Bundled fonts

## Comic Neue (SIL Open Font License 1.1)

`comic-neue-regular.woff2`, `comic-neue-bold.woff2` — subset to the glyph set the
Browser Wars chapter and the lobby card actually use (Latin + the punctuation and
symbols in the marquee/badges). Full license in `OFL.txt`.

Source: Google Fonts (`fonts.gstatic.com/s/comicneue/v9`). Designer: Craig Rozynski.

### Why this is bundled at all

`src/chapters/lobby/style.css` previously ended its stack at a bare generic:
`'Comic Sans MS', 'Chalkboard SE', cursive`. Chalkboard SE ships only on macOS, so on
Linux and Android **both** named faces miss and the browser falls through to whatever it
considers `cursive` — usually nothing, so it lands on the system default sans. There is no
console error. The Browser Wars chapter's typography **is** its design, so that failure
silently turns "correctly ugly 1998 page" into "badly made modern page" on roughly a third
of devices. See `docs/BROWSER-WARS-BRIEF.md`.

### Known deviation from the brief

`docs/BROWSER-WARS-BRIEF.md` originally specified **Comic Relief**, which is metrically
compatible with Comic Sans MS. Comic Relief could not be sourced from a reliable
distribution point at build time. **Comic Neue is shipped instead** — same license class
(SIL OFL), same job, but it is a *redesign* rather than a metric clone: it sets slightly
narrower and cleaner than Comic Sans.

Consequence: on a machine that has real Comic Sans the chapter renders in Comic Sans; on a
machine that does not, it renders in Comic Neue and lines will set marginally shorter. That
is a cosmetic difference between two comic faces, not the failure this bundle exists to
prevent. If Comic Relief becomes sourceable, swapping it in is a drop-in replacement — the
`@font-face` family name is the only thing to change.
