import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:4010';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // The shared UI chunk is the PrimeReact component set (~215 kB gzipped). Every page uses it,
    // it loads once and stays cached, and splitting it would not make the total smaller.
    chunkSizeWarningLimit: 800,
  },
});
