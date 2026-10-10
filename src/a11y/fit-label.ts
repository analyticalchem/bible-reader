/** Shows a button's full label if it fits on one line, else its abbreviation, else lets it wrap. */
export function fit(el: HTMLElement): void {
  if (el.offsetParent === null) return;
  const l = el.querySelector<HTMLElement>('.lbl');
  if (!l) return;
  l.classList.add('nowrap');
  l.textContent = el.dataset.full ?? '';
  if (l.scrollWidth > l.clientWidth + 1) {
    l.textContent = el.dataset.short ?? el.dataset.full ?? '';
    if (l.scrollWidth > l.clientWidth + 1) l.classList.remove('nowrap');
  }
}

export function fitAll(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.btn[data-full]').forEach(fit);
}
