export interface KeyHandlers {
  screen(): string;
  act(action: string): void;
  back(): void;
  /** Single-key shortcuts can be turned off in Settings (Escape always works). */
  enabled(): boolean;
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

// Keys that scroll the Scripture panel when it has keyboard focus.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function installKeys(h: KeyHandlers): void {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; // leave browser and system shortcuts alone
    const t = e.target as HTMLElement | null;
    if (t?.closest('.btn') && (e.key === ' ' || e.key === 'Enter')) return; // the focused button handles it
    if (e.key === 'Escape') {
      if (h.screen() !== 'reader') h.back();
      return;
    }
    if (!h.enabled() || h.screen() !== 'reader') return;
    if (t?.closest('.panel') && SCROLL_KEYS.has(e.key)) return;
    const act = MAP[e.key];
    if (!act) return;
    e.preventDefault();
    h.act(act);
  });
}
