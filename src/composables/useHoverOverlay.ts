/**
 * useHoverOverlay — drives the bottom date-bar color overlay when the
 * user hovers an event card on the stage.
 *
 * The mousemove listener is attached at the stage level (one delegated
 * listener, not per-card) for performance — there can be 200+ cards in
 * view. Each card publishes its left position via inline `style.left`
 * (already needed for layout) and its hover-band width via a
 * `data-hover-width` attribute. The stage-level listener reads those
 * back rather than receiving them through events; keep the data-attr
 * channel intentional unless this becomes per-card hover handling.
 */
import { onMounted, onUnmounted } from 'vue'
import { PERIOD_BY_ID } from '@/data/periods'
import { useTimelineStore } from '@/stores/timeline'

export function useHoverOverlay(
  getStageEl: () => HTMLElement | null,
  getOverlayEl: () => HTMLElement | null,
) {
  const tlStore = useTimelineStore()

  function applyOverlay(left: number, width: number, color: string) {
    const el = getOverlayEl()
    if (!el) return
    el.style.left = left + 'px'
    el.style.width = width + 'px'
    el.style.backgroundColor = color
    el.classList.add('active')
    tlStore.setHoverRange({ startPx: left, endPx: left + width })
  }

  function clearOverlay() {
    getOverlayEl()?.classList.remove('active')
    tlStore.clearHoverRange()
  }

  function onStageMouseMove(e: MouseEvent) {
    const target = e.target as HTMLElement | null
    const card = target?.closest('.tl-event') as HTMLElement | null
    if (!card) { clearOverlay(); return }
    const left = parseFloat(card.style.left) || 0
    const hoverWidth = parseFloat(card.dataset.hoverWidth || '0')
    const periodId = parseInt(card.dataset.period || '0', 10)
    const period = PERIOD_BY_ID[periodId]
    if (!period || hoverWidth <= 0) { clearOverlay(); return }
    applyOverlay(left, hoverWidth, period.color)
  }

  function onStageMouseOut(e: MouseEvent) {
    const related = e.relatedTarget as HTMLElement | null
    // Only clear when the cursor has left the stage entirely.
    if (!related || !related.closest('.tl-stage')) clearOverlay()
  }

  onMounted(() => {
    const stage = getStageEl()
    if (!stage) return
    stage.addEventListener('mousemove', onStageMouseMove as EventListener)
    stage.addEventListener('mouseout', onStageMouseOut as EventListener)
  })

  onUnmounted(() => {
    const stage = getStageEl()
    if (!stage) return
    stage.removeEventListener('mousemove', onStageMouseMove as EventListener)
    stage.removeEventListener('mouseout', onStageMouseOut as EventListener)
  })
}
