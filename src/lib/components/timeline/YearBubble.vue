<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '../../stores/timeline'
import { useI18n } from 'vue-i18n'

const tlStore = useTimelineStore()
const { t } = useI18n()

const label = computed(() => {
  const { value, era } = tlStore.currentYearLabel
  if (era === 'future') return t('timeline.future')
  const suffix = era === 'bc' ? t('timeline.bc') : t('timeline.ad')
  return `${value} ${suffix}`
})

const color = computed(() => tlStore.activePeriodData?.color ?? '#555')
</script>

<template>
  <div
    class="year-bubble"
    :style="{
      left: '50%',
      transform: 'translateX(-50%)',
      background: color,
      transition: 'background-color 0.5s ease',
    }"
  >
    {{ label }}
    <!-- Downward arrow pointing to center line -->
    <div
      class="absolute left-1/2 -translate-x-1/2"
      style="bottom: -6px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent;"
      :style="{ borderTop: `6px solid ${color}`, transition: 'border-top-color 0.5s ease' }"
    />
  </div>
</template>
