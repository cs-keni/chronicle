// Transitions are relationships between chapters, NOT properties of chapters (D5).
// Key format: 'fromId->toId'
//
// Slice 2 (T1) taught this registry a SECOND KIND of transition. Every transition
// before now was a shader on a timer; SPEC.md:71 specs Early Web → Browser Wars as a
// Windows 3.1 dialog whose OK button advances — the project's first user-gated
// transition. See docs/PHASE2-BROWSER-WARS-PLAN.md.

/**
 * Concrete DOM runners, as a literal union rather than `string`.
 *
 * `string` would admit invalid states: every typo type-checks, and there is no
 * resolver that would catch it before runtime. Adding a runner is therefore a
 * deliberate type-level edit here, not an accident in a registry entry.
 */
export type RunnerId = 'win31-dialog';

/**
 * `shader?` is OPTIONAL on the dom variant, not excluded.
 *
 * A `shader | dom` exclusive union would forbid hybrids — and hybrids are exactly
 * what the remaining catalog is made of. SPEC.md:71 specifies "DOM overlay + shader
 * blur on background", and three of the four remaining transitions (BSOD
 * overlay+dissolve, phone-unlock CSS3D+shader, texture-strip alpha mask) are likewise
 * hybrid. A discriminator that forbade them would obstruct the exact future it was
 * justified by.
 *
 * Slice 2 ships the dialog's background blur as CSS `backdrop-filter` (proven in-repo
 * by Figma Era), so the `shader?` slot stays empty until a real blur shader is worth
 * authoring.
 *
 * `enterMs`, NOT `duration`: on a shader transition `duration` drives the rAF ramp
 * from 0→1. A user-gated dialog has no fixed duration — it ends when a human acts.
 * A field named `duration` on the dom variant invites someone to write a timer
 * against it, which is precisely how the rejected auto-advance would creep back in.
 */
export type TransitionDef =
  | { kind: 'shader'; shader: string; duration: number }
  | { kind: 'dom'; runner: RunnerId; enterMs: number; shader?: string };

const registry: Record<string, TransitionDef> = {
  // CRT power-off sits at its canonical ARPANET → Early Web position (the terminal
  // collapses to a white line that resolves into the Mosaic page).
  'arpanet->early-web': { kind: 'shader', shader: 'crt-power-off', duration: 2500 },
  // glass-shatter is currently a TEMPORARY early-web → figma-era bridge. Its canonical
  // home is flat → figma-era (PHASES:197); the shader is authored source-agnostic so
  // that move is a key change here, no shader edit.
  //
  // Slice 2 Commit 3 (T7) relocates this to 'browser-wars->figma-era' and adds
  // 'early-web->browser-wars'. Both edits MUST land in the same commit as the chapter
  // going live — flipping the chapter without the registry move leaves a dead-end
  // chapter that fails silently (see the adjacency guard in tests/unit/transitions.test.ts).
  'early-web->figma-era': { kind: 'shader', shader: 'glass-shatter', duration: 2000 },
};

export function getTransition(from: string, to: string): TransitionDef | null {
  return registry[`${from}->${to}`] ?? null;
}

export function hasTransition(from: string, to: string): boolean {
  return `${from}->${to}` in registry;
}

/** Registry keys, for drift guards. Not for runtime lookup — use getTransition. */
export function transitionKeys(): string[] {
  return Object.keys(registry);
}
