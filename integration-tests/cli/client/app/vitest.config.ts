import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 600000,
    bail: 1, // Exit after first test failure
    hookTimeout: 30000,
  },
});
