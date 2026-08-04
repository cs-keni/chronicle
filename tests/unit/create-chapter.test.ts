// createChapter wiring (T10). Node env, no jsdom: the scaffold only ever touches
// `container.innerHTML` and `addEventListener`, so a two-field stub is enough and
// the unit layer stays dependency-free. Real DOM/render behavior is Playwright's job.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted so the mock factories below (which vitest hoists) can safely close
// over these arrays.
const { registered, progressSubs, ambientStarts } = vi.hoisted(() => ({
  registered: [] as Array<{ id: string; el: unknown; onInit?: () => void }>,
  progressSubs: [] as Array<{ id: string; cb: (p: number) => void }>,
  ambientStarts: [] as string[],
}));

vi.mock('../../src/engine/chapter', () => ({
  chapterManager: {
    register: (id: string, el: unknown, onInit?: () => void) => {
      registered.push({ id, el, onInit });
    },
  },
}));

vi.mock('../../src/engine/scroll', () => ({
  onChapterProgress: (id: string, cb: (p: number) => void) => {
    progressSubs.push({ id, cb });
  },
}));

vi.mock('../../src/engine/audio', () => ({
  startChapterAmbient: (id: string) => {
    ambientStarts.push(id);
  },
}));

vi.mock('../../src/data/chapters', () => ({
  getChapter: (id: string) =>
    id === 'test-chapter'
      ? { id, name: 'Test', facts: [{ headline: 'H', year: 1969, body: 'B' }] }
      : undefined,
}));

import { createChapter } from '../../src/engine/create-chapter';

type Listener = () => void;

function stubContainer() {
  const listeners = new Map<string, Listener[]>();
  return {
    innerHTML: '',
    addEventListener(type: string, cb: Listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(cb);
    },
    dispatch(type: string) {
      listeners.get(type)?.forEach((cb) => cb());
    },
    listenerCount: (type: string) => listeners.get(type)?.length ?? 0,
  };
}

type StubContainer = ReturnType<typeof stubContainer>;
const asEl = (c: StubContainer) => c as unknown as HTMLElement;

beforeEach(() => {
  registered.length = 0;
  progressSubs.length = 0;
  ambientStarts.length = 0;
});

describe('createChapter', () => {
  it('renders markup and registers with the chapter manager', () => {
    const container = stubContainer();
    createChapter({ id: 'test-chapter', render: () => '<p>hi</p>' })(asEl(container));

    expect(container.innerHTML).toBe('<p>hi</p>');
    expect(registered).toHaveLength(1);
    expect(registered[0].id).toBe('test-chapter');
    expect(registered[0].el).toBe(container);
  });

  it('passes the content record to render', () => {
    const container = stubContainer();
    createChapter({
      id: 'test-chapter',
      render: ({ chapter, id }) => `${id}:${chapter.facts.length}`,
    })(asEl(container));

    expect(container.innerHTML).toBe('test-chapter:1');
  });

  it('runs onMount after the markup is written, at mount time', () => {
    const container = stubContainer();
    let seen: string | null = null;
    createChapter({
      id: 'test-chapter',
      render: () => '<p>hi</p>',
      onMount: ({ container: el }) => {
        seen = (el as unknown as StubContainer).innerHTML;
      },
    })(asEl(container));

    expect(seen).toBe('<p>hi</p>');
  });

  it('defers onInit, ambient, and progress wiring until the manager inits', () => {
    const container = stubContainer();
    const onInit = vi.fn();
    const onProgress = vi.fn();
    createChapter({ id: 'test-chapter', render: () => '', onInit, onProgress })(
      asEl(container),
    );

    // Nothing lazy has run yet — mount only builds DOM and registers.
    expect(onInit).not.toHaveBeenCalled();
    expect(ambientStarts).toEqual([]);
    expect(progressSubs).toHaveLength(0);

    registered[0].onInit!();

    expect(onInit).toHaveBeenCalledTimes(1);
    expect(ambientStarts).toEqual(['test-chapter']);
    expect(progressSubs).toHaveLength(1);
    expect(progressSubs[0].id).toBe('test-chapter');
  });

  it('starts ambient before onInit, so a chapter can adjust the bed it inherits', () => {
    const container = stubContainer();
    let ambientCountAtInit = -1;
    createChapter({
      id: 'test-chapter',
      render: () => '',
      onInit: () => {
        ambientCountAtInit = ambientStarts.length;
      },
    })(asEl(container));
    registered[0].onInit!();

    expect(ambientCountAtInit).toBe(1);
  });

  it('skips ambient when the spec opts out', () => {
    const container = stubContainer();
    createChapter({ id: 'test-chapter', render: () => '', ambient: false })(
      asEl(container),
    );
    registered[0].onInit!();

    expect(ambientStarts).toEqual([]);
  });

  it('forwards progress with the chapter context', () => {
    const container = stubContainer();
    const onProgress = vi.fn();
    createChapter({ id: 'test-chapter', render: () => '', onProgress })(asEl(container));
    registered[0].onInit!();

    progressSubs[0].cb(0.42);

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress.mock.calls[0][0]).toBe(0.42);
    expect(onProgress.mock.calls[0][1]).toMatchObject({ id: 'test-chapter' });
  });

  it('wires dwell-enter at mount time, before any init', () => {
    const container = stubContainer();
    const onDwellEnter = vi.fn();
    createChapter({ id: 'test-chapter', render: () => '', onDwellEnter })(asEl(container));

    container.dispatch('dwell-enter');

    expect(onDwellEnter).toHaveBeenCalledTimes(1);
    expect(onDwellEnter.mock.calls[0][0]).toMatchObject({ id: 'test-chapter' });
  });

  it('attaches no listener and no progress sub when hooks are omitted', () => {
    const container = stubContainer();
    createChapter({ id: 'test-chapter', render: () => '' })(asEl(container));
    registered[0].onInit!();

    expect(container.listenerCount('dwell-enter')).toBe(0);
    expect(progressSubs).toHaveLength(0);
  });

  it('throws a named error when the chapter has no content record', () => {
    const container = stubContainer();
    const init = createChapter({ id: 'ghost-chapter', render: () => '' });

    expect(() => init(asEl(container))).toThrow(/ghost-chapter/);
  });
});
