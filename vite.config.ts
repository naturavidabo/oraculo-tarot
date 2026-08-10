import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','branding/oraculo-tarot-cover.webp'],
      manifest: {
        name: 'ORÁCULO TAROT',
        short_name: 'ORÁCULO',
        description: 'Tarot Rider-Waite offline-first con biblioteca, tiradas físicas y virtuales e interpretación local.',
        theme_color: '#07111f',
        background_color: '#07111f',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,webp,png}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ]
});
