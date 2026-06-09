import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { PERIODS, STAGE_WIDTH } from '@/data/periods'
import { pxToYear, yearToPx } from '@/utils/geometry'
import { log } from '@/utils/log'

export const useTimelineStore = defineStore('timeline', () => {
  const scrollLeft = ref(0)
  const activePeriod = ref(1)
  const detailOpen = ref(false)
  const activeEventSlug = ref<string | null>(null)
  const viewportWidth = ref(0)
  // Px range of the currently hovered event, used to highlight the matching
  // slice of the bottom date bar (tinted label + tick colors). Null = no hover.
  const hoverRange = ref<{ startPx: number; endPx: number } | null>(null)

  watch(activePeriod, (next, prev) => log.store('activePeriod', { from: prev, to: next }))
  watch(detailOpen, (open) => log.store('detailOpen', { open, slug: activeEventSlug.value }))

  const activePeriodData = computed(() => PERIODS[activePeriod.value - 1])

  // Empirically calibrated offset that aligns the year readout with the
  // dashed center line / year bubble. The probe sits ~24 px left of the
  // geometric viewport center.
  const CURRENT_YEAR_PROBE_TRIM = 24

  const currentYear = computed(() => {
    const p = PERIODS[activePeriod.value - 1]
    const probeX = scrollLeft.value + viewportWidth.value / 2 - CURRENT_YEAR_PROBE_TRIM
    return Math.round(pxToYear(probeX, p))
  })

  const currentYearLabel = computed(() => {
    const y = currentYear.value
    if (y < -100)  return { value: Math.abs(y), era: 'bc' as const }
    if (y < 0)     return { value: Math.abs(y), era: 'bc' as const }
    if (y < 2030)  return { value: y,           era: 'ad' as const }
    return          { value: y,                  era: 'future' as const }
  })

  // Empirically calibrated offset that shifts the "what period are we in"
  // probe point ~17 px to the left of geometric viewport center, so the
  // sidebar/year-bubble framing reads correctly when the user lands on
  // a period boundary. Net = ACTIVE_PERIOD_PROBE_BIAS - ACTIVE_PERIOD_PROBE_TRIM.
  const ACTIVE_PERIOD_PROBE_BIAS = 93
  const ACTIVE_PERIOD_PROBE_TRIM = 110

  function setScroll(left: number) {
    scrollLeft.value = left
    // Detect active period from scroll position
    const probe = left + (viewportWidth.value / 2)
      + ACTIVE_PERIOD_PROBE_BIAS - ACTIVE_PERIOD_PROBE_TRIM
    for (let i = 0; i < PERIODS.length; i++) {
      const nextStart = i < PERIODS.length - 1 ? PERIODS[i + 1].startPx : STAGE_WIDTH
      if (probe >= PERIODS[i].startPx && probe < nextStart) {
        if (activePeriod.value !== i + 1) activePeriod.value = i + 1
        break
      }
    }
  }

  function setViewportWidth(w: number) {
    viewportWidth.value = w
  }

  function setHoverRange(range: { startPx: number; endPx: number }) {
    hoverRange.value = range
  }

  function clearHoverRange() {
    hoverRange.value = null
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
      const landingPx = yearToPx(p.landingYear, p)
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
    hoverRange,
    currentYear,
    currentYearLabel,
    setScroll,
    setViewportWidth,
    setHoverRange,
    clearHoverRange,
    openEvent,
    closeEvent,
    scrollToPeriod,
  }
})
