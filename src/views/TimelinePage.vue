<script setup lang="ts">
import { watch } from 'vue'
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
// delayed the route transition. See issue #52.
//
// We need to set `activePeriod` synchronously DURING setup (not in
// onMounted) so TimelineView's init() reads the correct period before
// it computes the initial scroll position. Otherwise the timeline
// initializes at period 1, then the animated scroll to /period/N
// passes through every intermediate period, triggering each one's
// `refreshEvents` watcher and fetching all 13 period JSONs. See #58.
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

// Run once synchronously so TimelineView mounts with the correct
// activePeriod; the watcher handles subsequent route changes.
applyRoute()
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
