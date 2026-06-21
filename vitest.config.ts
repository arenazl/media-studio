import { defineConfig } from 'vitest/config';

// Tests de LÓGICA PURA (sin DOM): entorno node, sólo los *.test.ts de src/lib.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
