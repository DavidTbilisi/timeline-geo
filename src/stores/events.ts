import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LaidOutEvent, EventDetail } from '@lib/types'
import { useTimelineConfig } from '@lib/config'
import { layoutEvents } from '@lib/layout'
import { pickLocalized } from '@lib/i18n/localized'
import { log } from '@/utils/log'

export const useEventsStore = defineStore('events', () => {
  const config = useTimelineConfig()

  // Events keyed by period id
  const byPeriod = ref<Record<number, LaidOutEvent[]>>({})
  // All events flat list (for search)
  const allEvents = ref<LaidOutEvent[]>([])
  const allLoaded = ref(false)
  // Detail cache keyed by slug
  const details = ref<Record<string, EventDetail>>({})

  async function loadPeriod(period: number): Promise<LaidOutEvent[]> {
    if (byPeriod.value[period]) {
      log.data('loadPeriod cache hit', { period, count: byPeriod.value[period].length })
      return byPeriod.value[period]
    }
    const t0 = performance.now()
    try {
      const raw = await config.loaders.events(period)
      const events = layoutEvents(raw, config.periods, config.layout)
      byPeriod.value[period] = events
      log.data('loadPeriod loaded', { period, count: events.length, ms: Math.round(performance.now() - t0) })
      return events
    } catch (e) {
      log.error('loadPeriod failed', { period }, e)
      byPeriod.value[period] = []
      return []
    }
  }

  async function loadAll() {
    if (allLoaded.value) {
      log.data('loadAll already loaded', { count: allEvents.value.length })
      return
    }
    const t0 = performance.now()
    const all: LaidOutEvent[] = []
    for (const p of config.periods) {
      const evs = await loadPeriod(p.id)
      all.push(...evs)
    }
    allEvents.value = all
    allLoaded.value = true
    log.data('loadAll done', { total: all.length, ms: Math.round(performance.now() - t0) })
  }

  /** Returns events for the active period ± 1 neighbour (by chronological index). */
  function getVisibleEvents(activePeriod: number): LaidOutEvent[] {
    const { periods } = config
    const idx = config.byId[activePeriod]?.index ?? 0
    const result: LaidOutEvent[] = []
    for (let i = Math.max(0, idx - 1); i <= Math.min(periods.length - 1, idx + 1); i++) {
      const evs = byPeriod.value[periods[i].id]
      if (evs) result.push(...evs)
    }
    return result
  }

  async function loadDetail(slug: string): Promise<EventDetail | null> {
    if (details.value[slug]) {
      log.data('loadDetail cache hit', { slug })
      return details.value[slug]
    }
    const t0 = performance.now()
    try {
      const d = await config.loaders.detail(slug)
      if (!d) {
        log.warn('loadDetail: not found', { slug })
        return null
      }
      details.value[slug] = d
      log.data('loadDetail loaded', { slug, ms: Math.round(performance.now() - t0) })
      return d
    } catch (e) {
      log.error('loadDetail failed', { slug }, e)
      return null
    }
  }

  /**
   * Relevance-ranked search across event titles (every available locale)
   * and the containing period's name.
   *
   * Tier order — exact > prefix > word-boundary > substring — applied
   * first to event titles, then to period names. Period-name matches
   * are demoted by adding `PERIOD_TIER_OFFSET` so a direct title match
   * always outranks a period-name fallback. See #55, #56.
   *
   * Until events ship with translated titles, period-name matching is the
   * main way non-English queries return results at all.
   */
  function search(query: string): LaidOutEvent[] {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const t0 = performance.now()
    const locales = config.locales.available
    const sortChain = [config.locales.fallback, ...locales]

    const wordBoundary = new RegExp(
      '\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )

    function tier(field: string): number {
      if (field === q) return 1
      if (field.startsWith(q)) return 2
      if (wordBoundary.test(field)) return 3
      if (field.includes(q)) return 4
      return Infinity
    }

    function bestTier(value: Partial<Record<string, string>>): number {
      let best = Infinity
      for (const loc of locales) {
        const text = value[loc]
        if (text) best = Math.min(best, tier(text.toLowerCase()))
      }
      return best
    }

    // Direct title matches always rank above any period-name match.
    const PERIOD_TIER_OFFSET = 10

    type Scored = { event: LaidOutEvent; score: number }
    const scored: Scored[] = []
    for (const e of allEvents.value) {
      let score = bestTier(e.title)
      if (score === Infinity) {
        const period = config.byId[e.period]
        if (period) {
          const periodScore = bestTier(period.name)
          if (periodScore < Infinity) score = periodScore + PERIOD_TIER_OFFSET
        }
      }
      if (score < Infinity) scored.push({ event: e, score })
    }

    scored.sort((a, b) =>
      a.score - b.score ||
      pickLocalized(a.event.title, sortChain).localeCompare(pickLocalized(b.event.title, sortChain)),
    )
    const top = scored.slice(0, 20).map((s) => s.event)
    log.search('search', { query: q, matched: scored.length, returned: top.length, ms: Math.round(performance.now() - t0) })
    return top
  }

  return {
    byPeriod,
    allEvents,
    details,
    loadPeriod,
    loadAll,
    getVisibleEvents,
    loadDetail,
    search,
  }
})
