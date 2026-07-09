# Early Web Chapter — Content

**Era:** 1983–1994 · **Chapter id:** `early-web`

Six facts, mirroring ARPANET's content structure (`headline` / `year` / `body` /
`visualArtifact`). Design/render rules live in `docs/EARLY-WEB-BRIEF.md`; this file
is the source text. Each fact renders as a titled section (navy headline + red Courier
year + Times body) separated by `<hr>` groove rules, revealed sequentially on scroll.

**Accuracy note:** the year on each fact is the era anchor, not a claim that the
practice began precisely that January. Bodies are written to stay true where a single
year would oversimplify (e.g. the web-safe palette and table-layout both hardened over
1994–96; each body says so rather than overclaiming a hard date).

---

## Fact 1 — The Web Was Born as Plain Text

- **year:** 1991
- **body:** On 6 August 1991, Tim Berners-Lee posted a short message to the
  alt.hypertext newsgroup linking to the first website, running on a NeXT machine at
  CERN. The page was plain text with a handful of blue underlined links — no images,
  no color, no layout. It explained what the World Wide Web was and how to build a
  browser. The first web page was a page about the web itself.
- **visualArtifact:** The info.cern.ch page recreated in system serif — a left-aligned
  column of black text on gray, a bold heading, and three or four blue underlined
  links. No graphics. A URL bar reading `http://info.cern.ch/hypertext/WWW/TheProject.html`.

## Fact 2 — Mosaic Put Images Inline

- **year:** 1993
- **body:** NCSA Mosaic, released in 1993, was the browser that made the web look like
  something. Its key move was the `<img>` tag: earlier browsers opened images in a
  separate window, but Mosaic drew them inline, mixed with the text, on a default
  battleship-gray page. Suddenly a web page was a document you could design. Within a
  year the web stopped being a physicist's tool and started being a medium.
- **visualArtifact:** A Mosaic window on `#C0C0C0` gray — a heading, a paragraph of
  Times text, and a small dithered inline image sitting in the text flow, the way
  Mosaic first rendered `<img>`.

## Fact 3 — Blue Meant "Click Here"

- **year:** 1993
- **body:** Mosaic painted unvisited links blue and underlined, and turned them purple
  once you had followed them. Nobody legislated this — it was a default that became a
  law. For the next decade, blue-and-underlined was the universal signal for "this is a
  link," and the color change was the web's first piece of memory: the page remembered
  where you had already been.
- **visualArtifact:** Two links stacked — one `#0000EE` blue underlined (unvisited), one
  `#551A8B` purple underlined (visited) — with a caption pointing out that the color
  difference is the page remembering your history.

## Fact 4 — Designers Built Pages Out of Tables

- **year:** 1994
- **body:** HTML had no layout system, so designers took the `<table>` tag — meant for
  tabular data — and bent it into a page-layout grid. Invisible tables, nested tables,
  and single-pixel spacer GIFs stretched to prop columns apart. It was a hack that
  hardened into standard practice across 1994–96, and it ran design on the web until
  CSS was trusted years later. The most-used layout tool of the early web was never
  meant for layout at all.
- **visualArtifact:** A page skeleton with its invisible table borders switched on —
  nested rectangles holding a masthead, a narrow side column, and a body column, with a
  1px spacer GIF called out where it wedges two cells apart.

## Fact 5 — 216 Colors Everyone Could Agree On

- **year:** 1994
- **body:** Most screens in 1994 showed only 256 colors, and browsers reserved some for
  the system, so a color you chose might dither into speckle on someone else's monitor.
  Netscape rendered against a 6×6×6 cube — 216 colors that displayed cleanly on any
  256-color screen. That "web-safe" palette became the box every early web designer
  worked inside: not a limit someone imposed, but the shared floor that let a page look
  the same on two different machines.
- **visualArtifact:** The 216 web-safe swatches laid out as a 6×6×6 grid, a couple of
  hex values (`#CC0000`, `#008080`, `#000080`) labeled, with a dithered vs. clean patch
  showing what happened to an off-palette color on a 256-color display.

## Fact 6 — Everyone Got a Home Page

- **year:** 1994
- **body:** GeoCities started in 1994 and handed ordinary people a plot of web to build
  on. The result was gloriously loud: tiled backgrounds, animated "Under Construction"
  signs, spinning skulls, guestbooks, hit counters, and webrings linking one amateur
  page to the next. It was the first time the web belonged to non-experts, and it looked
  exactly like a medium being learned in public — earnest, ornamented, and alive.
- **visualArtifact:** A GeoCities-style page corner — a yellow-and-black "Under
  Construction" hazard bar, a green odometer hit-counter reading `000427`, and a
  "webring" link strip, all on tiled gray.

---

## Rendering reference (for T5)

- Order in the chapter = order here (1→6), revealed on scroll via `onChapterProgress`.
- `headline` → `<h2>` navy `#000080` 700. `year` → red `#CC0000` Courier. `body` →
  Times 15px/1.4, ~60ch. `<hr>` groove between sections.
- `visualArtifact` is reference/caption text (as in ARPANET + Figma), not a separately
  rendered widget — the chapter's period artifacts are the browser frame, banner,
  hazard bar, and hit-counter, per the brief.
