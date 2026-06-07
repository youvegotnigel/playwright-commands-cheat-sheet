import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        location: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        AbortSignal: 'readonly',
        IntersectionObserver: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // `categories` and the browser globals below are referenced inside
        // page.evaluate() callbacks, which run in the browser, not Node.
        categories: 'readonly',
        window: 'readonly',
        document: 'readonly',
        getComputedStyle: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/'],
  },
];
