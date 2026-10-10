import * as bible from '../bible';
import { position } from '../state';
import type { Testament } from '../types';
import { button, setLabel, spacer } from '../ui/button';
import { $, div } from '../ui/dom';
import { fitAll } from '../a11y/fit-label';

export const PAGE = 6;
let testament: Testament = 'OT';
let page = 0;

const tName = (t: Testament) => (t === 'OT' ? 'Old Testament' : 'New Testament');
const other = (t: Testament): Testament => (t === 'OT' ? 'NT' : 'OT');

export function build(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'books';
  s.className = 'screen';
  s.hidden = true;
  const list = div('list');
  list.id = 'bookList';
  s.append(
    button({ id: 'bTestamentList', act: 'listTestament', label: 'OLD TESTAMENT', sub: 'PRESS TO SWITCH' }),
    div(
      'listwrap',
      list,
      div(
        'arrows',
        button({ act: 'bookUp', glyph: '▲', sub: 'UP', say: 'Up. Earlier books.', repeat: true }),
        button({ act: 'bookDown', glyph: '▼', sub: 'DOWN', say: 'Down. Later books.', repeat: true }),
      ),
    ),
    button({ act: 'back', label: 'BACK', say: 'Back.' }),
  );
  return s;
}

function range(): string {
  const list = bible.ofTestament(testament);
  const a = list[page * PAGE];
  const z = list[Math.min(list.length - 1, (page + 1) * PAGE - 1)];
  return `${a.spoken} to ${z.spoken}.`;
}

function render(): void {
  const list = bible.ofTestament(testament);
  const el = $('#bookList');
  el.innerHTML = '';
  const slice = list.slice(page * PAGE, page * PAGE + PAGE);
  for (const b of slice) {
    const current = b.id === position.book;
    const btn = button({
      act: 'bookItem',
      label: b.name.toUpperCase(),
      short: b.short.toUpperCase(),
      say: `${b.spoken}.${current ? ' This is the current book.' : ''}`,
      data: { book: b.id },
    });
    if (current) {
      btn.classList.add('filled');
      btn.setAttribute('aria-current', 'true');
    }
    el.appendChild(btn);
  }
  for (let k = slice.length; k < PAGE; k++) el.appendChild(spacer());
  const top = $('#bTestamentList');
  setLabel(top, tName(testament).toUpperCase());
  top.dataset.say = `${tName(testament)}. Press to switch to the ${tName(other(testament))}.`;
  fitAll($('#books'));
}

/** Opens on the current book's testament and page. Returns the announcement. */
export function open(): string {
  testament = bible.meta(position.book).testament;
  const idx = bible.ofTestament(testament).findIndex(b => b.id === position.book);
  page = Math.max(0, Math.floor(idx / PAGE));
  render();
  return `Choose a book. ${tName(testament)}. ${range()}`;
}

export function switchTestament(): string {
  testament = other(testament);
  page = 0;
  render();
  return `${tName(testament)}. ${range()}`;
}

export function turnPage(dir: 1 | -1): string {
  const n = bible.ofTestament(testament).length;
  if (dir < 0) {
    if (page === 0) return 'This is the top of the list.';
    page--;
  } else {
    if ((page + 1) * PAGE >= n) return 'This is the end of the list.';
    page++;
  }
  render();
  return range();
}

/** Re-renders after the screen becomes visible, so labels can be measured. */
export function refit(): void {
  fitAll($('#books'));
}
