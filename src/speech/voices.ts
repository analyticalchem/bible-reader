// macOS ships joke voices that would clutter the voice list.
const NOVELTY = new Set([
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 'Eddy', 'Flo', 'Fred',
  'Good News', 'Grandma', 'Grandpa', 'Hysterical', 'Jester', 'Junior', 'Kathy', 'Organ', 'Pipe Organ', 'Ralph',
  'Reed', 'Rocko', 'Sandy', 'Shelley', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
]);

export function available(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function rank(v: SpeechSynthesisVoice): number {
  let r = 0;
  if (!/premium|enhanced|natural/i.test(v.name)) r += 1;
  if (v.lang.toLowerCase() !== 'en-us') r += 2;
  if (!v.localService) r += 1; // local voices avoid Chrome's cutoff on long network utterances
  return r;
}

/** English voices, best first, without the novelty ones. */
export function english(): SpeechSynthesisVoice[] {
  if (!available()) return [];
  const list = speechSynthesis
    .getVoices()
    .filter(v => /^en/i.test(v.lang) && !NOVELTY.has(v.name.replace(/\s*\(.*$/, '')));
  list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return list;
}

export function find(uri: string): SpeechSynthesisVoice | undefined {
  if (!uri || !available()) return undefined;
  return speechSynthesis.getVoices().find(v => v.voiceURI === uri);
}

export function label(uri: string): string {
  const v = find(uri);
  if (!v) return 'Default';
  return v.name + (v.lang.toLowerCase() === 'en-us' ? '' : ` (${v.lang})`);
}

/** Voices load asynchronously in Chrome; call back now and again when the list changes. */
export function onReady(cb: () => void): void {
  if (!available()) return;
  if (speechSynthesis.getVoices().length) cb();
  speechSynthesis.addEventListener('voiceschanged', cb);
}
