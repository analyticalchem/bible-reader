import { chunk } from './pronounce';
import * as voices from './voices';

export interface SpeakOptions {
  rate?: number;
  voice?: string;
  /** Called with the character offset (in the full text) as speech moves through it. */
  onProgress?: (charIndex: number) => void;
}

/**
 * Speaks through the device voice (Web Speech API). One call speaks one thing;
 * a new call or stop() cancels whatever was in progress.
 */
export class Speaker {
  private gen = 0;
  // Chrome stops speaking if the utterance object is garbage-collected mid-sentence, so keep a reference.
  private current: SpeechSynthesisUtterance | null = null;
  private working = voices.available();
  /** Called with every phrase; used for the optional on-screen caption. */
  onSpeak: ((text: string) => void) | null = null;

  get available(): boolean {
    return this.working;
  }

  /** After a failure (for example speaking before any user gesture), try the real voice again. */
  retry(): void {
    this.working = voices.available();
  }

  /** Resolves true when the text was spoken to the end, false when stopped or superseded. */
  async speak(text: string, opts: SpeakOptions = {}): Promise<boolean> {
    const gen = ++this.gen;
    this.onSpeak?.(text);
    if (!this.working) {
      opts.onProgress?.(0);
      await wait(estimate(text));
      return gen === this.gen;
    }
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    let from = 0;
    for (const piece of chunk(text)) {
      if (gen !== this.gen) return false;
      const found = text.indexOf(piece, from);
      const offset = found < 0 ? from : found;
      from = offset + piece.length;
      opts.onProgress?.(offset);
      const done = await this.utter(piece, opts, gen, offset);
      if (!done) return false;
    }
    return gen === this.gen;
  }

  stop(): void {
    this.gen++;
    this.current = null;
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }

  private utter(text: string, opts: SpeakOptions, gen: number, offset: number): Promise<boolean> {
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      const v = voices.find(opts.voice ?? '');
      if (v) u.voice = v;
      // Without a chosen voice, still ask for English so a device set to another language reads it correctly.
      u.lang = v ? v.lang : 'en-US';
      u.rate = opts.rate ?? 1;
      let started = false;
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (this.current === u) this.current = null;
        resolve(ok && gen === this.gen);
      };
      const fallback = () => {
        // Speech is not working right now; keep the timing so the highlight still moves.
        this.working = false;
        wait(estimate(text)).then(() => finish(true));
      };
      u.onstart = () => {
        started = true;
      };
      u.onboundary = e => {
        // Word boundaries arrive from most local voices; they let the Scripture panel follow the reading.
        if (gen === this.gen && e.charIndex >= 0 && e.name !== 'sentence') opts.onProgress?.(offset + e.charIndex);
      };
      u.onend = () => finish(true);
      u.onerror = e => {
        if (e.error === 'interrupted' || e.error === 'canceled') finish(false);
        else fallback();
      };
      this.current = u;
      // A short pause after cancel() keeps Chrome from dropping the new utterance.
      setTimeout(() => {
        if (gen !== this.gen) return finish(false);
        try {
          if (speechSynthesis.paused) speechSynthesis.resume();
          speechSynthesis.speak(u);
        } catch {
          fallback();
        }
      }, 40);
      setTimeout(() => {
        if (!started && !settled && gen === this.gen) {
          try {
            speechSynthesis.cancel();
          } catch {
            /* ignore */
          }
          fallback();
        }
      }, 6000);
    });
  }
}

function estimate(text: string): number {
  return Math.min(8000, 500 + text.length * 45);
}

function wait(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
