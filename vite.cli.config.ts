import { defineConfig } from 'vite'
import { resolve } from 'path'

/**
 * Node build of the package CLI (`timeline-validate`) and the schema module
 * (used by scripts/emit-schema.mjs to write schema/*.schema.json).
 * Output: dist/cli/validate.js, dist/cli/schema.js. zod stays external.
 */
export default defineConfig({
  publicDir: false,
  build: {
    ssr: true,
    target: 'node20',
    outDir: 'dist/cli',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        validate: resolve(__dirname, 'src/lib/cli/validate.ts'),
        schema: resolve(__dirname, 'src/lib/schema/index.ts'),
      },
      output: { format: 'es', entryFileNames: '[name].js' },
      external: ['zod', /^node:/],
    },
  },
})
