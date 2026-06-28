export interface TransitionDef {
  shader: string;
  duration: number; // ms
}

// Transitions are relationships between chapters, NOT properties of chapters (D5).
// Key format: 'fromId->toId'
const registry: Record<string, TransitionDef> = {
  // Phase 1: ARPANET → Figma Era uses CRT power-off as temporary assignment.
  // Phase 2: CRT moves to its canonical ARPANET → Early Web position.
  'arpanet->figma-era': { shader: 'crt-power-off', duration: 2500 },
};

export function getTransition(from: string, to: string): TransitionDef | null {
  return registry[`${from}->${to}`] ?? null;
}

export function hasTransition(from: string, to: string): boolean {
  return `${from}->${to}` in registry;
}
