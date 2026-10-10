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
    buttons: [{ act: 'showText', label: () => (settings.showText ? 'TURN OFF' : 'TURN ON'), say: () => (settings.showText ? 'Turn Scripture off.' : 'Turn Scripture on.') }],
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
    name: 'Speak button names',
    value: () => onOff(settings.speakButtons),
    buttons: [{ act: 'speakButtons', label: () => (settings.speakButtons ? 'TURN OFF' : 'TURN ON'), say: () => (settings.speakButtons ? 'Stop speaking button names.' : 'Speak button names.') }],
  },
];

export const PAGE = 5;
let page = 0;
const pages = () => Math.ceil(ROWS.length / PAGE);
const text = (v: string | (() => string)) => (typeof v === 'function' ? v() : v);

export function build(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'settings';
  s.className = 'screen';
  s.hidden = true;
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
  el.innerHTML = '';
  const slice = ROWS.slice(page * PAGE, page * PAGE + PAGE);
  for (const r of slice) {
    const set = div('set', span('name', r.name), span('val', r.value()));
    set.dataset.say = `${r.name}. Currently ${r.value()}.`;
    const row = div('srow', set);
    for (const b of r.buttons) {
      const btn = button({ act: b.act, label: text(b.label), say: text(b.say), id: b.id, repeat: b.repeat });
      if (r.buttons.length === 1) btn.classList.add('span2');
      if (b.selected?.()) btn.classList.add('filled');
      row.appendChild(btn);
    }
    el.appendChild(row);
  }
  for (let k = slice.length; k < PAGE; k++) {
    const sp = spacer();
    sp.classList.add('srow');
    el.appendChild(sp);
  }
  fitAll($('#settings'));
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
