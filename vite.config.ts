import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    // el front llama /api/* → backend local (server/index.mjs)
    proxy: { '/api': 'http://localhost:5301' },
  },
});
