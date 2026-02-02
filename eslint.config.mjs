/* eslint-disable import/default */
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import oclifConfig from 'eslint-config-oclif';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**', '*.d.ts', 'test/**', 'bin/**'],
  },
  ...oclifConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@stylistic/indent-binary-ops': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'import/default': 'off',
      'n/no-unpublished-bin': 'off',
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: ['fetch', 'Response'],
        version: '>=18.0.0',
      }],
      'no-await-in-loop': 'off',
    },
  },
  prettier,
];
