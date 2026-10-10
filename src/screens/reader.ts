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

const panel = (): HTMLElement => $('#panel');
const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- smooth scrolling ----
   Every scroll request sets a target; one animation loop eases the panel toward it, so
   frequent requests (word by word) produce one continuous motion instead of jumps. */
let target = -1;
let raf = 0;

function setTarget(top: number, instant = false): void {
  const p = panel();
  const max = Math.max(0, p.scrollHeight - p.clientHeight);
  target = Math.max(0, Math.min(max, top));
  if (instant || reducedMotion()) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    p.scrollTop = target;
    return;
  }
  if (!raf) raf = requestAnimationFrame(stepScroll);
}

function stepScroll(): void {
  raf = 0;
  const p = panel();
  const d = target - p.scrollTop;
  if (Math.abs(d) < 0.5) {
    p.scrollTop = target;
    return;
  }
  p.scrollTop += d * 0.12;
  raf = requestAnimationFrame(stepScroll);
}

/** Offset (inside the panel's content) and height of the line holding character i of a verse. */
function lineAt(el: HTMLElement, i: number): { y: number; h: number } | null {
  const node = el.lastChild;
  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const len = node.textContent?.length ?? 0;
  if (!len) return null;
  const k = Math.max(0, Math.min(len - 1, Math.round(i)));
  const range = document.createRange();
  range.setStart(node, k);
  range.setEnd(node, k + 1);
  const rect = range.getBoundingClientRect();
  if (!rect.height) return null;
  const p = panel();
  return { y: rect.top - p.getBoundingClientRect().top + p.scrollTop, h: rect.height };
}

/** Puts the line holding character i of a verse at the vertical center of the panel. */
function centerLine(el: HTMLElement, i: number, instant = false): void {
  const p = panel();
  const line = lineAt(el, i);
  const middle = line ? line.y + line.h / 2 : el.offsetTop + el.offsetHeight / 2;
  setTarget(middle - p.clientHeight / 2, instant);
}

export async function updatePanel(): Promise<void> {
  const p = panel();
  if (!settings.showText) {
    p.innerHTML = '';
    panelKey = '';
    shownVerse = 0;
    return;
  }
  const key = `${position.book}-${position.chapter}`;
  let fresh = false;
  if (key !== panelKey) {
    const verses = await bible.chapter(position.book, position.chapter);
    if (key !== `${position.book}-${position.chapter}`) return; // moved on while loading
    panelKey = key;
    shownVerse = 0;
    fresh = true;
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
    // A new chapter appears already in place; within a chapter the panel glides to the next verse.
    centerLine(cur, 0, fresh);
  }
  p.dataset.say = `${bible.reference(position)}.`;
}

/** After a resize, put the current verse back in the middle. */
export function recenter(): void {
  const p = panel();
  const cur = p.children[position.verse - 1] as HTMLElement | undefined;
  if (cur) centerLine(cur, followVerse === position.verse ? followIndex : 0, true);
}

/* ---- following the voice ----
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
  const el = panel().children[verse - 1] as HTMLElement | undefined;
  if (el) centerLine(el, charIndex);
  if (!followTimer) followTimer = window.setInterval(tick, 250);
}

export function stopFollowing(): void {
  if (followTimer) clearInterval(followTimer);
  followTimer = 0;
  followVerse = 0;
}

function tick(): void {
  if (!followVerse || followVerse !== position.verse) return stopFollowing();
  const el = panel().children[followVerse - 1] as HTMLElement | undefined;
  if (!el) return stopFollowing();
  const elapsed = (performance.now() - followAt) / 1000;
  centerLine(el, followIndex + elapsed * CHARS_PER_SECOND * settings.rate);
}
