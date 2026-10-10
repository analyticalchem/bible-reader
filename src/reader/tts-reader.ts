import * as bible from '../bible';
import { forSpeech } from '../speech/pronounce';
import type { SpeakOptions, Speaker } from '../speech/speaker';
import type { VerseReader } from './verse-reader';

export class TtsReader implements VerseReader {
  private verses: string[] = [];
  private gen = 0;
  onVerseStart: ((verse: number) => void) | null = null;
  onVerseProgress: ((verse: number, charIndex: number) => void) | null = null;
  onChapterEnd: (() => void) | null = null;

  constructor(private speaker: Speaker, private options: () => SpeakOptions) {}

  async load(bookId: string, chapter: number): Promise<void> {
    this.verses = await bible.chapter(bookId, chapter);
  }

  play(verse: number): void {
    const gen = ++this.gen;
    void this.run(verse, gen);
  }

  stop(): void {
    this.gen++;
    this.speaker.stop();
  }

  private async run(verse: number, gen: number): Promise<void> {
    let v = verse;
    while (gen === this.gen && v >= 1 && v <= this.verses.length) {
      const current = v;
      this.onVerseStart?.(current);
      const ok = await this.speaker.speak(forSpeech(this.verses[current - 1]), {
        ...this.options(),
        onProgress: i => {
          if (gen === this.gen) this.onVerseProgress?.(current, i);
        },
      });
      if (gen !== this.gen || !ok) return;
      if (current === this.verses.length) {
        this.onChapterEnd?.();
        return;
      }
      v++;
    }
  }
}
