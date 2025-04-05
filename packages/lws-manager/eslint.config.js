// eslint.config.js
import pluginVue from 'eslint-plugin-vue';
import tsEslintConfig from '@vue/eslint-config-typescript';

export default [
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
