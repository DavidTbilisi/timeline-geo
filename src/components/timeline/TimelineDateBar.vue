<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDateTicks } from '@/composables/useDateTicks'
import { STAGE_WIDTH } from '@/data/periods'

// flip = true: ticks at top of bar, label below (used for bottom bar)
// flip = false (default): ticks at bottom of bar, label above (used for top bar)
const props = defineProps<{ flip?: boolean }>()

const { t } = useI18n()
const allTicks = getDateTicks()

const minorTicks = computed(() => allTicks.filter(t => !t.major))
const majorTicks = computed(() => allTicks.filter(t => t.major))

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} ${t('timeline.bc')}`
  if (year === 0) return `1 ${t('timeline.ad')}`
  return `${year} ${t('timeline.ad')}`
}

// Shared styles for ticks and labels based on flip direction
function minorTickStyle(x: number) {
  return {
    left: x + 'px',
    [props.flip ? 'top' : 'bottom']: '0px',
  }
}
function majorTickStyle(x: number) {
  return {
    left: x + 'px',
    [props.flip ? 'top' : 'bottom']: '0px',
  }
}
function labelStyle(x: number) {
  return {
    left: x + 'px',
    [props.flip ? 'top' : 'bottom']: '20px',
    transform: 'translateX(-50%)',
  }
}
</script>

<template>
  <div class="relative" :style="{ width: STAGE_WIDTH + 'px', height: '100%' }">
    <!-- Minor ticks -->
    <div
      v-for="tick in minorTicks"
      :key="'m' + tick.x"
      class="absolute w-px bg-white/20"
      style="height: 8px;"
      :style="minorTickStyle(tick.x)"
    />

    <!-- Major ticks -->
    <div
      v-for="tick in majorTicks"
      :key="'M' + tick.x"
      class="absolute w-px bg-white/40"
      style="height: 16px;"
      :style="majorTickStyle(tick.x)"
    />

    <!-- Major labels -->
    <span
      v-for="tick in majorTicks"
      :key="'L' + tick.x"
      class="absolute text-white/55 whitespace-nowrap pointer-events-none select-none"
      style="font-size: 10px; font-family: 'Noto Sans Georgian', sans-serif;"
      :style="labelStyle(tick.x)"
    >
      {{ formatYear(tick.year) }}
    </span>
  </div>
</template>
