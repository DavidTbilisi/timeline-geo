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
 * The source `events.json` from biblehistory.com places long-duration
 * "life span" cards (e.g. Aaron at left=9442 width=541) and shorter
 * events that occurred during that span (e.g. Aram (or Ram) at
 * left=9491) on the same row. Their X-coordinates literally overlap.
 *
 * Trimming widths to fix overlap collapses the long bar (Aaron 541→45)
 * and destroys the "this person lived for X years" visual signal.
 * Instead, lay the row out in two visual bands: anything that doesn't
 * fit in band 0 (the original row top) goes to band 1, shifted down by
 * `BAND_HEIGHT` px. The label slides on its parent's translate, which
 * is unaffected by the inline `top` shift, so info-full labels still
 * track the viewport edge correctly.
 */
const BAND_HEIGHT = 35
const topOffsets = computed(() => {
  const byRow = new Map<number, TimelineEvent[]>()
  for (const e of visibleEvents.value) {
    if (!byRow.has(e.row)) byRow.set(e.row, [])
    byRow.get(e.row)!.push(e)
  }
  const offsets = new Map<string, number>()
  for (const row of byRow.values()) {
    row.sort((a, b) => a.left - b.left)
    const bands: Array<Array<{ start: number; end: number }>> = [[], []]
    for (const e of row) {
      const start = e.left
      const end = e.left + (e.width > 0 ? e.width : 260)
      const overlaps = (band: { start: number; end: number }[]) =>
        band.some(o => start < o.end && end > o.start)
      if (!overlaps(bands[0])) {
        bands[0].push({ start, end })
      } else if (!overlaps(bands[1])) {
        bands[1].push({ start, end })
        offsets.set(e.slug, BAND_HEIGHT)
      } else {
        // Both bands occupied — accept overlap on band 0 rather than
        // cascading further (third-band overlaps are rare in this dataset).
        bands[0].push({ start, end })
      }
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
