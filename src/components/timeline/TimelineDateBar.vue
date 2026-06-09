<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDateTicks } from '@/composables/useDateTicks'
import { STAGE_WIDTH } from '@/data/periods'
import { useTimelineStore } from '@/stores/timeline'

// flip = true: ticks at top of bar, label below (used for bottom bar)
// flip = false (default): ticks at bottom of bar, label above (used for top bar)
const props = defineProps<{ flip?: boolean }>()

const { t } = useI18n()
const tlStore = useTimelineStore()
const allTicks = getDateTicks()

const minorTicks = computed(() => allTicks.filter(t => !t.major))
const majorTicks = computed(() => allTicks.filter(t => t.major))

// Hovered event range (px on the stage). When set, labels/ticks inside this
// slice render darker so the event's date span pops against the period
// color overlay drawn behind them.
function inHoverRange(x: number): boolean {
  const r = tlStore.hoverRange
  return !!r && x >= r.startPx && x < r.endPx
}

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} ${t('timeline.bc')}`
  if (year === 0) return `1 ${t('timeline.ad')}`
  return `${year} ${t('timeline.ad')}`
}

// Bottom datebar: year labels at the TOP of the cream strip with tick marks
// descending below them, pointing down toward the dark period footer band.
// `flip` is accepted for backwards compatibility but no longer alters
// positioning; only one datebar (the bottom one) is rendered.
void props
function minorTickStyle(x: number) {
  return { left: x + 'px', top: '22px' }
}
function majorTickStyle(x: number) {
  return { left: x + 'px', top: '22px' }
}
function labelStyle(x: number) {
  return { left: x + 'px', top: '4px', transform: 'translateX(-50%)' }
}
</script>

<template>
  <div class="relative" :style="{ width: STAGE_WIDTH + 'px', height: '100%' }">
    <!-- Minor ticks -->
    <div
      v-for="tick in minorTicks"
      :key="'m' + tick.x"
      class="absolute w-px tl-tick-minor"
      :class="{ 'in-hover': inHoverRange(tick.x) }"
      style="height: 8px;"
      :style="minorTickStyle(tick.x)"
    />

    <!-- Major ticks -->
    <div
      v-for="tick in majorTicks"
      :key="'M' + tick.x"
      class="absolute w-px tl-tick-major"
      :class="{ 'in-hover': inHoverRange(tick.x) }"
      style="height: 16px;"
      :style="majorTickStyle(tick.x)"
    />

    <!-- Major labels -->
    <span
      v-for="tick in majorTicks"
      :key="'L' + tick.x"
      class="absolute whitespace-nowrap pointer-events-none select-none tl-label"
      :class="{ 'in-hover': inHoverRange(tick.x) }"
      style="font-size: 10px; font-family: 'Noto Sans Georgian', sans-serif;"
      :style="labelStyle(tick.x)"
    >
      {{ formatYear(tick.year) }}
    </span>
  </div>
</template>

<style scoped>
/* Sit above the .tl-datebar-color overlay (z-index 1 in TimelineView.vue) so
   the year labels stay readable when the hover tint is painted behind them. */
.tl-tick-minor, .tl-tick-major, .tl-label { z-index: 2; }

.tl-tick-minor          { background: rgba(130, 128, 118, 0.45); }
.tl-tick-minor.in-hover { background: rgba(0, 0, 0, 0.55); }

.tl-tick-major          { background: rgba(130, 128, 118, 0.85); }
.tl-tick-major.in-hover { background: rgba(0, 0, 0, 0.85); }

.tl-label          { color: #828076; }
.tl-label.in-hover { color: #1f1b16; font-weight: 600; }
</style>
