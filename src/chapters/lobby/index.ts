import './style.css';
import { navigateTo } from '../../engine/router';

interface CardDef {
  id: string;
  eraName: string;
  years: string;
  cssClass: string;
  live: boolean;
}

const CARDS: CardDef[] = [
  { id: 'arpanet',      eraName: 'ARPANET',            years: '1969–1982', cssClass: 'card-arpanet',      live: true  },
  { id: 'early-web',    eraName: 'Early Web',          years: '1983–1994', cssClass: 'card-early-web',    live: false },
  { id: 'browser-wars', eraName: 'Browser Wars',       years: '1995–2001', cssClass: 'card-browser-wars', live: false },
  { id: 'post-crash',   eraName: 'Post-Crash / Web 2', years: '2002–2007', cssClass: 'card-post-crash',   live: false },
  { id: 'mobile',       eraName: 'Mobile / Skeuo',     years: '2008–2012', cssClass: 'card-mobile',       live: false },
  { id: 'flat',         eraName: 'Flat / Material',    years: '2013–2018', cssClass: 'card-flat',         live: false },
  { id: 'figma-era',    eraName: 'Figma Era',          years: '2019–2023', cssClass: 'card-figma-era',    live: true  },
  { id: 'ai-web',       eraName: 'AI Web',             years: '2024+',     cssClass: 'card-ai-web',       live: false },
];

export function initLobby(container: HTMLElement) {
  const grid = document.createElement('div');
  grid.className = 'lobby-grid';

  for (const card of CARDS) {
    grid.appendChild(buildCard(card));
  }

  container.appendChild(grid);
}

function buildCard(card: CardDef): HTMLElement {
  const el = document.createElement('div');
  el.className = `lobby-card ${card.cssClass}`;
  el.dataset.live = String(card.live);
  el.setAttribute('role', card.live ? 'button' : 'presentation');
  if (card.live) el.setAttribute('tabindex', '0');
  if (!card.live) el.setAttribute('title', 'Coming in Phase 2');

  const meta = document.createElement('div');
  meta.className = 'lobby-card-meta';
  meta.innerHTML = `
    <span class="lobby-card-era">${card.eraName}</span>
    <span class="lobby-card-years">${card.years}</span>
  `;

  const preview = document.createElement('div');
  preview.className = 'lobby-card-preview';
  if (card.id === 'arpanet') preview.appendChild(buildArpanetPreview());
  if (card.id === 'figma-era') preview.appendChild(buildFigmaPreview());

  const status = document.createElement('div');
  status.className = 'lobby-card-status';
  status.textContent = card.live ? 'Explore →' : 'Coming Soon';

  el.appendChild(meta);
  el.appendChild(preview);
  el.appendChild(status);

  if (card.live) {
    el.addEventListener('click', () => navigateTo(card.id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(card.id);
      }
    });
  }

  return el;
}

function buildArpanetPreview(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'text-align: left; width: 100%; padding: 0 4px;';
  wrap.innerHTML = `
    <span class="arpanet-card-line line-1">CONNECTED TO NODE 1...</span>
    <span class="arpanet-card-line line-2">&gt; LOGIN: GUEST_</span>
    <span class="arpanet-cursor"></span>
  `;
  return wrap;
}

function buildFigmaPreview(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'figma-pill-group';
  wrap.innerHTML = `
    <span class="figma-pill">Design</span>
    <span class="figma-pill active">Prototype</span>
    <span class="figma-pill">Dev Mode</span>
  `;
  return wrap;
}
