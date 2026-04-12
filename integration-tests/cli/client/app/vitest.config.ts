import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './globalSetup.ts',
    testTimeout: 600000,
    bail: 1,
    hookTimeout: 30000,
  },
});
