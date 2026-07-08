import './styles/global.css';
import { webgl } from './engine/webgl';
import { chapterManager } from './engine/chapter';
import { initScrollEngine } from './engine/scroll';
import { initRouter } from './engine/router';
import { initTransitionEngine } from './engine/transition';
import { initAudioEngine } from './engine/audio';
import { initLobby } from './chapters/lobby/index';
import { initArpanet } from './chapters/arpanet/index';
import { initFigmaEra } from './chapters/figma-era/index';
import { initControls } from './ui/controls';

// Phase 1 shader sources — imported as raw strings via Vite's ?raw suffix
import crtPowerOffFrag from './shaders/crt-power-off.frag?raw';

// Module scripts are deferred — DOM is guaranteed ready. No DOMContentLoaded needed.
const lobbyEl    = document.getElementById('chapter-lobby')!;
const arpanetEl  = document.getElementById('chapter-arpanet')!;
const figmaEraEl = document.getElementById('chapter-figma-era')!;

// Init chapters (each registers itself with chapterManager internally)
initLobby(lobbyEl);
initArpanet(arpanetEl);
initFigmaEra(figmaEraEl);

// Register lobby with chapter manager (arpanet + figma-era register themselves via initX)
chapterManager.register('lobby', lobbyEl);

// Precompile shaders during idle time
webgl.precompileAll({ 'crt-power-off': crtPowerOffFrag });

// Wire audio engine first — it sets up unlock listeners on document
initAudioEngine();

// Wire transition engine (dwell zone → html2canvas → WebGL → chapter swap)
initTransitionEngine();

// Router runs before scroll engine: showChapter/showScrollContainer must
// complete (scroll container visible, scroll position set, chapter activated)
// before GSAP ScrollTrigger creates triggers. If scroll engine ran first with
// display:none spacers, GSAP would compute wrong positions (all 0) and then
// spuriously fire onLeaveBack / transition requests on layout recalculation.
initRouter();

// Wire scroll engine LAST — spacers are now in the correct layout position.
initScrollEngine();

// Global UI chrome: view-source overlay + share card (bottom-right cluster,
// `?` / `s` shortcuts). Tiny + eager; heavy modules lazy-load on first use.
initControls();
