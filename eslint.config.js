import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Feature-Sliced Design layers, top to bottom. A layer may import only from layers below it. */
const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const layersBelow = (layer) => LAYERS.slice(LAYERS.indexOf(layer) + 1);

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages/*', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['segment'] },
      ],
    },
    rules: {
      // Slices of the same layer never see each other; shared segments may use one another.
      // A slice is entered through its public API only (shared has no barrels on purpose).
      // Policies are last-write-wins, so the public-API policy goes last.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...LAYERS.map((layer) => ({
              from: { element: { type: layer } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: layer === 'shared' ? ['shared'] : layersBelow(layer) },
                  },
                },
              },
            })),
            {
              disallow: {
                to: {
                  element: {
                    types: { anyOf: ['pages', 'widgets', 'features', 'entities'] },
                    fileInternalPath: '!index.{ts,tsx}',
                  },
                },
              },
              message: 'Import a slice through its public API (index.ts).',
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Crossing a slice boundary: import through the @/ alias instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['*.config.{js,ts}', 'server/**/*.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
