import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

/**
 * Library build: `npm run build:lib` → dist/index.js (ES module, Vue and its
 * ecosystem external) + dist/style.css (engine styles, lib Tailwind
 * utilities, component scoped styles). Type declarations are emitted
 * separately by vue-tsc (see tsconfig.lib.json).
 */
export default defineConfig({
  plugins: [vue()],
  // The Bible app's public/ assets are not part of the package.
  publicDir: false,
  css: {
    postcss: {
      plugins: [tailwindcss({ config: resolve(__dirname, 'tailwind.lib.config.ts') }), autoprefixer()],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/lib/index.ts'),
        styles: resolve(__dirname, 'src/lib/styles/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'vue-router', 'vue-i18n', /^@intlify\//],
    },
  },
})
