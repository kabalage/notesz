import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from 'rollup-plugin-visualizer';
import svgLoader from 'vite-svg-loader';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
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
        'name': 'notesz',
        'short_name': 'notesz',
        'display': 'standalone',
        'background_color': '#190032',
        'theme_color': '#190032',
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
    // visualizer()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5000
  }
});
