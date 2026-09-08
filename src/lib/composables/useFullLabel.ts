/**
 * useFullLabel — keeps floating event title labels visible while scrolling.
 * For major events rendered as bars (`bar: true`), the .info-full element is translated
 * so the title text stays anchored to the left edge of the viewport.
 */
import type { Ref } from 'vue'

interface StageRef {
  stageEl: HTMLElement | null
}

export interface FullLabelOptions {
  /** Width of the sidebar that covers the viewport's right edge on desktop (px). */
  sidebarWidth?: number
  /** Min px from the bar's right edge before the label stops sliding. */
  minMargin?: number
  /** Viewport width at or below which the sidebar is hidden (px). */
  mobileMaxWidth?: number
}

export function useFullLabel(stageRef: Ref<StageRef | null>, options: FullLabelOptions = {}) {
  const sidebarWidth = options.sidebarWidth ?? 220
  const MIN_MARGIN = options.minMargin ?? 263
  const mobileMaxWidth = options.mobileMaxWidth ?? 767

  /**
   * Returns the visual offset where labels should start sliding.
   * On desktop the sidebar covers the right edge so labels slide once they
   * reach `scrollLeft + sidebarWidth`. On mobile the sidebar is hidden via
   * CSS, so labels can slide all the way to the viewport edge — offset 0.
   */
  function menuOffset(): number {
    if (typeof window === 'undefined') return sidebarWidth
    return window.matchMedia(`(max-width: ${mobileMaxWidth}px)`).matches ? 0 : sidebarWidth
  }

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
