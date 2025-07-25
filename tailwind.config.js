import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './index.html',
    './src/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans, "")', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono, "")', ...defaultTheme.fontFamily.mono]
      },
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
        },
        main: {
          50:  'rgb(var(--color-main-50) / <alpha-value>)',
          100: 'rgb(var(--color-main-100) / <alpha-value>)',
          200: 'rgb(var(--color-main-200) / <alpha-value>)',
          300: 'rgb(var(--color-main-300) / <alpha-value>)',
          400: 'rgb(var(--color-main-400) / <alpha-value>)',
          500: 'rgb(var(--color-main-500) / <alpha-value>)',
          600: 'rgb(var(--color-main-600) / <alpha-value>)',
          700: 'rgb(var(--color-main-700) / <alpha-value>)',
          800: 'rgb(var(--color-main-800) / <alpha-value>)',
          900: 'rgb(var(--color-main-900) / <alpha-value>)',
          950: 'rgb(var(--color-main-950) / <alpha-value>)',
        },
        accent: {
          50:  'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          950: 'rgb(var(--color-accent-950) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)'
      },
      screens: {
        touch: { raw: '(pointer: coarse)' },
        mouse: { raw: '(pointer: fine)' },
        pwa: { raw: '(display-mode: standalone)' },
        '<2xl': {'max': '1535px'},
        '<xl': {'max': '1279px'},
        '<lg': {'max': '1023px'},
        '<md': {'max': '767px'},
        '<sm': {'max': '639px'},
      },
      scale: {
        133: '1.33333',
        200: '2'
      }
    },
  },
  plugins: []
};

export default config;
