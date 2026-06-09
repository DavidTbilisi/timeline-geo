<script setup lang="ts">
import { computed } from 'vue'
import { PERIODS, SIDEBAR_WIDTH } from '@/data/periods'
import { usePeriodCopy } from '@/composables/usePeriodCopy'
import { withBase } from '@/utils/assetUrl'

/**
 * Renders a single sidebar panel for a given period.
 * All 13 panels are placed side by side in a strip inside TimelineView;
 * the strip is translated so the active period's panel is visible.
 */
const props = defineProps<{ periodId: number; active?: boolean }>()

const { name: periodName, description: periodDescription } = usePeriodCopy()

const period = computed(() => PERIODS[props.periodId - 1])
const name = computed(() => periodName(period.value.slug))
const description = computed(() => periodDescription(period.value.slug))
</script>

<template>
  <div
    class="tl-sidebar-panel"
    :class="{ 'is-active': active }"
    :data-testid="active ? 'tl-sidebar-active' : undefined"
    :style="{ width: SIDEBAR_WIDTH + 'px' }"
  >
    <!-- Background image fills the panel -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url('${withBase(period.sidebarImage)}')` }"
    />
    <!-- Dark gradient overlay for legibility -->
    <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
    <!-- Color accent strip at the top -->
    <div
      class="absolute top-0 left-0 right-0 h-1"
      :style="{ background: period.color }"
    />
    <div class="relative z-10 p-4 pt-24 text-white">
      <h2
        class="text-lg font-bold leading-tight mb-2"
        :style="{ color: period.color }"
      >
        {{ name }}
      </h2>
      <p class="text-xs text-white/75 leading-relaxed">{{ description }}</p>
    </div>
  </div>
</template>
