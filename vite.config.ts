import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import svgLoader from 'vite-svg-loader';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // basicSsl(),
    VitePWA({
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg}'
        ]
      },
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'ios-touch-icon.png',
        'maskable-icon.png'
      ],
      manifest: {
        'id': '/',
        'start_url': '/?utm_source=pwa-install',
        'name': 'Notesz',
        'short_name': 'Notesz',
        'display': 'standalone',
        'background_color': '#000000',
        'theme_color': '#000000',
        'description': 'Test',
        'icons': [
          {
            'src': '/ios-touch-icon-512.png',
            'sizes': '512x512',
            'type': 'image/png',
            'purpose': 'any'
          },
          {
            'src': '/maskable-icon-512.png',
            'sizes': '512x512',
            'type': 'image/png',
            'purpose': 'maskable'
          }
        ]
      }
    }),
    vue(),
    svgLoader({
      svgo: false,
      defaultImport: 'url'
    }),
    visualizer()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'node-fetch': 'src/utils/nodeFetchDummy.ts'
    },
  },
  server: {
    port: 5000
  }
});
