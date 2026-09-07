import { staticJsonLoaders, type TimelineLoaders, type TimelineEventInput } from '@lib/index'

/**
 * Period events are bundled from content/events/*.json as code-split chunks
 * (one request per period, only when needed); details are fetched at runtime
 * from public/data/details/<slug>.json.
 */
const eventModules = import.meta.glob<{ default: TimelineEventInput[] }>('@content/events/period-*.json')

const details = staticJsonLoaders({ baseUrl: import.meta.env.BASE_URL + 'data' })

export const bibleLoaders: TimelineLoaders = {
  async events(periodId) {
    const key = Object.keys(eventModules).find((k) => k.endsWith(`/period-${periodId}.json`))
    if (!key) return []
    const mod = await eventModules[key]()
    return mod.default
  },
  detail: details.detail,
}
