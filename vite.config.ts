/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site at https://<user>.github.io/<repo>/
const BASE_PATH = '/finishline/';
const THEME = '#0f172a';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Finish Line',
        short_name: 'Finish Line',
        description: 'Finish what you start. A game for finishing initiatives and having the hard conversations.',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        display: 'standalone',
        orientation: 'portrait',
        background_color: THEME,
        theme_color: THEME,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${BASE_PATH}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
