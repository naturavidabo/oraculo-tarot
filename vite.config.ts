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
        description: 'Tarot Rider-Waite con biblioteca, tiradas físicas y virtuales, interpretación local y diagnóstico visual.',
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
        globIgnores: ['branding/oraculo-tarot-cover.png','**/branding/oraculo-tarot-cover.png'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/seven102161\/elaine-tarot-cards\/main\/cards\/.*\.jpg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rws-card-images-v2',
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
