<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TimelineView from '@/components/timeline/TimelineView.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import EventDetail from '@/components/detail/EventDetail.vue'
import { useTimelineStore } from '@/stores/timeline'
import { useEventsStore } from '@/stores/events'
import { PERIOD_BY_SLUG } from '@/data/periods'

const route = useRoute()
const tlStore = useTimelineStore()
const eventsStore = useEventsStore()

async function handleRoute() {
  const slug = route.params.slug as string
  if (!slug) return

  if (route.path.startsWith('/period/')) {
    const period = PERIOD_BY_SLUG[slug]
    if (period) {
      // Pre-load period data then scroll
      await eventsStore.loadPeriod(period.id)
      if (period.id > 1) await eventsStore.loadPeriod(period.id - 1)
      if (period.id < 13) await eventsStore.loadPeriod(period.id + 1)
      tlStore.activePeriod = period.id
    }
  } else if (route.path.startsWith('/event/')) {
    tlStore.openEvent(slug)
  }
}

onMounted(handleRoute)
watch(() => route.path, handleRoute)
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
