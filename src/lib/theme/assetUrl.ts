import type { ResolvedTimelineConfig } from '../config/types'

/**
 * Prefix a public asset path with the configured base URL so it resolves
 * when the app is deployed at a subpath.
 *
 *   resolveAsset(cfg, '/css/img/foo.jpg')  → '/timeline-geo/css/img/foo.jpg'
 *   resolveAsset(cfg, 'css/img/foo.jpg')   → '/timeline-geo/css/img/foo.jpg'
 */
export function resolveAsset(config: Pick<ResolvedTimelineConfig, 'assets'>, path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) return path
  return config.assets.baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
}
