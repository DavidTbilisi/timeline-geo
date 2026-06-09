<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS } from '@/data/periods'
import { usePeriodCopy } from '@/composables/usePeriodCopy'
import { log } from '@/utils/log'

const tlStore = useTimelineStore()
const router = useRouter()
const { name: periodLabel } = usePeriodCopy()

const activePeriod = computed(() => tlStore.activePeriod)

function goToPeriod(periodId: number, slug: string) {
  log.ui('PeriodColorBar click', { periodId, slug })
  // Only flip the active period and navigate. TimelineView watches
  // `activePeriod` and animates the stage to `scrollToPeriod(p)` when the
  // diff vs. current `scrollLeft` is large. Calling `setScroll(target)`
  // here pre-emptively wrote the target into `scrollLeft`, so the
  // watcher saw diff=0 and skipped the animation — store said "you're
  // at period N" but the visual transform never moved.
  tlStore.activePeriod = periodId
  router.push('/period/' + slug)
}
</script>

<template>
  <div class="period-color-bar" role="navigation" aria-label="Period navigation">
    <button
      v-for="p in PERIODS"
      :key="p.id"
      class="period-color-segment"
      :class="{ 'is-active': p.id === activePeriod }"
      :style="{ background: p.color }"
      :title="periodLabel(p.slug)"
      :aria-label="periodLabel(p.slug)"
      :aria-current="p.id === activePeriod ? 'true' : undefined"
      @click="goToPeriod(p.id, p.slug)"
    >
      <span
        v-if="p.id === activePeriod"
        class="active-marker"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<style scoped>
.period-color-bar {
  display: flex;
  width: 100%;
  height: 28px;
  flex-shrink: 0;
}

.period-color-segment {
  flex: 1;
  height: 100%;
  border: none;
  border-radius: 0;
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: filter 0.15s ease;
  overflow: visible;
}

.period-color-segment:hover {
  filter: brightness(1.25);
  z-index: 1;
}

.period-color-segment.is-active {
  filter: brightness(1.15);
  box-shadow: inset 0 -3px 0 rgba(255, 255, 255, 0.55);
}

/* Small downward-pointing triangle marker above the active segment */
.active-marker {
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 7px solid rgba(255, 255, 255, 0.85);
  pointer-events: none;
}
</style>
