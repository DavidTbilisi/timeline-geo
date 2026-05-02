import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import type { Plugin } from 'vite'
import fs from 'fs'

// Dev-only plugin: serve images from the original site folder
// so you don't need to copy GBs of assets during development.
const ORIGINAL_SITE = resolve(__dirname, '../timeline.biblehistory.com/timeline.biblehistory.com')

function serveOriginalAssets(): Plugin {
  return {
    name: 'serve-original-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        // Only intercept image/asset paths that don't exist in public/
        if (!url.startsWith('/media/') && !url.startsWith('/css/img/')) {
          return next()
        }
        // Strip query string
        const pathname = url.split('?')[0]
        const localPublic = resolve(__dirname, 'public', pathname.slice(1))
        // If already exists in public/, let Vite serve it normally
        if (fs.existsSync(localPublic)) return next()
        // Try original site
        const originalPath = resolve(ORIGINAL_SITE, pathname.slice(1))
        if (fs.existsSync(originalPath)) {
          const ext = originalPath.split('.').pop()?.toLowerCase() ?? ''
          const mime: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          }
          res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          fs.createReadStream(originalPath).pipe(res)
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), serveOriginalAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    // Bind to all interfaces; sometimes avoids permission issues on Windows
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/vue-router/') ||
            id.includes('node_modules/pinia/') ||
            id.includes('node_modules/vue-i18n/') ||
            id.includes('node_modules/@vue/devtools-api/') ||
            id.includes('node_modules/@intlify/')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
})
