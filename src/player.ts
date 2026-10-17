import * as bible from './bible';
import { position, savePosition, settings } from './state';
import type { Position, Testament } from './types';
import type { Speaker } from './speech/speaker';
import type { VerseReader } from './reader/verse-reader';
import { announce } from './a11y/announce';

/** Play, pause and navigation. Every action announces itself through the one Speaker. */
export class Player {
  playing = false;
  private op = 0;
  onChange: (() => void) | null = null;
  /** Where in the current verse the voice is, so the Scripture panel can follow along. */
  onProgress: ((verse: number, charIndex: number) => void) | null = null;

  constructor(private speaker: Speaker, private reader: VerseReader) {
    reader.onVerseStart = v => {
      position.verse = v;
      savePosition();
      this.onChange?.();
    };
    reader.onVerseProgress = (v, i) => this.onProgress?.(v, i);
    reader.onChapterEnd = () => void this.chapterEnded();
  }

  private opts() {
    return { rate: settings.rate, voice: settings.voice };
  }

  private say(text: string): Promise<boolean> {
    announce(text);
    if (!settings.screenReader) return this.speaker.speak(text, this.opts());
    // The screen reader speaks it. Wait about as long as that takes so Scripture doesn't talk over it.
    const op = this.op;
    return new Promise(r => setTimeout(() => r(op === this.op), Math.min(3500, 400 + text.length * 55)));
  }

  /** Voice preview from Settings: names the voice, then reads a sample in that voice. */
  sample(label: string, text: string): void {
    const op = this.stopAll();
    announce(`${label}.`);
    void (async () => {
      if (!settings.screenReader) {
        await this.speaker.speak(`${label}. ${text}`, this.opts());
        return;
      }
      await new Promise(r => setTimeout(r, 900));
      if (op === this.op) await this.speaker.speak(text, this.opts());
    })();
  }

  private label(name: string): string {
    return settings.speakButtons ? `${name} ` : '';
  }

  /** Cancels any speech and reading in progress; returns the new operation number. */
  private stopAll(): number {
    this.op++;
    this.reader.stop();
    this.speaker.stop();
    return this.op;
  }

  async play(): Promise<void> {
    const op = this.stopAll();
    this.playing = true;
    this.onChange?.();
    if (settings.speakButtons) {
      const ok = await this.say('Play.');
      if (op !== this.op || !ok) return;
    }
    await this.startReading(op);
  }

  pause(): void {
    this.stopAll();
    this.playing = false;
    this.onChange?.();
    if (settings.speakButtons) void this.say('Pause.');
  }

  toggle(): void {
    if (this.playing) this.pause();
    else void this.play();
  }

  /** Says something, then carries on reading the current verse if playing. */
  announce(text: string): void {
    const op = this.stopAll();
    void this.say(text).then(ok => {
      if (ok && op === this.op && this.playing) void this.startReading(op);
    });
  }

  /** Pauses reading while a picker or settings screen is open; returns whether it was playing. */
  suspend(): boolean {
    const was = this.playing;
    this.stopAll();
    this.playing = false;
    this.onChange?.();
    return was;
  }

  /** Returns from a picker: announces, then resumes reading if it was playing before. */
  resume(wasPlaying: boolean, announcement: string): void {
    this.playing = wasPlaying;
    void this.goTo({ ...position }, announcement);
  }

  /** Moves to a place, announces it, then keeps reading if playing. */
  async goTo(p: Position, announcement: string): Promise<void> {
    const op = this.stopAll();
    Object.assign(position, p);
    savePosition();
    this.onChange?.();
    const ok = await this.say(announcement);
    if (op !== this.op || !ok) return;
    if (this.playing) await this.startReading(op);
  }

  async nextVerse(): Promise<void> {
    const n = await bible.nextVerse(position);
    if (!n) return void this.say('This is the last verse.');
    await this.goToVerse(n);
  }

  async prevVerse(): Promise<void> {
    const n = await bible.prevVerse(position);
    if (!n) return void this.say('This is the first verse.');
    await this.goToVerse(n);
  }

  async nextChapter(): Promise<void> {
    const n = bible.nextChapter(position);
    if (!n) return void this.say('This is the last chapter.');
    await this.goTo(n, `${this.label('Next chapter.')}${bible.place(n)}.`);
  }

  async prevChapter(): Promise<void> {
    const n = bible.prevChapter(position);
    if (!n) return void this.say('This is the first chapter.');
    await this.goTo(n, `${this.label('Previous chapter.')}${bible.place(n)}.`);
  }

  async nextBook(): Promise<void> {
    const n = bible.nextBook(position);
    if (!n) return void this.say('This is the last book.');
    await this.goTo(n, `${this.label('Next book.')}${bible.place(n)}.`);
  }

  async prevBook(): Promise<void> {
    const n = bible.prevBook(position);
    if (!n) return void this.say('This is the first book.');
    await this.goTo(n, `${this.label('Previous book.')}${bible.place(n)}.`);
  }

  async toggleTestament(): Promise<void> {
    const t: Testament = bible.meta(position.book).testament === 'OT' ? 'NT' : 'OT';
    const n = bible.firstOf(t);
    await this.goTo(n, `${t === 'OT' ? 'Old Testament' : 'New Testament'}. ${bible.place(n)}.`);
  }

  /** Verse steps: announce the verse number; reading continues only if already playing. */
  private async goToVerse(n: Position): Promise<void> {
    const changed = n.chapter !== position.chapter || n.book !== position.book;
    const lead = changed ? `${bible.place(n)}. Verse ${n.verse}.` : `Verse ${n.verse}.`;
    const op = this.stopAll();
    Object.assign(position, n);
    savePosition();
    this.onChange?.();
    const ok = await this.say(lead);
    if (op !== this.op || !ok) return;
    if (this.playing) await this.startReading(op);
  }

  private async startReading(op: number): Promise<void> {
    await this.reader.load(position.book, position.chapter);
    if (op !== this.op || !this.playing) return;
    this.reader.play(position.verse);
  }

  private async chapterEnded(): Promise<void> {
    if (!settings.continueChapters) {
      this.playing = false;
      this.onChange?.();
      return;
    }
    const next = bible.nextChapter(position);
    if (!next) {
      this.playing = false;
      this.onChange?.();
      void this.say('End of the Bible.');
      return;
    }
    await this.goTo(next, `${bible.place(next)}.`);
  }
}
