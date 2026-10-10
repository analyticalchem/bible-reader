import { settings } from '../state';

export interface InputHandlers {
  activate(el: HTMLElement): void;
  /** Speak what a control is without activating it. */
  describe(el: HTMLElement, suffix?: string): void;
  /** Any pointer activity; lets the speaker retry after a blocked start. */
  gesture?(): void;
}

const LONG_PRESS_MS = 900; // click mode: hold this long to hear a button's name
const REPEAT_MS = 600; // arrows keep firing at this interval while held
const DEBOUNCE_MS = 400; // ignore a second activation of the same control this soon after the first

/**
 * Click mode: a click activates; right-click or a long press reads the name.
 * Hold mode: holding for the set time activates; any shorter press reads the name.
 * Buttons marked data-repeat keep firing while held in either mode.
 */
export function installInput(h: InputHandlers): void {
  let holdTimer: number | null = null;
  let pressTimer: number | null = null;
  let repeatTimer: number | null = null;
  let holdEl: HTMLElement | null = null;
  let suppressClick = false;
  let lastDescribe = 0;
  let lastAct = 0;
  let lastEl: HTMLElement | null = null;

  const target = (e: Event): HTMLElement | null => {
    const t = e.target as Element | null;
    return (t?.closest?.('.btn') as HTMLElement | null) ?? null;
  };
  const usable = (b: HTMLElement | null): b is HTMLElement => !!b && !b.classList.contains('spacer');

  function clearTimers(): void {
    if (holdTimer) clearTimeout(holdTimer);
    if (pressTimer) clearTimeout(pressTimer);
    if (repeatTimer) clearInterval(repeatTimer);
    holdTimer = pressTimer = repeatTimer = null;
    holdEl?.classList.remove('holding');
  }

  function fire(el: HTMLElement): void {
    const now = performance.now();
    if (el === lastEl && now - lastAct < DEBOUNCE_MS) return;
    lastAct = now;
    lastEl = el;
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 150);
    h.activate(el);
  }

  function startRepeat(el: HTMLElement): void {
    if (!el.dataset.repeat) return;
    repeatTimer = window.setInterval(() => {
      lastAct = 0;
      fire(el);
    }, REPEAT_MS);
  }

  document.addEventListener('pointerdown', e => {
    h.gesture?.();
    suppressClick = false;
    const b = target(e);
    if (!usable(b) || e.button !== 0) return;
    clearTimers();
    holdEl = b;
    if (settings.mode === 'hold') {
      b.style.setProperty('--hold-ms', `${settings.holdMs}ms`);
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        b.classList.remove('holding');
        suppressClick = true;
        fire(b);
        startRepeat(b);
      }, settings.holdMs);
      requestAnimationFrame(() => {
        if (holdEl === b && holdTimer) b.classList.add('holding');
      });
    } else if (b.dataset.repeat) {
      pressTimer = window.setTimeout(() => {
        pressTimer = null;
        suppressClick = true;
        fire(b);
        startRepeat(b);
      }, REPEAT_MS);
    } else {
      pressTimer = window.setTimeout(() => {
        pressTimer = null;
        suppressClick = true;
        lastDescribe = performance.now();
        h.describe(b);
      }, LONG_PRESS_MS);
    }
  });

  document.addEventListener('pointermove', e => {
    if (!holdEl || (!holdTimer && !pressTimer && !repeatTimer)) return;
    if (target(e) !== holdEl) {
      clearTimers();
      suppressClick = true;
    }
  });

  function endPress(): void {
    if (holdTimer) {
      const el = holdEl;
      clearTimers();
      suppressClick = true;
      if (el) {
        lastDescribe = performance.now();
        h.describe(el, ' Hold to activate.');
      }
    } else if (pressTimer || repeatTimer) {
      clearTimers();
    }
    holdEl = null;
  }
  document.addEventListener('pointerup', endPress);
  document.addEventListener('pointercancel', endPress);

  document.addEventListener('click', e => {
    const b = target(e);
    if (!usable(b)) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    // In hold mode a pointer click does nothing; keyboard activation (detail 0) still works.
    if (settings.mode === 'hold' && e.detail !== 0) return;
    fire(b);
  });

  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (holdTimer) return;
    if (performance.now() - lastDescribe < 1000) return;
    const t = e.target as Element | null;
    const el = t?.closest?.('.btn, .set, .panel, .heading') as HTMLElement | null;
    if (usable(el)) {
      lastDescribe = performance.now();
      h.describe(el);
    }
  });
}
