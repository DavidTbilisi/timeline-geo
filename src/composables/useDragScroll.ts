/**
 * useDragScroll — pointer-events drag scroll with momentum decay.
 *
 * Designed for a container that holds a wider inner element positioned via
 * CSS transform (translateX). The caller passes a getter/setter pair so this
 * composable stays agnostic of whether the actual scroll is via scrollLeft or
 * a CSS transform.
 *
 * Momentum: velocity *= FRICTION each frame, stops when |velocity| < MIN_V.
 * Click suppression: if the pointer moves > DRAG_THRESHOLD px before release
 * the next click event on any child is cancelled once.
 */

import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const FRICTION = 0.95
const MIN_V = 0.1
const DRAG_THRESHOLD = 5   // px — below this a tap is treated as a click

export function useDragScroll(
  containerRef: Ref<HTMLElement | null>,
  /** Return current scroll offset (px, positive = scrolled right) */
  getOffset: () => number,
  /** Apply a new scroll offset (clamped by caller if desired) */
  setOffset: (x: number) => void,
) {
  const isDragging = ref(false)

  let startX = 0
  let startOffset = 0
  let lastX = 0
  let lastTime = 0
  let velocityX = 0
  let totalMoved = 0
  let rafId = 0
  let suppressNextClick = false

  // ── helpers ────────────────────────────────────────────────────────────────

  function cancelMomentum() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function startMomentum() {
    cancelMomentum()
    if (Math.abs(velocityX) < MIN_V) return

    function step() {
      velocityX *= FRICTION
      setOffset(getOffset() + velocityX)
      if (Math.abs(velocityX) >= MIN_V) {
        rafId = requestAnimationFrame(step)
      }
    }
    rafId = requestAnimationFrame(step)
  }

  // ── pointer handlers ───────────────────────────────────────────────────────

  function onPointerDown(e: PointerEvent) {
    // Only respond to primary button / single touch
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const el = containerRef.value
    if (!el) return

    cancelMomentum()
    isDragging.value = true
    startX = e.clientX
    startOffset = getOffset()
    lastX = e.clientX
    lastTime = Date.now()
    velocityX = 0
    totalMoved = 0

    // Deliberately not calling setPointerCapture — that would re-target the
    // synthetic click event to the container, breaking child @click handlers
    // (e.g. period card navigation). Drag is tracked via document-level move/up
    // listeners attached on demand below.
    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup', onPointerUp, { passive: false })
    document.addEventListener('pointercancel', onPointerCancel, { passive: false })
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return

    const dx = e.clientX - startX
    totalMoved = Math.abs(dx)
    // Only start scrolling once we've moved past the drag threshold so a tiny
    // jitter on click doesn't shift the page and visually swallow the click.
    if (totalMoved > DRAG_THRESHOLD) {
      setOffset(startOffset - dx)
    }

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      velocityX = -(e.clientX - lastX) / dt * 16
    }
    lastX = e.clientX
    lastTime = now
    if (totalMoved > DRAG_THRESHOLD) {
      e.preventDefault()
    }
  }

  function detachDocListeners() {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('pointercancel', onPointerCancel)
  }

  function onPointerUp(_e: PointerEvent) {
    if (!isDragging.value) return
    isDragging.value = false
    detachDocListeners()

    if (totalMoved > DRAG_THRESHOLD) {
      suppressNextClick = true
      startMomentum()
    }
  }

  function onPointerCancel(_e: PointerEvent) {
    isDragging.value = false
    detachDocListeners()
  }

  function onClickCapture(e: MouseEvent) {
    if (suppressNextClick) {
      suppressNextClick = false
      e.stopPropagation()
      e.preventDefault()
    }
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────

  function mount() {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown, { passive: false })
    // Capture phase so we intercept click before child handlers
    el.addEventListener('click', onClickCapture, { capture: true })
  }

  function unmount() {
    cancelMomentum()
    detachDocListeners()
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('click', onClickCapture, { capture: true })
  }

  onUnmounted(unmount)

  return { isDragging, mount, unmount }
}
