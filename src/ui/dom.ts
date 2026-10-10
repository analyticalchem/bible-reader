export function $<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

export function span(className: string, text = ''): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = className;
  s.textContent = text;
  return s;
}

export function div(className: string, ...children: (Node | string)[]): HTMLDivElement {
  const d = document.createElement('div');
  d.className = className;
  d.append(...children);
  return d;
}
