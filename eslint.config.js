import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Flat config (ESLint 9) para el front Vite + React + TS. El objetivo central (regla dura del
// proyecto): atrapar lo que `tsc` NO ve — sobre todo las REGLAS DE HOOKS (rules-of-hooks es error).
// El server (.mjs, Node) queda fuera: es otro entorno.
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'server', 'public', '*.config.js', '*.config.ts'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // las DOS que manda la regla dura del proyecto (lo que tsc NO ve). NO spread de la config
      // "recommended" del plugin v6: trae reglas del React-Compiler (purity/set-state-in-effect)
      // que disparan sobre patrones preexistentes — su limpieza es un refactor aparte, no de este rework.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // el código base usa `catch {}`, descartes con `_` y `any`/`unknown` en los límites: warn, no error.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // `cond && fn()` y `cond ? a() : b()` como statement son idiomáticos en el código base (side effects).
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },
);
