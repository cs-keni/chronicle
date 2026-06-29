// ARPANET network map — December 1969 BBN map reproduction.
// Injected into the existing #arpanet-network-map SVG placeholder.
//
// Historical topology (4 nodes, 4 IMP links):
//   SRI ─────────── UTAH
//   │                 │
//   UCLA ─── UCSB ───┘
//
// Animation: lines draw in via stroke-dashoffset, nodes/labels appear after.

const AMBER = '#FF9500';
const AMBER_DIM = 'rgba(255,149,0,0.4)';

const NODES: Array<{
  id: string; label: string; x: number; y: number; sublabel: string;
}> = [
  { id: 'sri',  label: 'SRI',  x: 80,  y: 65,  sublabel: 'MENLO PARK' },
  { id: 'utah', label: 'UTAH', x: 260, y: 65,  sublabel: 'SALT LAKE CITY' },
  { id: 'ucla', label: 'UCLA', x: 80,  y: 195, sublabel: 'LOS ANGELES' },
  { id: 'ucsb', label: 'UCSB', x: 200, y: 195, sublabel: 'SANTA BARBARA' },
];

// Each link: {from node id → to node id, draw delay in seconds}
const LINKS = [
  { from: 'sri',  to: 'utah', delay: 0.0 },
  { from: 'sri',  to: 'ucla', delay: 0.7 },
  { from: 'ucla', to: 'ucsb', delay: 1.4 },
  { from: 'ucsb', to: 'utah', delay: 2.1 },
];

const LINK_DURATION = 0.9; // seconds per line draw
const NODE_DELAY = 2.8;    // all nodes appear together after links complete

// visibleAt: seconds after DOM insertion when the SVG parent becomes visible.
// Link animation delays are offset by this so lines start drawing as the map appears.
export function initNetworkMap(svgEl: SVGSVGElement, visibleAt = 0) {
  const nodeMap = new Map(NODES.map(n => [n.id, n]));

  // Title label
  svgEl.appendChild(makeText(170, 18, 'ARPANET — DEC 1969', 9, 'middle', AMBER_DIM, 'arpanet-map-title'));

  // IMP link lines
  const lineEls: SVGLineElement[] = [];
  for (const link of LINKS) {
    const a = nodeMap.get(link.from)!;
    const b = nodeMap.get(link.to)!;
    const line = makeLine(a.x, a.y, b.x, b.y);
    svgEl.appendChild(line);
    lineEls.push(line);
  }

  // Node groups (circle + label + sublabel)
  const nodeEls: SVGGElement[] = [];
  for (const node of NODES) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.opacity = '0';
    g.style.transition = `opacity 0.8s ease-in ${NODE_DELAY}s`;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(node.x));
    circle.setAttribute('cy', String(node.y));
    circle.setAttribute('r', '14');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', AMBER);
    circle.setAttribute('stroke-width', '1.5');

    const label = makeText(node.x, node.y + 4, node.label, 9, 'middle', AMBER);
    const sub = makeText(node.x, node.y + 26, node.sublabel, 7, 'middle', AMBER_DIM);

    g.appendChild(circle);
    g.appendChild(label);
    g.appendChild(sub);
    svgEl.appendChild(g);
    nodeEls.push(g);
  }

  // Animate lines in using stroke-dashoffset trick
  // Must happen after elements are in the DOM so getTotalLength() works.
  requestAnimationFrame(() => {
    lineEls.forEach((line, i) => {
      const len = line.getTotalLength();
      line.style.strokeDasharray = `${len}`;
      line.style.strokeDashoffset = `${len}`;
      // Force reflow so the initial state is painted before transition starts
      line.getBoundingClientRect();
      line.style.transition =
        `stroke-dashoffset ${LINK_DURATION}s ease-in-out ${LINKS[i].delay + visibleAt}s`;
      line.style.strokeDashoffset = '0';
    });

    // Fade nodes in after all links finish (last link ends at visibleAt + 2.1 + 0.9 = visibleAt + 3s)
    nodeEls.forEach(g => {
      g.style.transitionDelay = `${NODE_DELAY + visibleAt}s`;
      g.style.opacity = '1';
    });
  });
}

function makeLine(x1: number, y1: number, x2: number, y2: number): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', AMBER);
  line.setAttribute('stroke-width', '1');
  line.setAttribute('stroke-linecap', 'round');
  return line;
}

function makeText(
  x: number,
  y: number,
  content: string,
  size: number,
  anchor: string,
  fill: string,
  cls?: string,
): SVGTextElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('text-anchor', anchor);
  el.setAttribute('font-family', "'Courier New', monospace");
  el.setAttribute('font-size', String(size));
  el.setAttribute('fill', fill);
  el.setAttribute('letter-spacing', '0.08em');
  if (cls) el.setAttribute('class', cls);
  el.textContent = content;
  return el;
}
