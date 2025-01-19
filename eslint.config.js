import pluginVue from 'eslint-plugin-vue';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import pluginVitest from '@vitest/eslint-plugin';

/** @type { import("eslint").Linter.Config[] } */
export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*', 'api/__tests__/*'],
  },

  {
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
    }
  }
];
