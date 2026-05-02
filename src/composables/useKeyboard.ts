import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS } from '@/data/periods'

/** How many pixels to scroll per ArrowLeft / ArrowRight keypress. */
const SCROLL_STEP = 600

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
 * ArrowRight   scroll timeline right by SCROLL_STEP px
 * ArrowLeft    scroll timeline left  by SCROLL_STEP px
 * ArrowUp/Down reserved (no-op, no default prevented)
 * F            toggle fullscreen
 * Escape       close event detail overlay and restore /period/ URL
 */
export function useKeyboard() {
  const tlStore = useTimelineStore()
  const router = useRouter()

  function onKeydown(e: KeyboardEvent) {
    if (isTextTarget(e)) return

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        tlStore.setScroll(tlStore.scrollLeft + SCROLL_STEP)
        break

      case 'ArrowLeft':
        e.preventDefault()
        tlStore.setScroll(tlStore.scrollLeft - SCROLL_STEP)
        break

      case 'ArrowUp':
      case 'ArrowDown':
        // Reserved for future zoom — intentionally no-op
        break

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
          const periodId = tlStore.activePeriod
          const period = PERIODS[periodId - 1]
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
