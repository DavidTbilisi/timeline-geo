<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { useTimelineConfig } from '@lib/config'
import { useLocalized } from '@lib/i18n'
import PeriodColorBar from './PeriodColorBar.vue'

const tlStore = useTimelineStore()
const config = useTimelineConfig()
const { l } = useLocalized()
const periods = config.periods

const activePeriod = computed(() => tlStore.activePeriod)
const activePeriodData = computed(() => tlStore.activePeriodData)
const activePeriodName = computed(() => l(activePeriodData.value.name))
const activeEraName = computed(() => l(config.eraById[activePeriodData.value.era]?.name))

function goToPeriod(id: number) {
  tlStore.activePeriod = id
  const target = tlStore.scrollToPeriod(id)
  tlStore.setScroll(target)
}
</script>

<template>
  <div class="period-bar flex-col gap-0 px-0">
    <!-- Per-period color bar -->
    <PeriodColorBar />

    <!-- Dots + period info row -->
    <div class="flex items-center w-full px-4 gap-4 flex-1">
      <!-- Period dots -->
      <div class="flex items-center gap-1.5 flex-1">
        <button
          v-for="p in periods"
          :key="p.id"
          data-testid="period-dot"
          class="rounded-full transition-all duration-200 flex-shrink-0"
          :class="p.id === activePeriod
            ? 'w-4 h-4 ring-2 ring-white/30'
            : 'w-2.5 h-2.5 opacity-40 hover:opacity-70'"
          :style="{
            background: p.color,
            boxShadow: p.id === activePeriod ? `0 0 8px ${p.color}` : 'none',
          }"
          :title="l(p.name)"
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
