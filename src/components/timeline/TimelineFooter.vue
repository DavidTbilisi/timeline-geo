<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS } from '@/data/periods'
import { useI18n } from 'vue-i18n'
import PeriodColorBar from './PeriodColorBar.vue'

const tlStore = useTimelineStore()
const { locale, t } = useI18n()

const activePeriod = computed(() => tlStore.activePeriod)
const activePeriodData = computed(() => PERIODS[activePeriod.value - 1])
const activePeriodName = computed(() => {
  const p = activePeriodData.value
  return locale.value === 'ka' ? (p.nameKa ?? p.nameEn) : p.nameEn
})
const activeEraName = computed(() => {
  const p = activePeriodData.value
  return t(`eras.${p.era}`)
})

function goToPeriod(id: number) {
  tlStore.activePeriod = id
  const target = tlStore.scrollToPeriod(id)
  tlStore.setScroll(target)
}
</script>

<template>
  <div class="period-bar flex-col gap-0 px-0">
    <!-- 13-segment color bar -->
    <PeriodColorBar />

    <!-- Dots + period info row -->
    <div class="flex items-center w-full px-4 gap-4 flex-1">
      <!-- Period dots -->
      <div class="flex items-center gap-1.5 flex-1">
        <button
          v-for="p in PERIODS"
          :key="p.id"
          class="rounded-full transition-all duration-200 flex-shrink-0"
          :class="p.id === activePeriod
            ? 'w-4 h-4 ring-2 ring-white/30'
            : 'w-2.5 h-2.5 opacity-40 hover:opacity-70'"
          :style="{
            background: p.color,
            boxShadow: p.id === activePeriod ? `0 0 8px ${p.color}` : 'none',
          }"
          :title="locale === 'ka' ? (p.nameKa ?? p.nameEn) : p.nameEn"
          @click="goToPeriod(p.id)"
        />
      </div>

      <!-- Current period info -->
      <div class="text-right text-xs text-white/60 leading-tight flex-shrink-0">
        <div
          class="font-semibold text-sm"
          :style="{ color: activePeriodData.color, transition: 'color 0.5s ease' }"
        >
          {{ activePeriodName }}
        </div>
        <div class="text-white/40 text-[10px] uppercase tracking-wider">{{ activeEraName }}</div>
      </div>
    </div>
  </div>
</template>
