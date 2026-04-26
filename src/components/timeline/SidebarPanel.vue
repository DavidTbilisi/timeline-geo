<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS } from '@/data/periods'
import { useI18n } from 'vue-i18n'

const tlStore = useTimelineStore()
const { locale } = useI18n()

const period = computed(() => PERIODS[tlStore.activePeriod - 1])
const name = computed(() => locale.value === 'ka' ? (period.value.nameKa ?? period.value.nameEn) : period.value.nameEn)
const description = computed(() => locale.value === 'ka'
  ? (period.value.descriptionKa ?? period.value.descriptionEn)
  : period.value.descriptionEn
)
</script>

<template>
  <!-- The sidebar slides via translateX from the parent TimelineView render callback -->
  <div
    class="tl-sidebar z-20 overflow-hidden"
    :style="{ width: '220px' }"
  >
    <!-- Background image — keyed on period so Vue transitions it on change -->
    <Transition name="sidebar-fade">
      <div
        :key="period.id"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url('${period.sidebarImage}')` }"
      />
    </Transition>
    <!-- Gradient overlay always present -->
    <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
    <!-- Color accent strip at the top, transitions with period color -->
    <div
      class="absolute top-0 left-0 right-0 h-1"
      :style="{ background: period.color, transition: 'background-color 0.5s ease' }"
    />
    <div class="relative z-10 p-4 pt-24 text-white">
      <h2
        class="text-lg font-bold leading-tight mb-2"
        :style="{ color: period.color, transition: 'color 0.5s ease' }"
      >
        {{ name }}
      </h2>
      <p class="text-xs text-white/75 leading-relaxed">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.5s ease;
  position: absolute;
  inset: 0;
}
.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}
.sidebar-fade-enter-to,
.sidebar-fade-leave-from {
  opacity: 1;
}
</style>
