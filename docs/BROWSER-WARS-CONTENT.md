# Browser Wars Chapter — Content

**Era:** 1995–2001 · **Chapter id:** `browser-wars` · 6 facts

Mirrors the `headline` / `year` / `body` / `visualArtifact` shape used by
`docs/ARPANET-CONTENT.md` and `docs/EARLY-WEB-CONTENT.md`. The canonical records live in
`src/data/chapters.ts`; this doc is the authored source and the place to argue about
accuracy. Design treatment: `docs/BROWSER-WARS-BRIEF.md`.

**Scope rule:** every fact is a *visual / design-history* fact. Chronicle is a museum of how
the web looked, not a history of companies. Antitrust, market share, and IPOs appear only
where they changed what pages looked like.

**Deliberate omission — GeoCities.** `EARLY-WEB-CONTENT.md` already owns "Everyone Got a Home
Page" (1994, GeoCities, under-construction culture). Repeating it here would make the two
chapters argue over the same territory. Browser Wars inherits the *look* GeoCities produced
and spends its six facts on what was new after 1995.

**The arc these six facts trace:** the war is fought through proprietary tags → designers get
real typographic control for the first time → the screen gets its own typefaces → a
micro-format nobody standardized becomes universal → layout freezes to a fixed width → the web
splits in two. It ends on fragmentation, which is what Post-Crash cleans up.

---

## 1. The War Was Fought in Tags

**Year:** 1995

Lou Montulli wrote `<blink>` at Netscape in an evening, after a bar conversation about what
text could do on a screen that it could never do in print. It shipped in Navigator and became
the most reviled element in HTML. Microsoft's answer was `<marquee>` in Internet Explorer —
text that slid across the page. Neither tag was ever standardised, and neither browser
implemented the other's. For six years the two companies competed by inventing HTML nobody
else supported, and the design vocabulary of the era is the residue of that fight.

**Visual artifact:** the two tags side by side and actually running — `<blink>` pulsing on the
left, `<marquee>` sliding on the right, each labelled with the browser that shipped it and the
one that refused to.

---

## 2. Netscape Gave Designers the Font Tag

**Year:** 1995

Until `<font face size color>`, a web designer could specify structure and nothing else — the
reader's browser picked the typeface. Netscape's proprietary extensions handed over typeface,
size, colour, `bgcolor`, and `<center>` in one release. It was the first time anyone could
*design* a web page rather than mark it up, and the immediate result was a decade of
ransom-note typography. The tag was deprecated by HTML 4 within three years, having already
taught an entire generation that appearance belonged in the markup.

**Visual artifact:** one paragraph rendered twice — as the browser's default serif on the
left, and on the right wrapped in `<font face="Comic Sans MS" size="5" color="#FF00FF">` with
the tag itself shown above it in monospace.

---

## 3. Animation Arrived as a Looping Bug

**Year:** 1996

The GIF89a specification included a frame-delay field but said nothing about repeating.
Netscape 2.0 added a looping extension — an application-block hack tucked inside the file
format — and the animated GIF was born. It needed no plugin, no player, and no permission,
so it spread everywhere: spinning envelopes, dancing figures, rotating skulls, flaming NEW!
banners. The web's first native motion was a side effect of a vendor extension to a
compression format designed for static pictures.

**Visual artifact:** a 16-colour animated GIF decomposed into its frames as a filmstrip, with
the frame-delay value and the Netscape looping block called out as raw bytes underneath.

---

## 4. Two Typefaces Were Drawn for the Screen

**Year:** 1996

Matthew Carter designed Verdana and Georgia for Microsoft to solve a problem no printed
typeface had ever faced: legibility at 96 dots per inch, where a lowercase letter is about ten
pixels tall. Verdana's characters are unusually wide and open, its counters exaggerated, its
`1` and `l` deliberately distinguishable. Microsoft gave both away free through Core Fonts for
the Web. They were the first typefaces designed for the screen rather than adapted to it, and
they remained the most trustworthy text on the web for a decade.

**Visual artifact:** the word "Illegible" set in Times New Roman and in Verdana at 11px,
magnified until the pixel grid is visible, so the wider counters and the disambiguated `I`/`l`
are unmissable.

---

## 5. The 88×31 Button Nobody Standardised

**Year:** 1997

"Netscape Now!" was 88 pixels wide and 31 pixels tall. So was "Get Internet Explorer." So was
"Made with Notepad," "Best Viewed at 800×600," and every webring badge, host banner, and
anti-Microsoft protest button on the amateur web. No standards body ever specified the size —
it propagated because the first popular buttons happened to use it and everyone else matched
so their badges would stack neatly. It is the internet's first user-generated design standard,
and it survived purely because it made a tidy column.

**Visual artifact:** a column of authored 88×31 buttons at true pixel size, with the
dimensions dimensioned like a technical drawing, captioned that nothing anywhere required it.

---

## 6. The Web Stopped Being Fluid

**Year:** 1998

As 800×600 overtook 640×480 as the common screen, designers stopped building pages that
reflowed and started building them to a fixed 760-pixel table — 800 minus the scrollbar and
margins. A page was now a fixed-width object placed on a screen rather than a document that
adapted to it. The habit outlived its reason by fifteen years and only broke with responsive
design. Pages of this era carry the receipt in their footers: *Best viewed in Netscape
Navigator 4.0 at 800×600.*

**Visual artifact:** the same page in a 640px and a 1024px window — identical 760px column
adrift in the wider one, a hard horizontal scrollbar in the narrower — with the "best viewed
in" footer line reproduced beneath both.
