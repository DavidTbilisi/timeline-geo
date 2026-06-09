<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

// Vertical band offsets used to be computed here every render to keep
// overlapping events from hiding each other. That math now lives in
// `scripts/computeEventLayout.mjs` and is baked into each event's
// `topOffset` field at extract time — see tests/e2e/event-stacking.spec.ts
// for the visibility rule the precalc enforces.

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
      @click="emit('eventClick', event)"
    />

    <!-- Today marker — shows current year on the stage -->
    <TodayMarker />
  </div>
</template>
