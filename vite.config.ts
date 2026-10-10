import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// base './' keeps every asset path relative, so the same build runs from a
// GitHub Pages subfolder today and from inside a Capacitor app bundle later.
export default defineConfig({
  base: './',
  build: { target: 'es2020' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: 'Bible Reader',
        short_name: 'Bible',
        description: 'Large-button Bible reader that reads aloud, built for low vision.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell, fonts, icons and every book of the Bible so it works offline.
        globPatterns: ['**/*.{js,css,html,json,woff2,png,svg}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
});
