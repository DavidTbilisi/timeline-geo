import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Unit tests only. E2E specs live in tests/e2e and run under Playwright.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.spec.ts', 'tests/unit/**/*.spec.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
