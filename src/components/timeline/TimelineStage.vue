<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { useEventsStore } from '@/stores/events'
import { PERIODS, STAGE_WIDTH, STAGE_HEIGHT } from '@/data/periods'
import type { TimelineEvent } from '@/types/event'
import EventItem from './EventItem.vue'
import TodayMarker from './TodayMarker.vue'

const emit = defineEmits<{ eventClick: [event: TimelineEvent] }>()

const tlStore = useTimelineStore()
const eventsStore = useEventsStore()

const stageEl = ref<HTMLElement | null>(null)
const visibleEvents = ref<TimelineEvent[]>([])

defineExpose({ stageEl })

async function refreshEvents(period: number) {
  const promises = []
  if (period > 1) promises.push(eventsStore.loadPeriod(period - 1))
  promises.push(eventsStore.loadPeriod(period))
  if (period < 13) promises.push(eventsStore.loadPeriod(period + 1))
  await Promise.all(promises)
  visibleEvents.value = eventsStore.getVisibleEvents(period)
}

onMounted(() => refreshEvents(tlStore.activePeriod))
watch(() => tlStore.activePeriod, (period) => { refreshEvents(period) })

/**
 * Per-event vertical offset (px), keyed by slug.
 *
 * The source `events.json` places long-duration bars (Aaron 9442+541)
 * and shorter events that occurred during that span (Aram (or Ram) at
 * 9491) on the same row, so their X-coords literally overlap. Trimming
 * widths kills the "this person lived for X years" signal, so instead
 * we drop the overlapping event into a sub-band 18px below.
 *
 * Constraints:
 * - Only minors (30px tall) get shifted — they're the only events that
 *   fit in the 50px row gap once shifted. Majors (80px) and small majors
 *   (50px) already extend past their row, shifting them just stacks
 *   problems.
 * - Skip the shift if a minor on row N would collide with a row-(N+1)
 *   event in X, otherwise the sub-band 18-48px slot lands on top of the
 *   row-(N+1) event at 50-80px and we trade a same-row overlap for a
 *   cross-row one (worse — the user perceives it as broken layout).
 */
const BAND_HEIGHT = 18
const topOffsets = computed(() => {
  const byRow = new Map<number, TimelineEvent[]>()
  for (const e of visibleEvents.value) {
    if (!byRow.has(e.row)) byRow.set(e.row, [])
    byRow.get(e.row)!.push(e)
  }

  const xRange = (e: TimelineEvent) => ({
    start: e.left,
    end: e.left + (e.width > 0 ? e.width : 260),
  })
  const overlaps = (
    a: { start: number; end: number },
    b: { start: number; end: number },
  ) => a.start < b.end && a.end > b.start

  const offsets = new Map<string, number>()
  for (const [rowNum, row] of byRow) {
    row.sort((a, b) => a.left - b.left)
    const occupied: Array<{ start: number; end: number }> = []
    const nextRow = byRow.get(rowNum + 1) ?? []

    for (const e of row) {
      const r = xRange(e)
      const collidesSameRow = occupied.some(o => overlaps(o, r))
      if (!collidesSameRow) {
        occupied.push(r)
        continue
      }
      // Same-row overlap. Only minors are eligible for the sub-band.
      if (e.type !== 'minor') {
        occupied.push(r)
        continue
      }
      // Sub-band collision check against the next row's events — would the
      // shifted minor (top + 18 .. top + 48) land on top of a row-(N+1)
      // event in our X range?
      const collidesNextRow = nextRow.some(other => overlaps(xRange(other), r))
      if (collidesNextRow) {
        occupied.push(r)
        continue
      }
      offsets.set(e.slug, BAND_HEIGHT)
    }
  }
  return offsets
})

// Pre-compute period color band gradient (sharp stops, very subtle)
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const periodBandBg = (() => {
  const stops: string[] = []
  PERIODS.forEach((p, i) => {
    const start = p.startPx
    const end = i < PERIODS.length - 1 ? PERIODS[i + 1].startPx : STAGE_WIDTH
    const c = hexToRgba(p.color, 0.07)
    stops.push(`${c} ${start}px`, `${c} ${end}px`)
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
})()
</script>

<template>
  <div
    ref="stageEl"
    class="tl-stage"
    :style="{ width: STAGE_WIDTH + 'px', height: STAGE_HEIGHT + 'px' }"
  >
    <!-- Period color wash + horizontal row grid lines -->
    <div
      class="absolute top-0 left-0 pointer-events-none"
      :style="{
        width: STAGE_WIDTH + 'px',
        height: STAGE_HEIGHT + 'px',
        background: periodBandBg,
        opacity: 1,
        zIndex: 0,
      }"
    />
    <!-- Horizontal row dividers (1px line every 50px, offset to row start at 20px) -->
    <div
      class="absolute top-0 left-0 pointer-events-none"
      :style="{
        width: STAGE_WIDTH + 'px',
        height: STAGE_HEIGHT + 'px',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 49px, rgba(255,255,255,0.04) 49px, rgba(255,255,255,0.04) 50px)',
        backgroundPosition: '0 20px',
        zIndex: 0,
      }"
    />

    <EventItem
      v-for="event in visibleEvents"
      :key="event.id"
      :event="event"
      :top-offset="topOffsets.get(event.slug)"
      @click="emit('eventClick', event)"
    />

    <!-- Today marker — shows current year on the stage -->
    <TodayMarker />
  </div>
</template>
