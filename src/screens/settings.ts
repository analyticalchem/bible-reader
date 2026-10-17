import { BTN_STEPS, RATES, TEXT_STEPS, holdLabel, rateIndex, schemeName, settings } from '../state';
import * as voices from '../speech/voices';
import { button, spacer } from '../ui/button';
import { $, div, span } from '../ui/dom';
import { fitAll } from '../a11y/fit-label';

interface Btn {
  act: string;
  label: string | (() => string);
  say: string | (() => string);
  id?: string;
  repeat?: boolean;
  selected?: () => boolean;
}
interface Row {
  name: string;
  value: () => string;
  buttons: Btn[];
}

const onOff = (b: boolean) => (b ? 'On' : 'Off');

const ROWS: Row[] = [
  {
    name: 'Activate buttons by',
    value: () => (settings.mode === 'hold' ? 'Hold' : 'Click'),
    buttons: [
      { act: 'modeClick', label: 'CLICK', say: () => `Click mode.${settings.mode === 'click' ? ' Selected.' : ''}`, selected: () => settings.mode === 'click' },
      { act: 'modeHold', label: 'HOLD', say: () => `Hold mode.${settings.mode === 'hold' ? ' Selected.' : ''}`, selected: () => settings.mode === 'hold' },
    ],
  },
  {
    name: 'Hold time',
    value: holdLabel,
    buttons: [
      { act: 'holdShorter', label: 'SHORTER', say: 'Shorter hold time.', repeat: true },
      { act: 'holdLonger', label: 'LONGER', say: 'Longer hold time.', repeat: true },
    ],
  },
  {
    name: 'Colors',
    value: () => schemeName(settings.scheme),
    buttons: [{ act: 'scheme', label: 'CHANGE COLORS', say: 'Change colors.' }],
  },
  {
    name: 'Show Scripture',
    value: () => onOff(settings.showText),
    buttons: [{ act: 'showText', label: () => (settings.showText ? 'TURN OFF' : 'TURN ON'), say: () => (settings.showText ? 'Turn Scripture view off.' : 'Turn Scripture view on.') }],
  },
  {
    name: 'Scripture size',
    value: () => TEXT_STEPS[settings.textStep].name,
    buttons: [
      { act: 'textSmaller', label: 'SMALLER', say: 'Smaller Scripture.', repeat: true },
      { act: 'textLarger', label: 'LARGER', say: 'Larger Scripture.', repeat: true },
    ],
  },
  {
    name: 'Button text size',
    value: () => BTN_STEPS[settings.btnStep].name,
    buttons: [
      { act: 'btnSmaller', label: 'SMALLER', say: 'Smaller button text.', repeat: true },
      { act: 'btnLarger', label: 'LARGER', say: 'Larger button text.', repeat: true },
    ],
  },
  {
    name: 'Voice',
    value: () => voices.label(settings.voice),
    buttons: [
      { act: 'voicePrev', label: 'PREVIOUS', say: 'Previous voice.' },
      { act: 'voiceNext', label: 'NEXT', say: 'Next voice.' },
    ],
  },
  {
    name: 'Reading speed',
    value: () => RATES[rateIndex()].name,
    buttons: [
      { act: 'rateSlower', label: 'SLOWER', say: 'Slower reading.', repeat: true },
      { act: 'rateFaster', label: 'FASTER', say: 'Faster reading.', repeat: true },
    ],
  },
  {
    name: 'Keep reading into the next chapter',
    value: () => onOff(settings.continueChapters),
    buttons: [{ act: 'continue', label: () => (settings.continueChapters ? 'TURN OFF' : 'TURN ON'), say: () => (settings.continueChapters ? 'Stop at the end of each chapter.' : 'Keep reading into the next chapter.') }],
  },
  {
    name: 'Book and chapter names',
    value: () => (settings.compactNav ? 'Hidden, wide arrows' : 'Shown'),
    buttons: [{ act: 'compactNav', label: () => (settings.compactNav ? 'SHOW NAMES' : 'HIDE NAMES'), say: () => (settings.compactNav ? 'Show the book and chapter names.' : 'Hide the book and chapter names and widen the arrows.') }],
  },
  {
    name: 'Verse arrows',
    value: () => (settings.showVerseArrows ? 'Shown' : 'Hidden'),
    buttons: [{ act: 'verseArrows', label: () => (settings.showVerseArrows ? 'HIDE ARROWS' : 'SHOW ARROWS'), say: () => (settings.showVerseArrows ? 'Hide the verse arrows.' : 'Show the verse arrows.') }],
  },
  {
    name: 'Speak button names',
    value: () => onOff(settings.speakButtons),
    buttons: [{ act: 'speakButtons', label: () => (settings.speakButtons ? 'TURN OFF' : 'TURN ON'), say: () => (settings.speakButtons ? 'Stop speaking button names.' : 'Speak button names.') }],
  },
  {
    name: 'Screen reader',
    value: () => onOff(settings.screenReader),
    buttons: [{ act: 'screenReader', label: () => (settings.screenReader ? 'TURN OFF' : 'TURN ON'), say: () => (settings.screenReader ? 'Turn off screen reader support.' : 'Turn on screen reader support. The app voice will read only Scripture, and everything else goes to your screen reader.') }],
  },
  {
    name: 'Keyboard shortcuts',
    value: () => onOff(settings.shortcuts),
    buttons: [{ act: 'shortcuts', label: () => (settings.shortcuts ? 'TURN OFF' : 'TURN ON'), say: () => (settings.shortcuts ? 'Turn off keyboard shortcuts.' : 'Turn on keyboard shortcuts.') }],
  },
];

/** Five rows per page in landscape; three in portrait, where each row stacks its two buttons. */
export const perPage = (): number => (matchMedia('(max-aspect-ratio: 1/1)').matches ? 3 : 5);
let page = 0;
const pages = () => Math.ceil(ROWS.length / perPage());
const text = (v: string | (() => string)) => (typeof v === 'function' ? v() : v);
const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function build(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'settings';
  s.className = 'screen';
  s.hidden = true;
  const heading = document.createElement('h1');
  heading.className = 'sr-only';
  heading.id = 'settingsHeading';
  heading.textContent = 'Settings';
  s.setAttribute('aria-labelledby', 'settingsHeading');
  s.appendChild(heading);
  const rows = div('srows');
  rows.id = 'srows';
  s.append(
    div(
      'listwrap',
      rows,
      div(
        'arrows',
        button({ act: 'settingsUp', glyph: '▲', sub: 'UP', say: 'Up. Earlier settings.', repeat: true }),
        button({ act: 'settingsDown', glyph: '▼', sub: 'DOWN', say: 'Down. More settings.', repeat: true }),
      ),
    ),
    button({ act: 'back', label: 'BACK', say: 'Back.' }),
  );
  return s;
}

export function render(): void {
  const el = $('#srows');
  // Re-rendering replaces the buttons; remember which one had keyboard focus and put focus back on it.
  const focused = (document.activeElement as HTMLElement | null)?.closest?.('#srows .btn') as HTMLElement | null;
  const keepAct = focused?.dataset.act;
  el.innerHTML = '';
  const n = perPage();
  page = Math.min(page, pages() - 1);
  const slice = ROWS.slice(page * n, page * n + n);
  slice.forEach((r, k) => {
    const id = `set-${page * n + k}`;
    const set = div('set', span('name', r.name), span('val', r.value()));
    set.id = id;
    set.dataset.say = `${r.name}. Currently ${r.value()}.`;
    // Each row is a named group, and each button names its setting, so "Turn off" is never ambiguous.
    const row = div('srow', set);
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', `${r.name}, currently ${r.value()}`);
    for (const b of r.buttons) {
      const visible = text(b.label);
      const btn = button({ act: b.act, label: visible, say: text(b.say), id: b.id, repeat: b.repeat });
      btn.setAttribute('aria-label', `${sentence(visible)}, ${r.name}`);
      if (r.buttons.length === 1) btn.classList.add('span2');
      if (b.selected) {
        const on = b.selected();
        btn.setAttribute('aria-pressed', String(on));
        if (on) btn.classList.add('filled');
      }
      row.appendChild(btn);
    }
    el.appendChild(row);
  });
  for (let k = slice.length; k < n; k++) {
    const sp = spacer();
    sp.classList.add('srow');
    el.appendChild(sp);
  }
  fitAll($('#settings'));
  if (keepAct) el.querySelector<HTMLElement>(`[data-act="${keepAct}"]`)?.focus({ preventScroll: true });
}

export function open(): string {
  page = 0;
  render();
  return `Settings. Page 1 of ${pages()}.`;
}

export function turnPage(dir: 1 | -1): string {
  if (dir < 0) {
    if (page === 0) return 'This is the first page of settings.';
    page--;
  } else {
    if (page + 1 >= pages()) return 'This is the last page of settings.';
    page++;
  }
  render();
  return `Settings. Page ${page + 1} of ${pages()}.`;
}
