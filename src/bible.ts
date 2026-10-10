import type { BookMeta, Position, Testament } from './types';

const BASE = import.meta.env.BASE_URL;

let books: BookMeta[] = [];
const indexById = new Map<string, number>();
const loading = new Map<string, Promise<string[][]>>();

export async function init(): Promise<void> {
  const res = await fetch(`${BASE}bible/kjv/books.json`);
  if (!res.ok) throw new Error('Could not load the book list');
  books = (await res.json()) as BookMeta[];
  books.forEach((b, i) => indexById.set(b.id, i));
}

export function all(): BookMeta[] {
  return books;
}

export function meta(id: string): BookMeta {
  const i = indexById.get(id);
  if (i === undefined) throw new Error(`Unknown book ${id}`);
  return books[i];
}

export function index(id: string): number {
  return indexById.get(id) ?? 0;
}

export function ofTestament(t: Testament): BookMeta[] {
  return books.filter(b => b.testament === t);
}

export function loadBook(id: string): Promise<string[][]> {
  let p = loading.get(id);
  if (!p) {
    p = fetch(`${BASE}bible/kjv/${id}.json`)
      .then(r => {
        if (!r.ok) throw new Error(`Could not load ${id}`);
        return r.json();
      })
      .then(j => (j as { chapters: string[][] }).chapters);
    loading.set(id, p);
    p.catch(() => loading.delete(id));
  }
  return p;
}

export async function chapter(id: string, ch: number): Promise<string[]> {
  const b = await loadBook(id);
  return b[ch - 1] ?? [];
}

/** "John, chapter 3" using the spoken book name. */
export function place(p: Position): string {
  return `${meta(p.book).spoken}, chapter ${p.chapter}`;
}

/** "John, chapter 3, verse 16" using the spoken book name. */
export function reference(p: Position): string {
  return `${place(p)}, verse ${p.verse}`;
}

export function nextChapter(p: Position): Position | null {
  const m = meta(p.book);
  if (p.chapter < m.chapters) return { book: p.book, chapter: p.chapter + 1, verse: 1 };
  const i = index(p.book);
  if (i + 1 < books.length) return { book: books[i + 1].id, chapter: 1, verse: 1 };
  return null;
}

export function prevChapter(p: Position): Position | null {
  if (p.chapter > 1) return { book: p.book, chapter: p.chapter - 1, verse: 1 };
  const i = index(p.book);
  if (i > 0) {
    const b = books[i - 1];
    return { book: b.id, chapter: b.chapters, verse: 1 };
  }
  return null;
}

export function nextBook(p: Position): Position | null {
  const i = index(p.book);
  if (i + 1 < books.length) return { book: books[i + 1].id, chapter: 1, verse: 1 };
  return null;
}

export function prevBook(p: Position): Position | null {
  const i = index(p.book);
  if (i > 0) return { book: books[i - 1].id, chapter: 1, verse: 1 };
  return null;
}

export function firstOf(t: Testament): Position {
  const b = books.find(x => x.testament === t) ?? books[0];
  return { book: b.id, chapter: 1, verse: 1 };
}

export async function nextVerse(p: Position): Promise<Position | null> {
  const n = (await chapter(p.book, p.chapter)).length;
  if (p.verse < n) return { ...p, verse: p.verse + 1 };
  return nextChapter(p);
}

export async function prevVerse(p: Position): Promise<Position | null> {
  if (p.verse > 1) return { ...p, verse: p.verse - 1 };
  const prev = prevChapter(p);
  if (!prev) return null;
  const n = (await chapter(prev.book, prev.chapter)).length;
  return { ...prev, verse: n };
}
