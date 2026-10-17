import { load, save } from './storage';
import type { Position, Scheme, Settings } from './types';

export const SCHEMES: { id: Scheme; name: string }[] = [
  { id: 'wb', name: 'White on black' },
  { id: 'yb', name: 'Yellow on black' },
  { id: 'bw', name: 'Black on white' },
  { id: 'by', name: 'Black on pale yellow' },
];

// Each size follows the screen height, but never drops below a size in rem, so Chrome zoom and the
// ChromeOS display-size setting still make Scripture larger. The two match on a 720-pixel-tall screen.
export const TEXT_STEPS = [
  { name: 'Small', size: 'max(4vh, 1.8rem)' },
  { name: 'Medium', size: 'max(5.3vh, 2.4rem)' },
  { name: 'Large', size: 'max(7vh, 3.15rem)' },
  { name: 'Extra large', size: 'max(9.4vh, 4.2rem)' },
  { name: 'Huge', size: 'max(11.8vh, 5.3rem)' },
];

export const BTN_STEPS = [
  { name: 'Small', scale: 0.8 },
  { name: 'Medium', scale: 1 },
  { name: 'Large', scale: 1.2 },
  { name: 'Extra large', scale: 1.4 },
];

export const RATES = [
  { rate: 0.7, name: 'Slowest' },
  { rate: 0.8, name: 'Slower' },
  { rate: 0.9, name: 'A little slower' },
  { rate: 1, name: 'Normal' },
  { rate: 1.1, name: 'A little faster' },
  { rate: 1.2, name: 'Faster' },
  { rate: 1.3, name: 'Fastest' },
];

const DEFAULT_SETTINGS: Settings = {
  mode: 'click',
  holdMs: 1000,
  scheme: 'wb',
  showText: true,
  textStep: 2,
  btnStep: 1,
  voice: '',
  rate: 1,
  continueChapters: true,
  speakButtons: true,
  compactNav: false,
  showVerseArrows: true,
  screenReader: false,
  shortcuts: true,
};

const DEFAULT_POSITION: Position = { book: 'GEN', chapter: 1, verse: 1 };

export const settings: Settings = load('bible-reader.settings', DEFAULT_SETTINGS);
export const position: Position = load('bible-reader.position', DEFAULT_POSITION);

export function saveSettings(): void {
  save('bible-reader.settings', settings);
}

export function savePosition(): void {
  save('bible-reader.position', position);
}

export function schemeName(id: Scheme): string {
  return SCHEMES.find(s => s.id === id)?.name ?? SCHEMES[0].name;
}

export function rateIndex(): number {
  const i = RATES.findIndex(r => Math.abs(r.rate - settings.rate) < 0.001);
  return i < 0 ? 3 : i;
}

export function holdLabel(): string {
  const s = settings.holdMs / 1000;
  return s === 1 ? '1 second' : `${String(s).replace(/\.?0+$/, '')} seconds`;
}
