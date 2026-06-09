/**
 * useRouteSync — bridges the current vue-router route into the timeline
 * store. Calls `applyRoute()` synchronously during setup, then watches
 * subsequent route changes.
 *
 * !! MUST be invoked during component setup, NOT inside onMounted !!
 *
 * Why: TimelineView's init() reads `tlStore.activePeriod` to compute the
 * initial scroll position. If activePeriod is still 1 when init runs, a
 * deep-link to /period/N triggers an animated scroll that passes through
 * every intermediate period, firing each one's refreshEvents watcher and
 * fetching all 13 period JSONs. Setting activePeriod synchronously in
 * setup avoids that cascade. See issues #52 and #58.
 */
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { PERIOD_BY_SLUG } from '@/data/periods'

export function useRouteSync() {
  const route = useRoute()
  const tlStore = useTimelineStore()

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
}
