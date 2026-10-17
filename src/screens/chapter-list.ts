import * as bible from '../bible';
import { position } from '../state';
import { button, spacer } from '../ui/button';
import { $, div } from '../ui/dom';

export const PAGE = 20;
let bookId = 'GEN';
let page = 0;

export function build(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'chapters';
  s.className = 'screen';
  s.hidden = true;
  const heading = document.createElement('h1');
  heading.className = 'heading';
  heading.id = 'chapHeading';
  s.setAttribute('aria-labelledby', 'chapHeading');
  const grid = div('grid');
  grid.id = 'chapGrid';
  s.append(
    heading,
    div(
      'listwrap',
      grid,
      div(
        'arrows',
        button({ act: 'chapUp', glyph: '▲', sub: 'UP', say: 'Up. Earlier chapters.', repeat: true }),
        button({ act: 'chapDown', glyph: '▼', sub: 'DOWN', say: 'Down. Later chapters.', repeat: true }),
      ),
    ),
    button({ act: 'back', label: 'BACK', say: 'Back.' }),
  );
  return s;
}

function range(): string {
  const n = bible.meta(bookId).chapters;
  const a = page * PAGE + 1;
  const z = Math.min(n, a + PAGE - 1);
  return `Chapters ${a} to ${z} of ${n}.`;
}

function render(): void {
  const m = bible.meta(bookId);
  const grid = $('#chapGrid');
  grid.innerHTML = '';
  const a = page * PAGE + 1;
  const z = Math.min(m.chapters, a + PAGE - 1);
  for (let c = a; c <= z; c++) {
    const current = bookId === position.book && c === position.chapter;
    const btn = button({
      act: 'chapItem',
      label: String(c),
      say: `Chapter ${c}.${current ? ' This is the current chapter.' : ''}`,
      data: { chapter: String(c) },
    });
    btn.setAttribute('aria-label', `Chapter ${c}`);
    if (current) {
      btn.classList.add('filled');
      btn.setAttribute('aria-current', 'true');
    }
    grid.appendChild(btn);
  }
  for (let c = z + 1; c <= a + PAGE - 1; c++) grid.appendChild(spacer());
  const h = $('#chapHeading');
  h.textContent = `${m.name} · ${range().replace(/\.$/, '')}`;
  h.dataset.say = `${m.spoken}. ${range()}`;
}

export function open(id: string): string {
  bookId = id;
  const start = id === position.book ? position.chapter : 1;
  page = Math.floor((start - 1) / PAGE);
  render();
  return `${bible.meta(id).spoken}. Choose a chapter. ${range()}`;
}

export function currentBook(): string {
  return bookId;
}

export function turnPage(dir: 1 | -1): string {
  const n = bible.meta(bookId).chapters;
  if (dir < 0) {
    if (page === 0) return 'This is the first page.';
    page--;
  } else {
    if ((page + 1) * PAGE >= n) return 'This is the last page.';
    page++;
  }
  render();
  return range();
}
