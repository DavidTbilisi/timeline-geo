import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // Unit tests live next to source under src/. The tests/ directory
    // belongs to Playwright (e2e). Restricting vitest's include avoids
    // accidentally executing e2e specs in a node environment.
    include: ['src/**/*.{test,spec}.{ts,mjs,js}'],
    environment: 'node',
  },
})
