<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { useEventsStore } from '@/stores/events'
import { useTimelineConfig } from '@lib/config'
import type { LaidOutEvent } from '@lib/types'
import { computeBandOffsets } from '@lib/layout'
import EventItem from './EventItem.vue'
import TodayMarker from './TodayMarker.vue'

const emit = defineEmits<{ eventClick: [event: LaidOutEvent] }>()

const tlStore = useTimelineStore()
const eventsStore = useEventsStore()
const config = useTimelineConfig()
const PERIODS = config.periods
const { stageWidth: STAGE_WIDTH, stageHeight: STAGE_HEIGHT } = config.layout

const stageEl = ref<HTMLElement | null>(null)
const visibleEvents = ref<LaidOutEvent[]>([])

defineExpose({ stageEl })

async function refreshEvents(period: number) {
  // Load the active period and its chronological neighbours in parallel.
  const idx = config.byId[period]?.index ?? 0
  const promises = []
  for (let i = Math.max(0, idx - 1); i <= Math.min(PERIODS.length - 1, idx + 1); i++) {
    promises.push(eventsStore.loadPeriod(PERIODS[i].id))
  }
  await Promise.all(promises)
  visibleEvents.value = eventsStore.getVisibleEvents(period)
}

onMounted(() => refreshEvents(tlStore.activePeriod))
watch(() => tlStore.activePeriod, (period) => { refreshEvents(period) })

// Per-event vertical offset (px) for same-row x-overlaps; see computeBandOffsets.
const topOffsets = computed(() => computeBandOffsets(visibleEvents.value, config.layout))

// Pre-compute period color band gradient (sharp stops, very subtle)
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const periodBandBg = (() => {
  const stops: string[] = []
  PERIODS.forEach((p) => {
    const start = p.startPx
    const end = p.endPx
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
