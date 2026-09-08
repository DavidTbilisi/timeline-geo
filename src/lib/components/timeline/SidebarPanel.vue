<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineConfig } from '../../config'
import { useLocalized } from '../../i18n'
import { resolveAsset } from '../../theme'

/**
 * Renders a single sidebar panel for a given period.
 * All panels are placed side by side in a strip inside TimelineView;
 * the strip is translated so the active period's panel is visible.
 */
const props = defineProps<{ periodId: number; active?: boolean }>()

const config = useTimelineConfig()
const { l } = useLocalized()
const SIDEBAR_WIDTH = config.layout.sidebarWidth

const period = computed(() => config.byId[props.periodId] ?? config.periods[0])
const name = computed(() => l(period.value.name))
const description = computed(() => l(period.value.description))
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
      v-if="period.sidebarImage"
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url('${resolveAsset(config, period.sidebarImage)}')` }"
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
