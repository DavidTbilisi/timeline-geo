/**
 * useFullLabel — keeps floating event title labels visible while scrolling.
 * For major events with labelStyle='full', the .info-full element is translated
 * so the title text stays anchored to the left edge of the viewport.
 */
import type { Ref } from 'vue'

interface StageRef {
  stageEl: HTMLElement | null
}

const SIDEBAR_WIDTH = 220  // matches data/periods.ts:SIDEBAR_WIDTH (desktop)
const MIN_MARGIN    = 263  // min px from right before we stop sliding

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

export function useFullLabel(stageRef: Ref<StageRef | null>) {
  /**
   * @param scrollLeft  Canonical scroll position (zoom=1 pixel space)
   * @param zoom        Current zoom level (default 1). Divides the applied
   *                    translate so labels stay at the viewport edge even when
   *                    the stage has scaleX(zoom) applied.
   */
  function update(scrollLeft: number, zoom = 1) {
    const stage = stageRef.value?.stageEl
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
        label.style.transform = shift < eventWidth - MIN_MARGIN
          ? `translate3d(${shift / zoom}px,0,0)`
          : 'translate3d(0,0,0)'
      } else {
        label.style.transform = 'translate3d(0,0,0)'
      }
    })
  }

  return { update }
}
