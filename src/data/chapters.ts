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
