export type Testament = 'OT' | 'NT';

export interface BookMeta {
  id: string;
  name: string;
  /** Abbreviation shown when the full name would wrap. */
  short: string;
  /** Name as the voice should say it ("Jobe" for Job). */
  spoken: string;
  testament: Testament;
  chapters: number;
}

export interface Position {
  book: string;
  chapter: number;
  verse: number;
}

export type Scheme = 'wb' | 'yb' | 'bw' | 'by';
export type Mode = 'click' | 'hold';

export interface Settings {
  mode: Mode;
  holdMs: number;
  scheme: Scheme;
  showText: boolean;
  textStep: number;
  btnStep: number;
  voice: string;
  rate: number;
  continueChapters: boolean;
  speakButtons: boolean;
  /** Hide the book and chapter name buttons so the arrows can be wider. */
  compactNav: boolean;
}
