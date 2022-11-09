/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      colors: {
        violet: {
          950: '#190032'
        },
        indigo: {
          950: '#090033'
        }
      },
      screens: {
        touch: { raw: '(pointer: coarse)' },
        mouse: { raw: '(pointer: fine)' },
        '<2xl': {'max': '1535px'},
        '<xl': {'max': '1279px'},
        '<lg': {'max': '1023px'},
        '<md': {'max': '767px'},
        '<sm': {'max': '639px'},
      }
    },
  },
  plugins: [],
};
