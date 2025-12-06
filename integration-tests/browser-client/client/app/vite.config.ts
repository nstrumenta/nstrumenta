import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
});
