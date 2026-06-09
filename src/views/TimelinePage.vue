<script setup lang="ts">
import TimelineView from '@/components/timeline/TimelineView.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import EventDetail from '@/components/detail/EventDetail.vue'
import { useTimelineStore } from '@/stores/timeline'
import { useKeyboard } from '@/composables/useKeyboard'
import { useRouteSync } from '@/composables/useRouteSync'

const tlStore = useTimelineStore()
useKeyboard()
// Sync the route slug into the store synchronously during setup — see
// useRouteSync's JSDoc for why this MUST NOT move into onMounted.
useRouteSync()
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
