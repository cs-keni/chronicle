export interface TransitionDef {
  shader: string;
  duration: number; // ms
}

// Transitions are relationships between chapters, NOT properties of chapters (D5).
// Key format: 'fromId->toId'
const registry: Record<string, TransitionDef> = {
  // CRT power-off now sits at its canonical ARPANET → Early Web position (the
  // terminal collapses to a white line that resolves into the Mosaic page).
  'arpanet->early-web': { shader: 'crt-power-off', duration: 2500 },
  // glass-shatter debuts as a TEMPORARY early-web → figma-era bridge. Its
  // canonical home is flat → figma-era (PHASES:197); the shader is authored
  // source-agnostic so that later move is just a key change here, no shader edit.
  'early-web->figma-era': { shader: 'glass-shatter', duration: 2000 },
};

export function getTransition(from: string, to: string): TransitionDef | null {
  return registry[`${from}->${to}`] ?? null;
}

export function hasTransition(from: string, to: string): boolean {
  return `${from}->${to}` in registry;
}
