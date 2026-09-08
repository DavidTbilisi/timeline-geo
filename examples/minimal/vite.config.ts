import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

/**
 * Example consumer of the engine. By default it aliases the package to the
 * library source for fast iteration; set EXAMPLE_USE_DIST=1 to consume the
 * built package in dist/ (what CI does after `npm run build:lib`).
 */
const useDist = !!process.env.EXAMPLE_USE_DIST
const repo = resolve(__dirname, '../..')

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@davidtbilisi/timeline-engine/style.css',
        replacement: useDist ? resolve(repo, 'dist/style.css') : resolve(repo, 'src/lib/styles/lib.css'),
      },
      {
        find: '@davidtbilisi/timeline-engine',
        replacement: useDist ? resolve(repo, 'dist/index.js') : resolve(repo, 'src/lib/index.ts'),
      },
    ],
  },
  css: {
    postcss: {
      // From source the lib's Tailwind utilities must be generated here; the
      // built package ships them inside style.css already.
      plugins: useDist ? [] : [tailwindcss({ config: resolve(repo, 'tailwind.lib.config.ts') }), autoprefixer()],
    },
  },
  server: { port: 3001 },
  build: { outDir: resolve(__dirname, 'dist'), emptyOutDir: true },
})
