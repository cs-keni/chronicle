// ARPANET terminal — typing scheduler, scroll-triggered facts, fast-forward on scroll.
//
// Char delays: boot/headlines at 60ms (punchy, readable), body at 20ms (fast enough
// to not stall; real 300-baud was 100ms/char but that's too slow for a museum visit).
// Fast-forward: any scroll movement flushes current line + entire queue to screen instantly.

import type { ChapterFact } from '../../data/chapters';

const HEADLINE_DELAY_MS = 60;
const BODY_DELAY_MS = 20;
const BOOT_DELAY_MS = 80;
const INTER_LINE_PAUSE_MS = 400;

const DIVIDER = '─'.repeat(72);
const BOOT_LINES = [
  'ARPANET NETWORK CONTROL PROGRAM v2.4',
  'CONNECTED TO IMP NODE 1 — UCLA',
  'LINK ESTABLISHED: 50 KBPS',
  '',
];

type LineKind = 'boot' | 'headline' | 'body' | 'meta';

interface QueueItem {
  text: string;
  kind: LineKind;
}

export class ArpanetTerminal {
  private output: HTMLElement;
  private container: HTMLElement; // parent with overflow-y:scroll
  private cursor: HTMLElement;
  private queue: QueueItem[] = [];
  private isTyping = false;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private currentLineEl: HTMLElement | null = null;
  private pendingText = '';
  private revealedFacts = new Set<number>();

  constructor(outputEl: HTMLElement, cursorEl: HTMLElement) {
    this.output = outputEl;
    this.container = outputEl.parentElement as HTMLElement;
    this.cursor = cursorEl;
  }

  start(facts: ChapterFact[]) {
    for (const line of BOOT_LINES) {
      this.enqueue(line, 'boot');
    }
    this.enqueue(`HISTORICAL ARCHIVE: ${facts.length} RECORDS LOADED`, 'meta');
    this.enqueue('', 'meta');
    this.enqueue(DIVIDER, 'meta');
    this.enqueue('', 'meta');
    this.pump();
  }

  revealFact(fact: ChapterFact, index: number) {
    if (this.revealedFacts.has(index)) return;
    this.revealedFacts.add(index);

    this.enqueue(`[${fact.year}] ${fact.headline.toUpperCase()}`, 'headline');
    for (const line of wrapAt(fact.body, 72)) {
      this.enqueue(line, 'body');
    }
    this.enqueue('', 'meta');
    this.enqueue(DIVIDER, 'meta');
    this.enqueue('', 'meta');
    this.pump();
  }

  // Called when scroll movement is detected — flushes everything to screen instantly.
  fastForward() {
    if (!this.isTyping && this.queue.length === 0) return;

    for (const id of this.pendingTimeouts) clearTimeout(id);
    this.pendingTimeouts = [];

    // Flush partially-typed current line
    if (this.currentLineEl && this.pendingText) {
      this.currentLineEl.textContent += this.pendingText;
      this.pendingText = '';
    }
    this.currentLineEl = null;

    // Dump all queued lines to DOM instantly
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.appendLine(item.text, item.kind);
    }

    this.output.appendChild(this.cursor);
    this.container.scrollTop = this.container.scrollHeight;
    this.isTyping = false;
  }

  destroy() {
    for (const id of this.pendingTimeouts) clearTimeout(id);
    this.pendingTimeouts = [];
  }

  private enqueue(text: string, kind: LineKind) {
    this.queue.push({ text, kind });
  }

  private pump() {
    if (this.isTyping || this.queue.length === 0) return;
    this.typeNextLine();
  }

  private typeNextLine() {
    const item = this.queue.shift();
    if (!item) {
      this.isTyping = false;
      return;
    }

    this.isTyping = true;
    const lineEl = this.appendLine('', item.kind);
    this.currentLineEl = lineEl;
    this.output.appendChild(this.cursor);

    this.pendingText = item.text;
    this.typeChar(lineEl, item.text, 0, item.kind);
  }

  private typeChar(lineEl: HTMLElement, text: string, index: number, kind: LineKind) {
    if (index >= text.length) {
      this.pendingText = '';
      this.currentLineEl = null;
      this.container.scrollTop = this.container.scrollHeight;

      const id = setTimeout(() => {
        this.isTyping = false;
        this.pump();
      }, INTER_LINE_PAUSE_MS);
      this.pendingTimeouts.push(id);
      return;
    }

    lineEl.textContent = text.slice(0, index + 1);
    this.pendingText = text.slice(index + 1);
    this.container.scrollTop = this.container.scrollHeight;

    const delay = kind === 'body' ? BODY_DELAY_MS
      : kind === 'headline' ? HEADLINE_DELAY_MS
      : BOOT_DELAY_MS;

    const id = setTimeout(() => {
      this.typeChar(lineEl, text, index + 1, kind);
    }, delay);
    this.pendingTimeouts.push(id);
  }

  private appendLine(text: string, kind: LineKind): HTMLElement {
    const el = document.createElement('div');
    el.className = `arpanet-line arpanet-line--${kind}`;
    el.textContent = text;
    this.output.appendChild(el);
    return el;
  }
}

function wrapAt(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
