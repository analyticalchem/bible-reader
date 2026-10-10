// Adjustments applied to text before it is spoken, never to text on screen.
const CAPS: Record<string, string> = { LORD: 'Lord', GOD: 'God', JEHOVAH: 'Jehovah' };

export function forSpeech(text: string): string {
  return text.replace(/\b(LORD|GOD|JEHOVAH)\b/g, w => CAPS[w]);
}

/**
 * Splits long text at clause boundaries into pieces of at most maxWords.
 * Chrome's network voices cut off utterances longer than about 15 seconds.
 */
export function chunk(text: string, maxWords = 28): string[] {
  if (text.split(' ').length <= maxWords) return [text];
  const parts = text.match(/[^.;:!?,]+[.;:!?,]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const part of parts) {
    if (cur && (cur + part).trim().split(' ').length > maxWords) {
      out.push(cur.trim());
      cur = part;
    } else {
      cur += part;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap(c => {
    const w = c.split(' ');
    if (w.length <= maxWords) return [c];
    const r: string[] = [];
    for (let i = 0; i < w.length; i += maxWords) r.push(w.slice(i, i + maxWords).join(' '));
    return r;
  });
}
