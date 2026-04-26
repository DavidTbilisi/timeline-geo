<script setup lang="ts">
import { computed } from 'vue'
import { PERIODS } from '@/data/periods'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/**
 * Compute the absolute x pixel position of the current real-world year
 * on the stage, using the same period offset math used everywhere else.
 */
const todayX = computed(() => {
  const todayYear = new Date().getFullYear()
  // Find last period whose startYear <= todayYear
  let period = PERIODS[PERIODS.length - 1]
  for (const p of PERIODS) {
    if (p.startYear <= todayYear) period = p
  }
  return Math.round(period.startPx + (todayYear - period.startYear) * period.pxPerYear)
})
</script>

<template>
  <div
    class="today-marker absolute top-0 bottom-0 pointer-events-none z-10"
    :style="{ left: todayX + 'px' }"
  >
    <!-- Glowing vertical line -->
    <div
      class="absolute top-0 bottom-0 w-px"
      style="background: linear-gradient(to bottom, transparent 0%, rgba(251,191,36,0.8) 8%, rgba(251,191,36,0.8) 92%, transparent 100%);
             box-shadow: 0 0 6px 1px rgba(251,191,36,0.4);"
    />
    <!-- Label badge -->
    <div
      class="absolute text-xs font-bold text-amber-300 whitespace-nowrap px-1.5 py-0.5 rounded"
      style="top: 10px; left: 4px;
             background: rgba(0,0,0,0.70);
             border: 1px solid rgba(251,191,36,0.5);
             letter-spacing: 0.03em;"
    >
      {{ t('timeline.today') }}
    </div>
  </div>
</template>
