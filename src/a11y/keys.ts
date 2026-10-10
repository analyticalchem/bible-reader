export interface KeyHandlers {
  screen(): string;
  act(action: string): void;
  back(): void;
}

const MAP: Record<string, string> = {
  ' ': 'play',
  ArrowLeft: 'prevVerse',
  ArrowRight: 'nextVerse',
  ArrowUp: 'prevChap',
  ArrowDown: 'nextChap',
  PageUp: 'prevChap',
  PageDown: 'nextChap',
  b: 'book',
  B: 'book',
  c: 'chapter',
  C: 'chapter',
  s: 'settings',
  S: 'settings',
};

export function installKeys(h: KeyHandlers): void {
  document.addEventListener('keydown', e => {
    const t = e.target as HTMLElement | null;
    if (t?.closest('.btn') && (e.key === ' ' || e.key === 'Enter')) return; // the focused button handles it
    if (e.key === 'Escape') {
      if (h.screen() !== 'reader') h.back();
      return;
    }
    if (h.screen() !== 'reader') return;
    const act = MAP[e.key];
    if (!act) return;
    e.preventDefault();
    h.act(act);
  });
}
