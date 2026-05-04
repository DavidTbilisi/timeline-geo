import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimelineEvent } from '@/types/event'
import type { EventDetail } from '@/types/detail'
import { withBase } from '@/utils/assetUrl'

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

  function search(query: string): TimelineEvent[] {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allEvents.value.filter(e =>
      e.titleEn.toLowerCase().includes(q) ||
      (e.titleKa && e.titleKa.toLowerCase().includes(q))
    ).slice(0, 20)
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
