/**
 * Prefix a public-folder path with Vite's `BASE_URL` so it resolves
 * correctly when the app is deployed at a subpath (e.g. GitHub Pages
 * at `/timeline-geo/`).
 *
 * Accepts both leading-slash and bare paths; output is always the
 * fully-prefixed URL.
 *
 *   withBase('/css/img/foo.jpg')  → '/timeline-geo/css/img/foo.jpg'
 *   withBase('css/img/foo.jpg')   → '/timeline-geo/css/img/foo.jpg'
 *   (in dev with base = '/'):     → '/css/img/foo.jpg'
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL // always ends with '/'
  return base + path.replace(/^\/+/, '')
}
