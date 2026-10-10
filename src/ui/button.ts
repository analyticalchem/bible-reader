import { span } from './dom';

export interface ButtonSpec {
  act: string;
  /** Text label; abbreviated to `short` when it would wrap. */
  label?: string;
  short?: string;
  /** Large arrow glyph with a small caption underneath, for direction buttons. */
  glyph?: string;
  sub?: string;
  /** What is spoken when the person asks what the button is. */
  say?: string;
  id?: string;
  cls?: string;
  /** Keeps firing while held (list arrows, size steppers). */
  repeat?: boolean;
  data?: Record<string, string>;
}

export function button(spec: ButtonSpec): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn${spec.cls ? ` ${spec.cls}` : ''}`;
  b.dataset.act = spec.act;
  if (spec.id) b.id = spec.id;
  if (spec.say) b.dataset.say = spec.say;
  if (spec.repeat) b.dataset.repeat = '1';
  if (spec.data) for (const [k, v] of Object.entries(spec.data)) b.dataset[k] = v;
  if (spec.glyph) {
    b.appendChild(span('glyph', spec.glyph));
    if (spec.sub) b.appendChild(span('sub', spec.sub));
    if (spec.say) b.setAttribute('aria-label', spec.say.replace(/\.$/, ''));
  } else {
    b.appendChild(span('lbl nowrap', spec.label ?? ''));
    if (spec.label) b.dataset.full = spec.label;
    if (spec.short) b.dataset.short = spec.short;
    if (spec.sub) b.appendChild(span('sub', spec.sub));
  }
  b.appendChild(span('fill'));
  return b;
}

export function setLabel(b: HTMLElement, full: string, short = full): void {
  b.dataset.full = full;
  b.dataset.short = short;
  const l = b.querySelector('.lbl');
  if (l) l.textContent = full;
}

export function setSub(b: HTMLElement, text: string): void {
  const s = b.querySelector('.sub');
  if (s) s.textContent = text;
}

export function setGlyph(b: HTMLElement, glyph: string): void {
  const g = b.querySelector('.glyph');
  if (g) g.textContent = glyph;
}

/** An invisible placeholder that keeps a list grid's row heights even. */
export function spacer(): HTMLButtonElement {
  const b = button({ act: 'none' });
  b.classList.add('spacer');
  b.tabIndex = -1;
  b.setAttribute('aria-hidden', 'true');
  return b;
}
