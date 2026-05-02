<script setup lang="ts">
import { computed } from 'vue'
import { PERIODS, SIDEBAR_WIDTH } from '@/data/periods'
import { useI18n } from 'vue-i18n'

/**
 * Renders a single sidebar panel for a given period.
 * All 13 panels are placed side by side in a strip inside TimelineView;
 * the strip is translated so the active period's panel is visible.
 */
const props = defineProps<{ periodId: number }>()

const { locale } = useI18n()

const period = computed(() => PERIODS[props.periodId - 1])
const name = computed(() => locale.value === 'ka' ? (period.value.nameKa ?? period.value.nameEn) : period.value.nameEn)
const description = computed(() => locale.value === 'ka'
  ? (period.value.descriptionKa ?? period.value.descriptionEn)
  : period.value.descriptionEn
)
</script>

<template>
  <div
    class="tl-sidebar-panel"
    :style="{ width: SIDEBAR_WIDTH + 'px' }"
  >
    <!-- Background image fills the panel -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url('${period.sidebarImage}')` }"
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
