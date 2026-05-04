<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TimelineView from '@/components/timeline/TimelineView.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import EventDetail from '@/components/detail/EventDetail.vue'
import { useTimelineStore } from '@/stores/timeline'
import { PERIOD_BY_SLUG } from '@/data/periods'
import { useKeyboard } from '@/composables/useKeyboard'

const route = useRoute()
const tlStore = useTimelineStore()
useKeyboard()

// No awaits here: TimelineStage.refreshEvents already loads active ± 1
// in parallel via Promise.all, so blocking on JSON imports here just
// delayed the route transition. Setting activePeriod after children mount
// lets the existing watcher animate to the target period. See issue #52.
function applyRoute() {
  const slug = route.params.slug as string
  if (!slug) return

  if (route.path.startsWith('/period/')) {
    const period = PERIOD_BY_SLUG[slug]
    if (period) tlStore.activePeriod = period.id
  } else if (route.path.startsWith('/event/')) {
    tlStore.openEvent(slug)
  }
}

onMounted(applyRoute)
watch(() => route.path, applyRoute)
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-stone-900">
    <AppMenu />
    <TimelineView />
    <Transition name="detail">
      <EventDetail v-if="tlStore.detailOpen" />
    </Transition>
  </div>
</template>
