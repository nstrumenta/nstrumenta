import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    exclude: ['**/node_modules/**', '**/tests/**'],
    timeout: 60000,
    hookTimeout: 60000,
  },
})
