# ARPANET Chapter Content
## Visual & Design History, 1969–1982

Content scope: visual grammar, interface design, and typographic constraints of the ARPANET era. Each fact feeds the `facts[]` array in the chapter data model. Format: `{ headline, year, body, visual_artifact }`.

---

### Fact 1

**headline:** "The Teletype Model 33 Had No Lowercase"
**year:** 1969
**body:** The first ARPANET terminals weren't screens — they were Teletype Model 33 machines: electromechanical typewriters connected to the network, printing on paper rolls at 10 characters per second. The Model 33 had no lowercase letters. ALL-CAPS wasn't a stylistic choice — it was a hardware constraint. Every early ARPANET communication, every RFC, every session log was shouted in uppercase by necessity.
**visual_artifact:** A rendered Teletype Model 33 output tape — continuous paper strip with all-caps monospaced text, ink slightly smeared, showing an early ARPANET login exchange: `IMP READY / UCLA NODE 1 / USER: CROCKER / LOGIN ACCEPTED`

---

### Fact 2

**headline:** "Four Nodes. One Network Map."
**year:** 1969
**body:** The first ARPANET map, produced by Bolt Beranek and Newman in December 1969, showed four nodes connected by 50kbps IMP lines: UCLA, SRI, UCSB, and the University of Utah. Nodes were represented as labeled circles, connections as straight lines. This diagram — simple to the point of abstraction — was the first visual representation of a computer network ever printed. It was pinned to a wall at BBN headquarters and became the template for every network topology diagram that followed.
**visual_artifact:** SVG reproduction of the December 1969 ARPANET logical map — four circles (UCLA, SRI, UCSB, UTAH) connected by lines, amber-on-black, with the original BBN label style: two-letter abbreviations, no icons, pure geometry.

---

### Fact 3

**headline:** "RFC 1 Was Typed on a Typewriter"
**year:** 1969
**body:** Steve Crocker's Request for Comments #1, written at UCLA on April 7, 1969, established the typographic convention that governed ARPANET documentation for two decades: plain ASCII, 72 characters wide, monospaced, no headers beyond the date and author. Crocker chose the "Request for Comments" title deliberately — he wanted the format to feel provisional, collaborative, easy to contest. The humble typography was the point. Anyone with a Teletype could read and respond.
**visual_artifact:** A faithful reproduction of RFC 1's opening lines in the original typographic treatment — `Network Working Group / Request for Comments: 1 / S. Crocker / UCLA / 7 April 1969` — in Courier New at exactly 72 characters wide, amber on black, with subtle phosphor glow.

---

### Fact 4

**headline:** "Green Phosphor Was Upgraded to Amber"
**year:** 1979
**body:** The first CRT terminals used P4 phosphor: a green-white glow on black. By the late 1970s, studies from IBM and DEC showed that extended reading on amber phosphor (P12 — longer wavelength, warmer tone) caused measurably less eye strain than green. Amber terminals like the Wyse-50 and DEC VT241 became the professional standard by 1980. Green was entry-level. Amber was the premium choice for serious work — the color that said "this terminal is for people who spend all day here."
**visual_artifact:** A split-screen comparison: left panel shows the same terminal text in P4 green phosphor (`#33FF33` on black, tighter glow, cooler tone); right panel shows the same text in P12 amber (`#FF9500` on black, softer spread, warmer halo). Both showing: `CONNECTED TO ARPANET NODE 1 — 1969`.

---

### Fact 5

**headline:** "The VT100 Defined the 80-Column Universe"
**year:** 1978
**body:** DEC's VT100, released in August 1978, became the most widely cloned terminal in history and the reason 80-column text is still a default in almost every code editor today. Its 80-column width wasn't an engineering choice — it was inherited from the IBM punch card, which encoded 80 characters per card. Hardware formats became cultural ones: the punch card's width became the Teletype's paper width, which became the VT100's screen width, which became the terminal window default, which became the line-length recommendation in style guides written in 2024.
**visual_artifact:** A VT100 screen rendering showing the terminal in its authentic aspect ratio — text 80 characters wide, 24 lines tall, in Courier New, amber, with scanlines at 30% opacity and a visible character-cell grid at the edges. The text displays a mock ARPANET session log with realistic IMP responses.

---

### Fact 6

**headline:** "Xerox PARC Invented the Desktop Metaphor in Secret"
**year:** 1973
**body:** While ARPANET terminals showed amber text on black glass, a different visual grammar was being invented 40 miles away at Xerox PARC in Palo Alto. The Alto — built in 1973, never sold to the public — had a bitmapped display, a mouse, overlapping windows, and proportional fonts. It looked nothing like the terminal world of its time. PARC kept it internal for years. The two visual paradigms of computing — the terminal and the GUI — coexisted in 1973–1982, unknown to each other outside a small research community.
**visual_artifact:** A side-by-side composition: left is an ARPANET terminal session (amber, monospaced, character-cell grid visible), right is a reproduction of the Xerox Alto GUI (white background, bitmapped fonts, overlapping document windows with scroll bars). Both dated 1973. The visual distance between them is the entire history of interface design.

---

### Fact 7

**headline:** "The Character Cell: Every Letter in Its Own Box"
**year:** 1978
**body:** CRT terminal text was organized in a fixed grid of identical rectangular cells — on the VT100, each character occupied exactly 10×12 pixels. This constraint wasn't limiting; it was generative. The monospaced grid made data tables readable without CSS, enabled ASCII art without graphics hardware, and gave every terminal application an inherent visual rhythm. When proportional fonts arrived with the GUI, typographic flexibility came at the cost of this structural discipline. The character cell is the reason terminal UIs still feel cleaner than most modern interfaces.
**visual_artifact:** A zoomed diagram of a VT100 character cell grid — 10×12 pixel rectangles tiling the screen, with a few characters ("A", "R", "P") rendered inside their cells, showing the glyph within the bounding box. Amber pixel dots on black. The grid lines are visible at 1px amber opacity.

---

### Fact 8

**headline:** "The Baud Rate Was a Sound"
**year:** 1980
**body:** Early ARPANET connections traveled over acoustic couplers — a telephone handset placed into rubber cups that converted digital signals into audible tones and back. At 300 baud (300 bits per second), you could hear the data as a high-pitched warble. Faster connections at 1200 baud sounded different — a higher, more continuous tone. The sound of the modem wasn't incidental; it was the network making itself audible. Every character that appeared on screen had arrived as a specific sound through the telephone system.
**visual_artifact:** A visual waveform display — oscilloscope-style, amber lines on black — showing the acoustic waveform pattern of a 300-baud modem signal. Below it: the character that waveform encodes, appearing letter-by-letter as if receiving. Era-appropriate: no labels, just the waveform and the emerging text.
