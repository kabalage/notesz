/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'max-len': ['error', {
      code: 100,
      // ignoreUrls: true,
      // ignoreStrings: true,
      ignoreTemplateLiterals: true,
      // ignoreRegExpLiterals: true
    }],
    'no-multiple-empty-lines': ['error', {
      max: 1
    }],
    'eol-last': ['error', 'always'],
    'vue/no-undef-components': ['error']
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
};
