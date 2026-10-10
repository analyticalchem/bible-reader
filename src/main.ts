import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './ui/theme.css';
import './ui/layout.css';
import { registerSW } from 'virtual:pwa-register';
import * as bible from './bible';
import { BTN_STEPS, RATES, SCHEMES, TEXT_STEPS, holdLabel, position, rateIndex, saveSettings, savePosition, schemeName, settings } from './state';
import { Speaker } from './speech/speaker';
import * as voices from './speech/voices';
import { TtsReader } from './reader/tts-reader';
import { Player } from './player';
import { installInput } from './a11y/input';
import { installKeys } from './a11y/keys';
import { fitAll } from './a11y/fit-label';
import * as reader from './screens/reader';
import * as books from './screens/book-list';
import * as chapters from './screens/chapter-list';
import * as settingsScreen from './screens/settings';
import { $ } from './ui/dom';

registerSW({ immediate: true });

const SAMPLE = 'For God so loved the world, that he gave his only begotten Son.';
const speaker = new Speaker();
const ttsReader = new TtsReader(speaker, () => ({ rate: settings.rate, voice: settings.voice }));
const player = new Player(speaker, ttsReader);
let screen = 'reader';
let wasPlaying = false;

// Optional on-screen caption of everything spoken: add ?captions to the address.
if (new URLSearchParams(location.search).has('captions')) {
  const c = $('#caption');
  c.hidden = false;
  let timer = 0;
  speaker.onSpeak = text => {
    c.textContent = `🔊 ${text}`;
    c.classList.add('show');
    clearTimeout(timer);
    timer = window.setTimeout(() => c.classList.remove('show'), 2600);
  };
}

function applyLook(): void {
  const root = document.documentElement;
  root.dataset.scheme = settings.scheme;
  root.style.setProperty('--text', TEXT_STEPS[settings.textStep].size);
  root.style.setProperty('--label-scale', String(BTN_STEPS[settings.btnStep].scale));
}

function show(id: string): void {
  screen = id;
  document.querySelectorAll<HTMLElement>('.screen').forEach(s => {
    s.hidden = s.id !== id;
  });
  fitAll();
}

function refresh(): void {
  if (!player.playing) reader.stopFollowing();
  void reader.update(player.playing);
}
player.onChange = refresh;
player.onProgress = (verse, charIndex) => reader.progress(verse, charIndex);

function say(text: string): void {
  player.announce(text);
}

function leaveReader(): void {
  wasPlaying = player.suspend();
}

function goHome(announcement: string): void {
  show('reader');
  const was = wasPlaying;
  wasPlaying = false;
  player.resume(was, announcement);
}

function step(n: number, max: number, dir: number): number {
  return Math.min(max, Math.max(0, n + dir));
}

function changeVoice(dir: 1 | -1): void {
  const list = voices.english();
  if (!list.length) return say('No other voices are available on this device.');
  let i = list.findIndex(v => v.voiceURI === settings.voice) + dir;
  if (i >= list.length) i = -1;
  else if (i < -1) i = list.length - 1;
  settings.voice = i < 0 ? '' : list[i].voiceURI;
  saveSettings();
  settingsScreen.render();
  say(`${voices.label(settings.voice)}. ${SAMPLE}`);
}

function changed(feedback: string): void {
  saveSettings();
  applyLook();
  refresh();
  settingsScreen.render();
  say(feedback);
}

function activate(el: HTMLElement): void {
  const act = el.dataset.act ?? '';
  switch (act) {
    // reader
    case 'testament': void player.toggleTestament(); break;
    case 'prevBook': void player.prevBook(); break;
    case 'nextBook': void player.nextBook(); break;
    case 'prevChap': void player.prevChapter(); break;
    case 'nextChap': void player.nextChapter(); break;
    case 'prevVerse': void player.prevVerse(); break;
    case 'nextVerse': void player.nextVerse(); break;
    case 'play': player.toggle(); break;
    case 'book': { leaveReader(); const a = books.open(); show('books'); books.refit(); say(a); break; }
    case 'chapter': { leaveReader(); const a = chapters.open(position.book); show('chapters'); say(a); break; }
    case 'settings': { leaveReader(); const a = settingsScreen.open(); show('settings'); settingsScreen.render(); say(a); break; }
    // book list
    case 'listTestament': say(books.switchTestament()); break;
    case 'bookUp': say(books.turnPage(-1)); break;
    case 'bookDown': say(books.turnPage(1)); break;
    case 'bookItem': {
      position.book = el.dataset.book ?? position.book;
      position.chapter = 1;
      position.verse = 1;
      savePosition();
      goHome(`${bible.place(position)}.`);
      break;
    }
    // chapter list
    case 'chapUp': say(chapters.turnPage(-1)); break;
    case 'chapDown': say(chapters.turnPage(1)); break;
    case 'chapItem': {
      position.book = chapters.currentBook();
      position.chapter = Number(el.dataset.chapter ?? 1);
      position.verse = 1;
      savePosition();
      goHome(`${bible.place(position)}.`);
      break;
    }
    case 'back': goHome('Back.'); break;
    // settings
    case 'settingsUp': say(settingsScreen.turnPage(-1)); break;
    case 'settingsDown': say(settingsScreen.turnPage(1)); break;
    case 'modeClick': settings.mode = 'click'; changed('Click mode. Buttons activate with a click. Right-click a button to hear its name.'); break;
    case 'modeHold': settings.mode = 'hold'; changed(`Hold mode. Buttons activate when held for ${holdLabel()}. A short press only reads the name.`); break;
    case 'holdShorter': settings.holdMs = Math.max(500, settings.holdMs - 250); changed(`Hold time ${holdLabel()}.`); break;
    case 'holdLonger': settings.holdMs = Math.min(3000, settings.holdMs + 250); changed(`Hold time ${holdLabel()}.`); break;
    case 'scheme': {
      const i = SCHEMES.findIndex(s => s.id === settings.scheme);
      settings.scheme = SCHEMES[(i + 1) % SCHEMES.length].id;
      changed(`${schemeName(settings.scheme)}.`);
      break;
    }
    case 'showText': settings.showText = !settings.showText; changed(settings.showText ? 'Scripture view on.' : 'Scripture view off.'); break;
    case 'textSmaller': settings.textStep = step(settings.textStep, TEXT_STEPS.length - 1, -1); changed(`Scripture size ${TEXT_STEPS[settings.textStep].name}.`); break;
    case 'textLarger': settings.textStep = step(settings.textStep, TEXT_STEPS.length - 1, 1); changed(`Scripture size ${TEXT_STEPS[settings.textStep].name}.`); break;
    case 'btnSmaller': settings.btnStep = step(settings.btnStep, BTN_STEPS.length - 1, -1); changed(`Button text ${BTN_STEPS[settings.btnStep].name}.`); break;
    case 'btnLarger': settings.btnStep = step(settings.btnStep, BTN_STEPS.length - 1, 1); changed(`Button text ${BTN_STEPS[settings.btnStep].name}.`); break;
    case 'voicePrev': changeVoice(-1); break;
    case 'voiceNext': changeVoice(1); break;
    case 'rateSlower': settings.rate = RATES[step(rateIndex(), RATES.length - 1, -1)].rate; changed(`Reading speed ${RATES[rateIndex()].name}.`); break;
    case 'rateFaster': settings.rate = RATES[step(rateIndex(), RATES.length - 1, 1)].rate; changed(`Reading speed ${RATES[rateIndex()].name}.`); break;
    case 'continue': settings.continueChapters = !settings.continueChapters; changed(settings.continueChapters ? 'Reading will continue into the next chapter.' : 'Reading will stop at the end of each chapter.'); break;
    case 'speakButtons': settings.speakButtons = !settings.speakButtons; changed(settings.speakButtons ? 'Button names will be spoken.' : 'Button names will not be spoken.'); break;
    default: break;
  }
}

function describe(el: HTMLElement, suffix = ''): void {
  const t = el.dataset.say || el.textContent?.trim() || '';
  if (!t) return;
  el.classList.add('describing');
  setTimeout(() => el.classList.remove('describing'), 1200);
  say(t + suffix);
}

async function boot(): Promise<void> {
  applyLook();
  const app = $('#app');
  app.append(reader.build(), books.build(), chapters.build(), settingsScreen.build());
  try {
    await bible.init();
  } catch {
    app.textContent = 'The Bible text could not be loaded. Check the internet connection and open the app again.';
    return;
  }
  // Keep the saved place inside the data we have.
  try {
    const m = bible.meta(position.book);
    if (position.chapter < 1 || position.chapter > m.chapters) position.chapter = 1;
    const n = (await bible.chapter(position.book, position.chapter)).length;
    if (position.verse < 1 || position.verse > n) position.verse = 1;
  } catch {
    Object.assign(position, { book: 'GEN', chapter: 1, verse: 1 });
  }
  savePosition();
  show('reader');
  await reader.update(false);
  installInput({ activate, describe, gesture: () => speaker.retry() });
  installKeys({
    screen: () => screen,
    act: a => {
      const el = document.querySelector<HTMLElement>(`#reader [data-act="${a}"]`);
      if (el) activate(el);
    },
    back: () => goHome('Back.'),
  });
  voices.onReady(() => {
    if (screen === 'settings') settingsScreen.render();
  });
  window.addEventListener('resize', () => {
    if (screen === 'settings') settingsScreen.render();
    fitAll();
    void reader.updatePanel();
  });
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      fitAll();
      void reader.updatePanel();
    });
  }
}

void boot();
