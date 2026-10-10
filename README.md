# Bible Reader

A Bible app for Chromebook built for people with low vision, especially macular degeneration. Huge high-contrast buttons, the King James Version read aloud one verse at a time with the current verse marked, and every button able to say its own name.

The design and decisions are in [PLAN.md](PLAN.md).

## Using it on a Chromebook

1. Open the app's address in Chrome.
2. Chrome menu (three dots) › *Cast, save, and share* › *Install page as app* (older Chrome: *Install*). Pin it to the shelf.
3. For better voices, open ChromeOS Settings › Accessibility › Text-to-speech › Text-to-speech voice settings, and next to *Chrome OS built-in text-to-speech extension* choose Settings › Install (English). Then pick the voice in the app's Settings.
4. Right-click any button to hear what it does. On the trackpad that is a two-finger click or tap, or Alt+click.

Everything, including all 66 books, is stored on the Chromebook after the first visit, so the app works without internet.

## Controls

- **Testament button** (top): switches between the Old and New Testament, starting at the first chapter.
- **Book row**: arrows step through books; the name opens the book list.
- **Chapter row**: arrows step through chapters; the name opens the chapter list.
- **Play row**: Play/Pause in the middle, verse arrows either side.
- **Settings** (bottom): click or hold activation, hold time, colors, Scripture on/off and size, button text size, voice, reading speed, whether reading continues into the next chapter, whether button names are spoken.

Keyboard: Space play/pause, Left/Right verse, Up/Down chapter, B book list, C chapter list, S settings, Esc back.

Add `?captions` to the address to see every spoken phrase on screen while testing.

## Development

```bash
npm install
npm run bible     # rebuild public/bible/kjv from the KJV source (downloads it the first time)
npm run icons     # render the app icon PNGs from icons/book-cross.svg
npm run dev       # local dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the built app locally
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

The KJV text comes from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) and is public domain.
