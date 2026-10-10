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

export async function updatePanel(): Promise<void> {
  const p = $('#panel');
  if (!settings.showText) {
    p.innerHTML = '';
    panelKey = '';
    return;
  }
  const key = `${position.book}-${position.chapter}`;
  if (key !== panelKey) {
    const verses = await bible.chapter(position.book, position.chapter);
    if (key !== `${position.book}-${position.chapter}`) return; // moved on while loading
    panelKey = key;
    p.innerHTML = '';
    verses.forEach((text, i) => {
      const d = div('v', span('n', String(i + 1)), text);
      p.appendChild(d);
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
  if (cur) {
    const c = cur as HTMLElement;
    p.scrollTop = c.offsetTop - p.clientHeight / 2 + c.offsetHeight / 2;
  }
  p.dataset.say = `${bible.reference(position)}.`;
}
