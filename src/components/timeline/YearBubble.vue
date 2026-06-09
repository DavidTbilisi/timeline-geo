<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { useI18n } from 'vue-i18n'

const tlStore = useTimelineStore()
const { t } = useI18n()

const parts = computed(() => {
  const { value, era } = tlStore.currentYearLabel
  if (era === 'future') return { value: t('timeline.future'), era: '' }
  return { value: String(value), era: era === 'bc' ? t('timeline.bc') : t('timeline.ad') }
})
</script>

<template>
  <div class="year-bubble">
    {{ parts.value }}<span v-if="parts.era">{{ parts.era }}</span>
    <div class="year-bubble__tip" />
  </div>
</template>

<style scoped>
/* Mirrors div.current-year from the reference site's timeline.css:
   semi-transparent cyan-tinted lens, heavy inset glow, big soft warm-gray
   drop shadow, 8px corners, dark border. Glass dimensions/positioning live
   in src/style.css under .year-bubble. The downward arrow tip below points
   into the period footer band, matching the reference rendering. */
.year-bubble {
  background: rgba(237, 253, 254, 0.8);
  box-shadow:
    inset 0 0 22px rgba(108, 124, 129, 1),
    3px 6px 26px rgba(100, 100, 100, 0.9);
  border: 2px solid #4d4c3f;
  border-radius: 8px;
  color: #211b0e;
  font-family: 'Noto Sans Georgian', 'interstate_compressedregular', sans-serif;
  font-weight: 500;
}

.year-bubble span {
  font-size: 15px;
  color: #544932;
  margin-left: 4px;
}

/* Dark downward triangle that pokes from the bottom edge of the lens into
   the period footer band, completing the magnifying-glass silhouette. */
.year-bubble__tip {
  position: absolute;
  left: 50%;
  bottom: -8px;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 8px solid #1a1a1a;
}
</style>
