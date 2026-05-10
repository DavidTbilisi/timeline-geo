import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { PERIODS, STAGE_WIDTH } from '@/data/periods'
import { log } from '@/utils/log'

export const useTimelineStore = defineStore('timeline', () => {
  const scrollLeft = ref(0)
  const activePeriod = ref(1)
  const detailOpen = ref(false)
  const activeEventSlug = ref<string | null>(null)
  const viewportWidth = ref(0)

  watch(activePeriod, (next, prev) => log.store('activePeriod', { from: prev, to: next }))
  watch(detailOpen, (open) => log.store('detailOpen', { open, slug: activeEventSlug.value }))

  const activePeriodData = computed(() => PERIODS[activePeriod.value - 1])

  const currentYear = computed(() => {
    const p = PERIODS[activePeriod.value - 1]
    const half = viewportWidth.value / 2
    const adjustLeft = scrollLeft.value + half - 24
    const year = p.startYear + (adjustLeft - p.startPx) / p.pxPerYear
    return Math.round(year)
  })

  const currentYearLabel = computed(() => {
    const y = currentYear.value
    if (y < -100)  return { value: Math.abs(y), era: 'bc' as const }
    if (y < 0)     return { value: Math.abs(y), era: 'bc' as const }
    if (y < 2030)  return { value: y,           era: 'ad' as const }
    return          { value: y,                  era: 'future' as const }
  })

  function setScroll(left: number) {
    scrollLeft.value = left
    // Detect active period from scroll position
    const adjusted = left + (viewportWidth.value / 2) + 93 - 110
    for (let i = 0; i < PERIODS.length; i++) {
      const nextStart = i < PERIODS.length - 1 ? PERIODS[i + 1].startPx : STAGE_WIDTH
      if (adjusted >= PERIODS[i].startPx && adjusted < nextStart) {
        if (activePeriod.value !== i + 1) activePeriod.value = i + 1
        break
      }
    }
  }

  function setViewportWidth(w: number) {
    viewportWidth.value = w
  }

  function openEvent(slug: string) {
    log.store('openEvent', { slug })
    activeEventSlug.value = slug
    detailOpen.value = true
  }

  function closeEvent() {
    log.store('closeEvent', { slug: activeEventSlug.value })
    detailOpen.value = false
    activeEventSlug.value = null
  }

  function scrollToPeriod(periodId: number) {
    const p = PERIODS[periodId - 1]
    // If landingYear is set, scroll to that year's px position instead of
    // the period's startPx — for periods where events cluster well after
    // the start year (e.g. Life of Christ). See issue #53.
    if (typeof p.landingYear === 'number') {
      const landingPx = p.startPx + (p.landingYear - p.startYear) * p.pxPerYear
      // Center the landing year in the viewport rather than placing it at
      // the left edge — keeps the visual cluster in view.
      const target = Math.max(0, landingPx - viewportWidth.value / 2)
      log.store('scrollToPeriod (landingYear)', { periodId, landingYear: p.landingYear, target })
      return target
    }
    log.store('scrollToPeriod (startPx)', { periodId, target: p.startPx })
    return p.startPx
  }

  return {
    scrollLeft,
    activePeriod,
    activePeriodData,
    detailOpen,
    activeEventSlug,
    viewportWidth,
    currentYear,
    currentYearLabel,
    setScroll,
    setViewportWidth,
    openEvent,
    closeEvent,
    scrollToPeriod,
  }
})
