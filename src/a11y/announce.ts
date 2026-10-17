// Status messages for screen readers (ChromeVox, VoiceOver). Every announcement the app makes is
// also written here, in a polite live region that is invisible on screen.
let timer = 0;

export function announce(text: string): void {
  const el = document.getElementById('announce');
  if (!el) return;
  el.textContent = '';
  clearTimeout(timer);
  // Clearing first and writing a moment later makes a repeated message ("Back.") announce again.
  timer = window.setTimeout(() => {
    el.textContent = text;
  }, 60);
}
