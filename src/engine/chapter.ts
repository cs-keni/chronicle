// Chapter manager — DOM swap model (D2, D12).
// Chapters are position:fixed, switched via translateX(-100vw) ↔ translateX(0).
// display:none is forbidden — it breaks IntersectionObserver.

type InitCallback = () => void;

class ChapterManager {
  private chapters = new Map<string, HTMLElement>();
  private activeId: string | null = null;
  private initialized = new Set<string>();
  private initCallbacks = new Map<string, InitCallback>();
  private observer: IntersectionObserver;

  constructor() {
    // Lazy-init when chapter comes within 1vh of viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.chapterId!;
          if (!this.initialized.has(id)) {
            this.initialized.add(id);
            this.initCallbacks.get(id)?.();
          }
        }
      },
      { rootMargin: '0px' },
    );
  }

  register(id: string, el: HTMLElement, onInit?: InitCallback) {
    this.chapters.set(id, el);
    if (onInit) this.initCallbacks.set(id, onInit);
    this.observer.observe(el);
  }

  activate(id: string) {
    const next = this.chapters.get(id);
    if (!next) return;

    if (this.activeId && this.activeId !== id) {
      const prev = this.chapters.get(this.activeId);
      if (prev) prev.style.transform = 'translateX(-100vw)';
    }

    next.style.transform = 'translateX(0)';
    this.activeId = id;

    // Trigger lazy init immediately on activation (don't wait for intersection)
    if (!this.initialized.has(id)) {
      this.initialized.add(id);
      this.initCallbacks.get(id)?.();
    }
  }

  deactivate(id: string) {
    const el = this.chapters.get(id);
    if (el) el.style.transform = 'translateX(-100vw)';
    if (this.activeId === id) this.activeId = null;
  }

  getElement(id: string): HTMLElement | undefined {
    return this.chapters.get(id);
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  isInitialized(id: string): boolean {
    return this.initialized.has(id);
  }
}

export const chapterManager = new ChapterManager();
