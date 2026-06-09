/**
 * useTimelineTransforms — owns the 60fps DOM-transform pipeline for the
 * timeline's scrollable layers. The render callback is intentionally
 * outside Vue's reactivity loop: per-frame updates to six style.transform
 * strings would thrash the scheduler.
 *
 * Layer behaviors (all share `transform-origin: 0 0`):
 *   - stage + paper: full scaleX(zoom) translate3d(x, y, 0)
 *   - grid:          horizontal parallax at 1/3 speed; vertical 1:1
 *   - bottom datebar: X-only translate so it stays pinned at the viewport bottom
 *
 * The canonical (zoom=1) scroll position is forwarded via `onCanonicalScroll`
 * so the store's year/period math reads the same coordinate space as the
 * underlying data.
 */
import type { Ref } from 'vue'
import { useScroller } from './useScroller'

export interface TimelineLayerRefs {
  containerRef: Ref<HTMLElement | null>
  /** Getter for the stage element — passed as a getter so the caller can
   *  source it from a child-component ref without prop-drilling shape. */
  getStageEl: () => HTMLElement | null
  paperRef: Ref<HTMLElement | null>
  gridRef: Ref<HTMLElement | null>
  bottomDatebarRef: Ref<HTMLElement | null>
}

export function useTimelineTransforms(
  refs: TimelineLayerRefs,
  zoom: Ref<number>,
  onCanonicalScroll: (left: number) => void,
) {
  return useScroller(
    refs.containerRef,
    (left, top) => {
      const z = zoom.value
      // CSS right-to-left composition: translate3d first, then scaleX —
      // i.e. visual_x = stage_x * z - left, visual_y = stage_y - top.
      const tx = `scaleX(${z}) translate3d(${-left / z}px,${-top}px,0)`
      const txX = `scaleX(${z}) translate3d(${-left / z}px,0,0)`
      // Grid: horizontal parallax for depth; vertical 1:1 so row dividers
      // stay aligned with the event cards.
      const txParallax = `scaleX(${z}) translate3d(${-(left / 3) / z}px,${-top}px,0)`

      const stageEl = refs.getStageEl()
      if (stageEl) stageEl.style.transform = tx
      if (refs.paperRef.value) refs.paperRef.value.style.transform = tx
      if (refs.gridRef.value) refs.gridRef.value.style.transform = txParallax
      // Bottom date bar: X-only — must remain pinned at the viewport bottom.
      if (refs.bottomDatebarRef.value) refs.bottomDatebarRef.value.style.transform = txX

      onCanonicalScroll(left / z)
    },
    { scrollingY: true, bouncing: true },
  )
}
