import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';
import { loadEnv } from 'vite';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      env: loadEnv('', process.cwd(), ''),
      environment: 'jsdom',
      workspace: [{
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.ts'],
          exclude: [...configDefaults.exclude],
          root: fileURLToPath(new URL('./', import.meta.url)),
        }
      }, {
        test: {
          name: 'vercel-api',
          environment: 'node',
          globals: true,
          include: ['api/**/*.test.ts'],
          exclude: [...configDefaults.exclude],
          root: fileURLToPath(new URL('./', import.meta.url)),
        }
      }],
    },
  }),
);
