<script setup lang="ts">
import { ref } from 'vue'
import { PERIODS, ERAS } from '@/data/periods'
import { useI18n } from 'vue-i18n'
import PeriodCard from './PeriodCard.vue'
import WelcomePanel from './WelcomePanel.vue'
import AmazingFacts from './AmazingFacts.vue'

const { t } = useI18n()
const containerRef = ref<HTMLElement | null>(null)

let dragging = false
let startX = 0
let scrollStart = 0

function onMouseDown(e: MouseEvent) {
  dragging = true
  startX = e.clientX
  scrollStart = containerRef.value?.scrollLeft ?? 0
}
function onMouseMove(e: MouseEvent) {
  if (!dragging || !containerRef.value) return
  containerRef.value.scrollLeft = scrollStart - (e.clientX - startX)
  e.preventDefault()
}
function onMouseUp() { dragging = false }

// Group periods by era for the arch labels
const eraPeriods = ERAS.map(era => ({
  era,
  periods: PERIODS.filter(p => p.era === era.id),
}))
</script>

<template>
  <div
    class="absolute inset-0 flex flex-col"
    style="padding-top: 50px; background: linear-gradient(180deg, #0f0f0f 0%, #1a1206 100%);"
  >
    <!-- Header -->
    <div class="text-center py-6 flex-shrink-0">
      <h1 class="text-3xl font-bold text-white tracking-tight mb-1">
        {{ t('landing.title') }}
      </h1>
      <p class="text-white/50 text-sm">{{ t('landing.subtitle') }}</p>
    </div>

    <!-- Era label strip with descriptions -->
    <div class="flex-shrink-0 px-6 mb-3">
      <div class="flex gap-2">
        <div
          v-for="group in eraPeriods"
          :key="group.era.id"
          class="border-t border-white/20 pt-1 px-1"
          :style="{ flex: group.periods.length }"
        >
          <span class="block text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {{ t(`eras.${group.era.id}`) }}
          </span>
          <span class="block text-[10px] text-white/30 leading-snug mt-0.5 line-clamp-2">
            {{ t(`eras.descriptions.${group.era.id}`) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Period cards scroll row -->
    <div
      ref="containerRef"
      class="flex gap-2 overflow-x-auto px-6 pb-4 cursor-grab active:cursor-grabbing select-none flex-shrink-0"
      style="scrollbar-width: none; -webkit-overflow-scrolling: touch; align-items: flex-start;"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <PeriodCard
        v-for="period in PERIODS"
        :key="period.id"
        :period="period"
      />
    </div>

    <!-- Footer: Welcome + Amazing Facts -->
    <div class="flex-1 px-6 pb-6 flex flex-wrap gap-6 items-end content-end overflow-y-auto">
      <WelcomePanel />
      <AmazingFacts />
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
