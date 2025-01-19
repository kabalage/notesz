import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

import { defineConfig, type PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import svgLoader from 'vite-svg-loader';
import { VitePWA } from 'vite-plugin-pwa';

const appVersion = JSON.parse(readFileSync('./package.json', 'utf-8')).version;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // basicSsl(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,ico,png}'
        ]
      },
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
    visualizer() as PluginOption
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'node-fetch': fileURLToPath(new URL('./src/utils/nodeFetchDummy.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    entries: 'index.html',
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(appVersion)
  },
  server: {
    port: 5000
  }
});
