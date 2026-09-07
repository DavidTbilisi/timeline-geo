import type { TimelineLoaders } from '../config/types'
import type { TimelineEventInput } from '../types/event'
import type { EventDetail } from '../types/detail'

export interface StaticJsonLoaderOptions {
  /** URL prefix, e.g. `'/data'` or `import.meta.env.BASE_URL + 'data'`. */
  baseUrl: string
  /** Path of a period's events relative to `baseUrl`. */
  eventsPath?: (periodId: number) => string
  /** Path of an event's detail relative to `baseUrl`. */
  detailPath?: (slug: string) => string
  fetch?: typeof fetch
}

function join(base: string, path: string) {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
}

/**
 * Loaders that fetch plain JSON files from a static host:
 * `<baseUrl>/events/period-<id>.json` and `<baseUrl>/details/<slug>.json`.
 */
export function staticJsonLoaders(opts: StaticJsonLoaderOptions): TimelineLoaders {
  const doFetch = opts.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  const eventsPath = opts.eventsPath ?? ((id: number) => `events/period-${id}.json`)
  const detailPath = opts.detailPath ?? ((slug: string) => `details/${encodeURIComponent(slug)}.json`)

  async function getJson<T>(path: string): Promise<T | null> {
    const res = await doFetch(join(opts.baseUrl, path))
    if (!res.ok) return null
    return (await res.json()) as T
  }

  return {
    async events(periodId) {
      return (await getJson<TimelineEventInput[]>(eventsPath(periodId))) ?? []
    },
    async detail(slug) {
      return getJson<EventDetail>(detailPath(slug))
    },
  }
}
