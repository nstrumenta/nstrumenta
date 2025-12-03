import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: '../public',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.ts'),
      },
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
});
