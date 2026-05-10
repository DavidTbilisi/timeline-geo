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
 * Per-event rendered-width clamps, keyed by slug.
 *
 * The source `events.json` from biblehistory.com places long-duration
 * "life span" cards (e.g. Miriam at left=9434 width=554.4) and shorter
 * point-in-time events (e.g. Balak Summons Balaam at left=9975) on the
 * same row. The duration cards literally overlap their neighbors —
 * faithful but visually noisy: the next card sits over the previous
 * card's right-edge thumbnail.
 *
 * Clamp each card's width so its right edge stops 4px before the next
 * card on the same row. The label slide range (used by useFullLabel)
 * picks the new width up from the DOM automatically.
 */
const GAP = 4
const renderedWidths = computed(() => {
  const byRow = new Map<number, TimelineEvent[]>()
  for (const e of visibleEvents.value) {
    if (!byRow.has(e.row)) byRow.set(e.row, [])
    byRow.get(e.row)!.push(e)
  }
  const clamps = new Map<string, number>()
  for (const row of byRow.values()) {
    row.sort((a, b) => a.left - b.left)
    for (let i = 0; i < row.length - 1; i++) {
      const cur = row[i]
      const next = row[i + 1]
      if (cur.width <= 0) continue
      const maxRight = next.left - GAP
      if (cur.left + cur.width > maxRight) {
        clamps.set(cur.slug, Math.max(40, maxRight - cur.left))
      }
    }
  }
  return clamps
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
      :rendered-width="renderedWidths.get(event.slug)"
      @click="emit('eventClick', event)"
    />

    <!-- Today marker — shows current year on the stage -->
    <TodayMarker />
  </div>
</template>
