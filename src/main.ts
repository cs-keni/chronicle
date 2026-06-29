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

// Wire scroll engine (GSAP ScrollTrigger on spacers)
initScrollEngine();

// Wire transition engine (dwell zone → html2canvas → WebGL → chapter swap)
initTransitionEngine();

// Start router last — reads hash and activates first chapter/lobby
initRouter();
