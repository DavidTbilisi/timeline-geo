<script setup lang="ts">
import { computed } from 'vue'
import LandingView from '../components/landing/LandingView.vue'
import AppMenu from '../components/layout/AppMenu.vue'
import { useTimelineConfig } from '../config/inject'

const config = useTimelineConfig()
// Overlay panels (e.g. an intro splash) render above the whole page.
const overlays = computed(() =>
  config.plugins.landingPanels.filter(p => p.placement === 'overlay').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
)
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-stone-900">
    <AppMenu />
    <LandingView />
    <component :is="p.component" v-for="p in overlays" :key="p.id" v-bind="p.props" />
  </div>
</template>
