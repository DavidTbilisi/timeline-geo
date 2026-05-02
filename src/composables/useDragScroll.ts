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

    el.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return

    const dx = e.clientX - startX
    totalMoved = Math.abs(dx)
    setOffset(startOffset - dx)

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      // Normalise velocity to one ~16ms frame so friction is frame-rate independent
      velocityX = -(e.clientX - lastX) / dt * 16
    }
    lastX = e.clientX
    lastTime = now
    e.preventDefault()
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDragging.value) return
    isDragging.value = false

    if (totalMoved > DRAG_THRESHOLD) {
      suppressNextClick = true
      startMomentum()
    }

    const el = containerRef.value
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
  }

  function onPointerCancel(e: PointerEvent) {
    isDragging.value = false
    const el = containerRef.value
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId)
    }
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
    el.addEventListener('pointerdown',   onPointerDown,  { passive: false })
    el.addEventListener('pointermove',   onPointerMove,  { passive: false })
    el.addEventListener('pointerup',     onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)
    // Capture phase so we intercept click before child handlers
    el.addEventListener('click',         onClickCapture, { capture: true })
  }

  function unmount() {
    cancelMomentum()
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('pointerdown',   onPointerDown)
    el.removeEventListener('pointermove',   onPointerMove)
    el.removeEventListener('pointerup',     onPointerUp)
    el.removeEventListener('pointercancel', onPointerCancel)
    el.removeEventListener('click',         onClickCapture, { capture: true })
  }

  onUnmounted(unmount)

  return { isDragging, mount, unmount }
}
