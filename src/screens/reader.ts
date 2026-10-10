import * as bible from '../bible';
import { position, settings } from '../state';
import { button, setGlyph, setLabel, setSub } from '../ui/button';
import { $, div, span } from '../ui/dom';
import { fitAll } from '../a11y/fit-label';

function row(...buttons: HTMLElement[]): HTMLDivElement {
  return div('row', ...buttons);
}

export function build(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'reader';
  s.className = 'screen';
  const panel = div('panel');
  panel.id = 'panel';
  const controls = div(
    'controls',
    button({ id: 'bTestament', act: 'testament', label: 'OLD TESTAMENT', sub: 'PRESS FOR NEW TESTAMENT' }),
    row(
      button({ act: 'prevBook', glyph: '◀', sub: 'BOOK', say: 'Previous book.' }),
      button({ id: 'bBook', act: 'book', label: 'GENESIS' }),
      button({ act: 'nextBook', glyph: '▶', sub: 'BOOK', say: 'Next book.' }),
    ),
    row(
      button({ act: 'prevChap', glyph: '◀', sub: 'CHAP.', say: 'Previous chapter.' }),
      button({ id: 'bChapter', act: 'chapter', label: 'CHAPTER 1', short: 'CHAP. 1' }),
      button({ act: 'nextChap', glyph: '▶', sub: 'CHAP.', say: 'Next chapter.' }),
    ),
    row(
      button({ act: 'prevVerse', glyph: '◀', sub: 'VERSE', say: 'Previous verse.' }),
      button({ id: 'bPlay', act: 'play', glyph: '▶', sub: 'PLAY', say: 'Play.', cls: 'filled' }),
      button({ act: 'nextVerse', glyph: '▶', sub: 'VERSE', say: 'Next verse.' }),
    ),
    button({ id: 'bSettings', act: 'settings', label: 'SETTINGS', say: 'Settings.' }),
  );
  s.append(panel, controls);
  return s;
}

export async function update(playing: boolean): Promise<void> {
  const m = bible.meta(position.book);
  const otherT = m.testament === 'OT' ? 'NT' : 'OT';
  const thisName = m.testament === 'OT' ? 'Old Testament' : 'New Testament';
  const otherName = otherT === 'OT' ? 'Old Testament' : 'New Testament';
  const bt = $('#bTestament');
  setLabel(bt, thisName.toUpperCase());
  setSub(bt, `PRESS FOR ${otherName.toUpperCase()}`);
  bt.dataset.say = `${thisName}. Press to switch to the ${otherName}, ${bible.meta(bible.firstOf(otherT).book).spoken} chapter 1.`;

  const bb = $('#bBook');
  setLabel(bb, m.name.toUpperCase(), m.short.toUpperCase());
  bb.dataset.say = `${m.spoken}. Press to choose a book.`;

  const bc = $('#bChapter');
  setLabel(bc, `CHAPTER ${position.chapter}`, `CHAP. ${position.chapter}`);
  bc.dataset.say = `Chapter ${position.chapter}. Press to choose a chapter.`;

  const bp = $('#bPlay');
  setGlyph(bp, playing ? '❚❚' : '▶');
  setSub(bp, playing ? 'PAUSE' : 'PLAY');
  bp.dataset.say = playing ? 'Pause.' : 'Play.';

  $('#reader').classList.toggle('text-on', settings.showText);
  fitAll($('#reader'));
  await updatePanel();
}

let panelKey = '';
let shownVerse = 0;

function scrollBehavior(): ScrollBehavior {
  return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export async function updatePanel(): Promise<void> {
  const p = $('#panel');
  if (!settings.showText) {
    p.innerHTML = '';
    panelKey = '';
    shownVerse = 0;
    return;
  }
  const key = `${position.book}-${position.chapter}`;
  if (key !== panelKey) {
    const verses = await bible.chapter(position.book, position.chapter);
    if (key !== `${position.book}-${position.chapter}`) return; // moved on while loading
    panelKey = key;
    shownVerse = 0;
    p.innerHTML = '';
    verses.forEach((text, i) => {
      p.appendChild(div('v', span('n', String(i + 1)), text));
    });
  }
  let cur: HTMLElement | null = null;
  Array.from(p.children).forEach((d, i) => {
    const on = i + 1 === position.verse;
    d.classList.toggle('cur', on);
    if (on) {
      cur = d as HTMLElement;
      d.setAttribute('aria-current', 'true');
    } else {
      d.removeAttribute('aria-current');
    }
  });
  if (cur && shownVerse !== position.verse) {
    shownVerse = position.verse;
    stopFollowing();
    const c = cur as HTMLElement;
    // A verse that fits is centered; a verse taller than the panel starts near the top and is followed as it is read.
    const top = c.offsetHeight > p.clientHeight * 0.8 ? c.offsetTop - p.clientHeight * 0.08 : c.offsetTop - p.clientHeight / 2 + c.offsetHeight / 2;
    p.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }
  p.dataset.say = `${bible.reference(position)}.`;
}

/* ---- following the voice through a long verse ----
   The voice reports word positions when it can (onboundary). Between reports, and on voices that
   never report, the position is estimated from elapsed time so the panel still keeps up. */
const CHARS_PER_SECOND = 14; // ordinary reading pace at normal speed
let followVerse = 0;
let followIndex = 0;
let followAt = 0;
let followTimer = 0;

export function progress(verse: number, charIndex: number): void {
  if (!settings.showText || verse !== position.verse) return;
  followVerse = verse;
  followIndex = charIndex;
  followAt = performance.now();
  scrollToChar(verse, charIndex);
  if (!followTimer) followTimer = window.setInterval(tick, 300);
}

export function stopFollowing(): void {
  if (followTimer) clearInterval(followTimer);
  followTimer = 0;
  followVerse = 0;
}

function tick(): void {
  if (!followVerse || followVerse !== position.verse) return stopFollowing();
  const elapsed = (performance.now() - followAt) / 1000;
  scrollToChar(followVerse, followIndex + elapsed * CHARS_PER_SECOND * settings.rate);
}

function scrollToChar(verse: number, charIndex: number): void {
  const p = $('#panel');
  const el = p.children[verse - 1] as HTMLElement | undefined;
  if (!el) return;
  const node = el.lastChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const len = node.textContent?.length ?? 0;
  if (len === 0 || el.offsetHeight <= p.clientHeight * 0.8) return; // short verses stay centered
  const i = Math.max(0, Math.min(len - 1, Math.round(charIndex)));
  const range = document.createRange();
  range.setStart(node, i);
  range.setEnd(node, Math.min(len, i + 1));
  const rect = range.getBoundingClientRect();
  if (!rect.height) return;
  const panelRect = p.getBoundingClientRect();
  const y = rect.top - panelRect.top; // position inside the visible panel
  const h = p.clientHeight;
  // Keep the spoken line in the middle band; scroll when it drifts toward the bottom or above the top.
  if (y + rect.height > h * 0.7 || y < h * 0.05) {
    p.scrollTo({ top: p.scrollTop + y - h * 0.35, behavior: scrollBehavior() });
  }
}
