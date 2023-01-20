/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  'extends': [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript/recommended'
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
    'vue/no-undef-components': ['error'],
    '@typescript-eslint/no-non-null-assertion': 'off',
      // As long TS does not know about inline callbacks, the '!' stays.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off'
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
};
