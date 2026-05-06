import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimelineEvent } from '@/types/event'
import type { EventDetail } from '@/types/detail'
import { withBase } from '@/utils/assetUrl'
import { PERIOD_BY_ID } from '@/data/periods'

export const useEventsStore = defineStore('events', () => {
  // Events keyed by period (1-13)
  const byPeriod = ref<Record<number, TimelineEvent[]>>({})
  // All events flat list (for search)
  const allEvents = ref<TimelineEvent[]>([])
  const allLoaded = ref(false)
  // Detail cache keyed by slug
  const details = ref<Record<string, EventDetail>>({})

  async function loadPeriod(period: number): Promise<TimelineEvent[]> {
    if (byPeriod.value[period]) return byPeriod.value[period]
    try {
      const mod = await import(`@/data/events/period-${period}.json`)
      const events: TimelineEvent[] = mod.default ?? mod
      byPeriod.value[period] = events
      return events
    } catch {
      byPeriod.value[period] = []
      return []
    }
  }

  async function loadAll() {
    if (allLoaded.value) return
    const all: TimelineEvent[] = []
    for (let p = 1; p <= 13; p++) {
      const evs = await loadPeriod(p)
      all.push(...evs)
    }
    allEvents.value = all
    allLoaded.value = true
  }

  /** Returns events for active period ± 1 neighbor */
  function getVisibleEvents(activePeriod: number): TimelineEvent[] {
    const result: TimelineEvent[] = []
    for (let p = Math.max(1, activePeriod - 1); p <= Math.min(13, activePeriod + 1); p++) {
      const evs = byPeriod.value[p]
      if (evs) result.push(...evs)
    }
    return result
  }

  async function loadDetail(slug: string): Promise<EventDetail | null> {
    if (details.value[slug]) return details.value[slug]
    try {
      const res = await fetch(withBase(`data/details/${slug}.json`))
      if (!res.ok) return null
      const d: EventDetail = await res.json()
      details.value[slug] = d
      return d
    } catch {
      return null
    }
  }

  /**
   * Relevance-ranked search across `titleEn`, `titleKa` (when present),
   * and the event's containing period name (EN + KA).
   *
   * Tier order — exact > prefix > word-boundary > substring — applied
   * first to event titles, then to period names. Period-name matches
   * are demoted by adding `PERIOD_TIER_OFFSET` so a direct title match
   * always outranks a period-name fallback. See #55, #56.
   *
   * Until events ship with `titleKa`, period-name matching is the main
   * way KA queries (e.g. "პირველი" → events in "პირველი თაობა") return
   * results at all.
   */
  function search(query: string): TimelineEvent[] {
    const q = query.trim().toLowerCase()
    if (!q) return []

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

    // Direct title matches always rank above any period-name match.
    const PERIOD_TIER_OFFSET = 10

    type Scored = { event: TimelineEvent; score: number }
    const scored: Scored[] = []
    for (const e of allEvents.value) {
      const en = e.titleEn.toLowerCase()
      const ka = e.titleKa?.toLowerCase() ?? ''
      let score = Math.min(tier(en), ka ? tier(ka) : Infinity)
      if (score === Infinity) {
        const period = PERIOD_BY_ID[e.period]
        if (period) {
          const periodEn = period.nameEn.toLowerCase()
          const periodKa = period.nameKa?.toLowerCase() ?? ''
          const periodScore = Math.min(
            tier(periodEn),
            periodKa ? tier(periodKa) : Infinity,
          )
          if (periodScore < Infinity) score = periodScore + PERIOD_TIER_OFFSET
        }
      }
      if (score < Infinity) scored.push({ event: e, score })
    }

    scored.sort((a, b) =>
      a.score - b.score ||
      a.event.titleEn.localeCompare(b.event.titleEn),
    )
    return scored.slice(0, 20).map((s) => s.event)
  }

  const visibleEvents = computed(() => getVisibleEvents)

  return {
    byPeriod,
    allEvents,
    details,
    loadPeriod,
    loadAll,
    getVisibleEvents,
    loadDetail,
    search,
    visibleEvents,
  }
})
