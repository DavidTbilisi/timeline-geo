/**
 * useFullLabel — keeps floating event title labels visible while scrolling.
 * For major events with labelStyle='full', the .info-full element is translated
 * so the title text stays anchored to the left edge of the viewport.
 */
import { SIDEBAR_WIDTH } from '@/utils/geometry'

// Minimum right-side margin to preserve inside the event card before the
// floating label stops sliding. Once shift exceeds (eventWidth - this), the
// label would overflow the card's right edge, so we snap it back.
const MIN_RIGHT_MARGIN_PX = 263

/**
 * Returns the visual offset where labels should start sliding.
 * On desktop the sidebar covers the right 220px so labels slide once they
 * reach `scrollLeft + 220`. On mobile (< md) the sidebar is hidden via CSS,
 * so labels can slide all the way to the viewport edge — offset becomes 0.
 */
function menuOffset(): number {
  if (typeof window === 'undefined') return SIDEBAR_WIDTH
  return window.matchMedia('(max-width: 767px)').matches ? 0 : SIDEBAR_WIDTH
}

/**
 * @param getStageEl  Getter for the stage element that contains `.info-full`
 *                    children. A getter (rather than a Ref) keeps the
 *                    composable agnostic about how the caller stores the
 *                    element — child-component ref, plain ref, query, etc.
 */
export function useFullLabel(getStageEl: () => HTMLElement | null) {
  /**
   * @param scrollLeft  Canonical scroll position (zoom=1 pixel space)
   * @param zoom        Current zoom level (default 1). Divides the applied
   *                    translate so labels stay at the viewport edge even when
   *                    the stage has scaleX(zoom) applied.
   */
  function update(scrollLeft: number, zoom = 1) {
    const stage = getStageEl()
    if (!stage) return
    const labels = stage.querySelectorAll<HTMLElement>('.info-full')
    labels.forEach(label => {
      const parent = label.parentElement
      if (!parent) return
      const eventLeft  = parseFloat(parent.style.left  || '0')
      const eventWidth = parseFloat(parent.style.width || '0')
      const threshold  = scrollLeft + menuOffset()
      if (threshold >= eventLeft) {
        const shift = threshold - eventLeft
        // Divide shift by zoom: the label lives inside a scaleX(zoom) parent,
        // so 1px of label movement = zoom px visual movement.
        label.style.transform = shift < eventWidth - MIN_RIGHT_MARGIN_PX
          ? `translate3d(${shift / zoom}px,0,0)`
          : 'translate3d(0,0,0)'
      } else {
        label.style.transform = 'translate3d(0,0,0)'
      }
    })
  }

  return { update }
}
