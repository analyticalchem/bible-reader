/**
 * Reads a chapter one verse at a time. The device-voice implementation lives in
 * tts-reader.ts; a pre-generated-audio implementation can replace it without
 * touching the rest of the app.
 */
export interface VerseReader {
  load(bookId: string, chapter: number): Promise<void>;
  play(verse: number): void;
  stop(): void;
  onVerseStart: ((verse: number) => void) | null;
  /** Character offset within the verse that is being spoken, when the voice reports it. */
  onVerseProgress: ((verse: number, charIndex: number) => void) | null;
  onChapterEnd: (() => void) | null;
}
