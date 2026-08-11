import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','branding/oraculo-tarot-cover.webp'],
      manifest: {
        name: 'ORÁCULO TAROT',
        short_name: 'ORÁCULO',
        description: 'Tarot Rider-Waite con 78 cartas locales, tiradas físicas y virtuales, cámara asistida, aclaratorias e interpretación narrativa local.',
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
        globPatterns: ['**/*.{js,css,html,svg,json,webp,png,jpg,jpeg}'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globIgnores: ['branding/oraculo-tarot-cover.png','**/branding/oraculo-tarot-cover.png'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/seven102161\/elaine-tarot-cards\/main\/cards\/.*\.jpg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rws-card-images-emergency-v3',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 78, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/(commons|upload)\.wikimedia\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rws-card-images-wikimedia-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 78, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ]
});
