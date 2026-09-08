import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { useTimelineConfig } from '@lib/config'

/**
 * Returns true when the keyboard event originated inside a text-input element
 * that should consume the key itself (input, textarea, contenteditable).
 */
function isTextTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return true
  if (el.isContentEditable) return true
  return false
}

/**
 * useKeyboard — attaches global keyboard shortcuts for the timeline page.
 *
 * F            toggle fullscreen
 * Escape       close event detail overlay and restore /period/ URL
 *
 * Arrow keys (scroll) and +/- (zoom) are handled by TimelineView, which
 * owns the scroller; they used to be duplicated here as store-only writes
 * that the scroller's render callback immediately overwrote.
 */
export function useKeyboard() {
  const tlStore = useTimelineStore()
  const router = useRouter()
  const config = useTimelineConfig()

  function onKeydown(e: KeyboardEvent) {
    if (isTextTarget(e)) return

    switch (e.key) {
      case 'f':
      case 'F':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {
            // Fullscreen may be denied in some environments; swallow the error.
          })
        } else {
          document.exitFullscreen().catch(() => {})
        }
        break

      case 'Escape':
        if (tlStore.detailOpen) {
          tlStore.closeEvent()
          // Navigate back to the current period so the URL stays consistent
          const period = config.byId[tlStore.activePeriod]
          if (period) {
            router.push('/period/' + period.slug)
          }
        }
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}
