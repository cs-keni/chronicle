export interface ChapterFact {
  headline: string;
  year: number;
  body: string;
  visualArtifact: string;
}

export interface ChapterPalette {
  bg: string;
  text: string;
  accent?: string;
}

export interface Chapter {
  id: string;
  name: string;
  yearRange: string;
  palette: ChapterPalette;
  fontFamily: string;
  artifacts: string[];
  ambientAudio?: string;
  facts: ChapterFact[];
}

export const chapters: Chapter[] = [
  {
    id: 'arpanet',
    name: 'ARPANET',
    yearRange: '1969–1982',
    palette: { bg: '#000000', text: '#FF9500' },
    fontFamily: "'Courier New', Courier, monospace",
    artifacts: ['terminal', 'network-map'],
    facts: [
      {
        headline: 'The Teletype Model 33 Had No Lowercase',
        year: 1969,
        body: 'The first ARPANET terminals were Teletype Model 33 machines — electromechanical typewriters printing on paper rolls at 10 characters per second. The Model 33 had no lowercase letters. ALL-CAPS was a hardware constraint, not a choice. Every early ARPANET communication was shouted in uppercase by necessity.',
        visualArtifact: 'Rendered Teletype output tape — all-caps monospaced text on continuous paper: CONNECTED TO ARPANET NODE 1 / UCLA NODE 1 / USER: CROCKER / LOGIN ACCEPTED',
      },
      {
        headline: 'Four Nodes. One Network Map.',
        year: 1969,
        body: 'The first ARPANET map, produced by Bolt Beranek and Newman in December 1969, showed four nodes connected by 50kbps IMP lines: UCLA, SRI, UCSB, and Utah. Nodes were labeled circles. Lines were connections. This was the first visual representation of a computer network ever printed — pinned to a wall at BBN headquarters.',
        visualArtifact: 'SVG reproduction of December 1969 ARPANET logical map — four circles (UCLA, SRI, UCSB, UTAH) connected by lines, amber-on-black, two-letter node labels',
      },
      {
        headline: 'RFC 1 Was Typed on a Typewriter',
        year: 1969,
        body: "Steve Crocker's Request for Comments #1, written at UCLA on April 7 1969, established the typographic convention governing ARPANET documentation for two decades: plain ASCII, 72 characters wide, monospaced, no decoration. Crocker chose the 'Request for Comments' title deliberately — he wanted the format to feel provisional, easy to contest. The humble typography was the point.",
        visualArtifact: "RFC 1 opening lines in original treatment — 'Network Working Group / Request for Comments: 1 / S. Crocker / UCLA / 7 April 1969' in Courier New at 72 chars wide, amber on black",
      },
      {
        headline: 'Green Phosphor Was Upgraded to Amber',
        year: 1979,
        body: 'Early CRT terminals glowed green — P1 phosphor on black glass. Through the late 1970s, amber (P3) phosphor was marketed as easier on the eyes for long reading sessions, and by the early 1980s amber terminals had become the professional standard. Green was entry-level. Amber said: this terminal is for people who spend all day here.',
        visualArtifact: 'Split-screen: left panel shows the same text in P1 green phosphor (#33FF33), right in P3 amber (#FF9500). Same line: CONNECTED TO ARPANET NODE 1 — 1969',
      },
      {
        headline: 'The VT100 Defined the 80-Column Universe',
        year: 1978,
        body: "DEC's VT100, released August 1978, became the most widely cloned terminal in history and the reason 80-column text is still a default in almost every code editor today. Its 80-column width was inherited from the IBM punch card, which encoded 80 characters per card. Hardware formats became cultural ones — the punch card's width is still in your terminal window.",
        visualArtifact: 'VT100 screen in authentic aspect ratio — 80 characters wide, 24 lines, Courier New, amber, scanlines at 30% opacity, showing a mock ARPANET session log',
      },
      {
        headline: 'Xerox PARC Invented the Desktop Metaphor in Secret',
        year: 1973,
        body: 'While ARPANET terminals showed amber text on black glass, a different visual grammar was being invented a few miles away at Xerox PARC. The Alto — built 1973, never sold — had a bitmapped display, a mouse, overlapping windows, proportional fonts. PARC kept it internal for years. The two visual paradigms of computing coexisted in 1973–1982, unknown to each other outside a small research community.',
        visualArtifact: 'Side-by-side: left is an ARPANET terminal session (amber, monospaced, character-cell grid), right is a Xerox Alto GUI reproduction (white bg, bitmapped fonts, document windows). Both dated 1973.',
      },
      {
        headline: 'The Character Cell: Every Letter in Its Own Box',
        year: 1978,
        body: "CRT terminal text was organized in a fixed grid of identical rectangles — on the VT100, each character was drawn as a 7×9 dot matrix inside a fixed cell. This wasn't limiting; it was generative. The monospaced grid made data tables readable without CSS, enabled ASCII art without graphics hardware, gave every terminal application an inherent visual rhythm. The character cell is the reason terminal UIs still feel cleaner than most modern interfaces.",
        visualArtifact: 'Zoomed diagram of a VT100 character cell grid — uniform rectangular cells tiling the screen, each holding a 7×9 dot-matrix glyph (A, R, P shown). Amber pixel dots on black, grid lines visible at 1px opacity.',
      },
      {
        headline: 'The Baud Rate Was a Sound',
        year: 1980,
        body: 'Early ARPANET connections traveled over acoustic couplers — a telephone handset placed into rubber cups that converted digital signals into audible tones. At 300 baud (about 30 characters per second), you could hear the data as a high-pitched warble. Every character that appeared on screen had arrived as a specific sound through the telephone system. The modem was not incidental to the network; it was the network made audible.',
        visualArtifact: 'Oscilloscope-style waveform display — amber lines on black — showing the acoustic waveform of a 300-baud modem signal. Below it: the character that waveform encodes, appearing letter-by-letter.',
      },
    ],
  },
  {
    id: 'early-web',
    name: 'Early Web',
    yearRange: '1983–1994',
    // Web-safe palette (EARLY-WEB-BRIEF.md): Mosaic system gray, navy headings,
    // black Times body. Accent = navy for headings/rules.
    palette: { bg: '#C0C0C0', text: '#000000', accent: '#000080' },
    fontFamily: "'Times New Roman', Times, serif",
    artifacts: ['browser-frame', 'hit-counter'],
    facts: [
      {
        headline: 'The Web Was Born as Plain Text',
        year: 1991,
        body: 'On 6 August 1991, Tim Berners-Lee posted a short message to the alt.hypertext newsgroup linking to the first website, running on a NeXT machine at CERN. The page was plain text with a handful of blue underlined links — no images, no color, no layout. It explained what the World Wide Web was and how to build a browser. The first web page was a page about the web itself.',
        visualArtifact: 'The info.cern.ch page recreated in system serif — a left-aligned column of black text on gray, a bold heading, and a few blue underlined links. No graphics. URL bar reading http://info.cern.ch/hypertext/WWW/TheProject.html',
      },
      {
        headline: 'Mosaic Put Images Inline',
        year: 1993,
        body: 'NCSA Mosaic, released in 1993, was the browser that made the web look like something. Its key move was the <img> tag: earlier browsers opened images in a separate window, but Mosaic drew them inline, mixed with the text, on a default battleship-gray page. Suddenly a web page was a document you could design. Within a year the web stopped being a physicist’s tool and started being a medium.',
        visualArtifact: 'A Mosaic window on #C0C0C0 gray — a heading, a paragraph of Times text, and a small dithered inline image sitting in the text flow, the way Mosaic first rendered <img>.',
      },
      {
        headline: 'Blue Meant "Click Here"',
        year: 1993,
        body: 'Mosaic painted unvisited links blue and underlined, and turned them purple once you had followed them. Nobody legislated this — it was a default that became a law. For the next decade, blue-and-underlined was the universal signal for "this is a link," and the color change was the web’s first piece of memory: the page remembered where you had already been.',
        visualArtifact: 'Two stacked links — one #0000EE blue underlined (unvisited), one #551A8B purple underlined (visited) — captioned that the color difference is the page remembering your history.',
      },
      {
        headline: 'Designers Built Pages Out of Tables',
        year: 1994,
        body: 'HTML had no layout system, so designers took the <table> tag — meant for tabular data — and bent it into a page-layout grid. Invisible tables, nested tables, and single-pixel spacer GIFs stretched to prop columns apart. It was a hack that hardened into standard practice across 1994–96, and it ran design on the web until CSS was trusted years later. The most-used layout tool of the early web was never meant for layout at all.',
        visualArtifact: 'A page skeleton with its invisible table borders switched on — nested rectangles holding a masthead, a narrow side column, and a body column, with a 1px spacer GIF called out where it wedges two cells apart.',
      },
      {
        headline: '216 Colors Everyone Could Agree On',
        year: 1994,
        body: 'Most screens in 1994 showed only 256 colors, and browsers reserved some for the system, so a color you chose might dither into speckle on someone else’s monitor. Netscape rendered against a 6×6×6 cube — 216 colors that displayed cleanly on any 256-color screen. That "web-safe" palette became the box every early web designer worked inside: not a limit someone imposed, but the shared floor that let a page look the same on two different machines.',
        visualArtifact: 'The 216 web-safe swatches as a 6×6×6 grid, a couple of hex values (#CC0000, #008080, #000080) labeled, with a dithered vs. clean patch showing what happened to an off-palette color on a 256-color display.',
      },
      {
        headline: 'Everyone Got a Home Page',
        year: 1994,
        body: 'GeoCities started in 1994 and handed ordinary people a plot of web to build on. The result was gloriously loud: tiled backgrounds, animated "Under Construction" signs, spinning skulls, guestbooks, hit counters, and webrings linking one amateur page to the next. It was the first time the web belonged to non-experts, and it looked exactly like a medium being learned in public — earnest, ornamented, and alive.',
        visualArtifact: 'A GeoCities-style page corner — a yellow-and-black "Under Construction" hazard bar, a green odometer hit-counter reading 000427, and a webring link strip, all on tiled gray.',
      },
    ],
  },
  {
    id: 'figma-era',
    name: 'Figma Era',
    yearRange: '2019–2023',
    palette: { bg: '#0A0A0A', text: '#FFFFFF', accent: '#00D4FF' },
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Geist', 'Inter', sans-serif",
    artifacts: ['floating-cards'],
    facts: [
      {
        headline: 'Dark Mode Became the Default',
        year: 2019,
        body: 'Apple shipped system-wide dark mode in macOS Mojave and iOS 13. Every major app shipped a dark theme within six months. What began as a developer preference became the default aesthetic of serious design work. Dark mode was not a color scheme — it was a signal about who you were designing for.',
        visualArtifact: 'Side-by-side iOS toggle: left shows light mode (white, soft shadows, gray UI); right shows dark mode (#0A0A0A, glass cards, #00D4FF accents). The toggle switch is caught mid-transition.',
      },
      {
        headline: 'Design Systems Ate the World',
        year: 2020,
        body: 'Figma made component libraries collaborative and version-controlled. Design teams stopped delivering individual screens and started delivering systems. Tokens — --color-accent, --radius-md, --space-4 — became the shared language between design and engineering. The output of a design team was now a grammar, not a specification.',
        visualArtifact: 'A Figma component panel — nested components listed hierarchically. Button/Primary, Button/Secondary, Card/Default, Card/Hover. Arrows showing the token inheritance chain. Glass card aesthetic, #00D4FF border on selected component.',
      },
      {
        headline: 'Glassmorphism: The Aesthetic of Translucence',
        year: 2021,
        body: 'WWDC 2021 shipped visionOS design previews. Every SaaS dashboard followed. Frosted glass surfaces, backdrop-filter blur, colored light bleeding through stacked translucent layers — the aesthetic of spatial computing brought into 2D. At its best, it created genuine depth. At its worst, it was purple blur on purple blur.',
        visualArtifact: 'Three overlapping glass cards at different z-depths against #0A0A0A. Each card: rgba(255,255,255,0.05) background, blur(20px), white border at 8% opacity. #00D4FF glow on the frontmost card edge.',
      },
      {
        headline: 'Geist and the Variable Font Era',
        year: 2022,
        body: "Vercel's Geist typeface — designed for developer tools, deployed across Next.js docs and dashboards — became the typeface that said 'this is a serious design system.' Variable font axes tied to component contexts: display weight for headings, regular for body, light for captions. Typography became systematic, not chosen per-project.",
        visualArtifact: 'Geist type specimen — the word CHRONICLE rendered at multiple weights (100 to 900) in a single column, each weight labeled with its token name: --text-display, --text-body, --text-label. White on #0A0A0A.',
      },
    ],
  },
];

export function getChapter(id: string): Chapter | undefined {
  return chapters.find(c => c.id === id);
}
