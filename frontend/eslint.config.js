import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // test helpers are never hot-reloaded
    files: ['src/test/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      // tests capture what a hook returned into a variable outside the component on purpose
      'react-hooks/globals': 'off',
    },
  },
  {
    // shadcn components export variant helpers next to components by design
    files: ['src/components/ui/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      // vendored code kept close to its source (shadcn, the time-picker repo): refs read while rendering
      // and the random skeleton width are theirs, not ours to rewrite
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
