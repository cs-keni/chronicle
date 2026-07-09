// Chapter manifest — the single source of truth for chapter identity + ordering
// (Phase 2 A1). Promoted from the lobby's inline roadmap so that the lobby grid,
// the hash router (VALID_CHAPTERS), and the scroll engine (CHAPTER_ORDER) all
// derive from ONE array. This kills the silent drift between the router's
// valid-hash set and the scroll order — previously two hand-maintained lists
// that could disagree without any test noticing.
//
// Scope: identity + ordering ONLY. Chapter *content* (facts, palette) lives in
// chapters.ts, keyed by the same id, and only for chapters that are live. Do NOT
// add facts/palette here, and do NOT add placeholder chapters to chapters.ts.

export interface ChapterMeta {
  id: string;
  eraName: string;
  years: string;
  cssClass: string;
  live: boolean;
  order: number;
}

// Authored in display order; `order` is explicit so derivations never depend on
// array position. Flip `live` to true (and ship the chapter) to add an era.
export const MANIFEST: ChapterMeta[] = [
  { id: 'arpanet',      eraName: 'ARPANET',            years: '1969–1982', cssClass: 'card-arpanet',      live: true,  order: 1 },
  { id: 'early-web',    eraName: 'Early Web',          years: '1983–1994', cssClass: 'card-early-web',    live: false, order: 2 },
  { id: 'browser-wars', eraName: 'Browser Wars',       years: '1995–2001', cssClass: 'card-browser-wars', live: false, order: 3 },
  { id: 'post-crash',   eraName: 'Post-Crash / Web 2', years: '2002–2007', cssClass: 'card-post-crash',   live: false, order: 4 },
  { id: 'mobile',       eraName: 'Mobile / Skeuo',     years: '2008–2012', cssClass: 'card-mobile',       live: false, order: 5 },
  { id: 'flat',         eraName: 'Flat / Material',    years: '2013–2018', cssClass: 'card-flat',         live: false, order: 6 },
  { id: 'figma-era',    eraName: 'Figma Era',          years: '2019–2023', cssClass: 'card-figma-era',    live: true,  order: 7 },
  { id: 'ai-web',       eraName: 'AI Web',             years: '2024+',     cssClass: 'card-ai-web',       live: false, order: 8 },
];

// Live chapters in canonical scroll order — the spine every derivation hangs off.
export function liveChapters(): ChapterMeta[] {
  return MANIFEST.filter((c) => c.live).sort((a, b) => a.order - b.order);
}

// Router: the set of valid hash ids (#arpanet, #figma-era, …). Live chapters only.
export function validChapterIds(): string[] {
  return liveChapters().map((c) => c.id);
}

// Scroll engine: chapter ids in scroll order. Same live set as the router, but the
// name reflects the ordering semantics the scroll engine depends on.
export function chapterOrder(): string[] {
  return liveChapters().map((c) => c.id);
}
