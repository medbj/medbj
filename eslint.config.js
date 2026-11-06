import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'work/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { files: ['**/*.mjs', '**/*.js'], languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly', Buffer: 'readonly' } } },
  { files: ['**/*.astro/*.ts'], rules: { 'no-undef': 'off' } },
);
