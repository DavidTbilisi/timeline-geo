/**
 * useScroller — horizontal momentum scroll composable
 * Replaces the Zynga Scroller with a lightweight equivalent.
 * The render callback is called directly (bypassing Vue reactivity)
 * for 60fps performance.
 */
import { onMounted, onUnmounted, shallowRef } from 'vue'
import type { Ref } from 'vue'

interface ScrollerOptions {
  scrollingY?: boolean
  bouncing?: boolean
}

export function useScroller(
  containerRef: Ref<HTMLElement | null>,
  onRender: (left: number, top: number) => void,
  _options: ScrollerOptions = {}
) {
  const scrollLeft = shallowRef(0)
  const scrollTop = shallowRef(0)

  let contentWidth = 0
  let contentHeight = 0
  let clientWidth = 0
  let clientHeight = 0
  let maxLeft = 0

  // Drag state
  let dragging = false
  let startX = 0
  let startScrollLeft = 0
  let lastX = 0
  let lastTime = 0
  let velocityX = 0

  // Momentum animation
  let rafId = 0
  let isAnimating = false
  const FRICTION = 0.94
  const BOUNCE_FRICTION = 0.85
  const MIN_VELOCITY = 0.5

  function clamp(v: number, min: number, max: number) {
    return Math.min(Math.max(v, min), max)
  }

  function setDimensions(cw: number, ch: number, sw: number, sh: number) {
    clientWidth = cw
    clientHeight = ch
    contentWidth = sw
    contentHeight = sh
    maxLeft = Math.max(0, sw - cw)
    // Only re-render if the scroll position actually needs clamping into
    // the new bounds. Without this, an initial setDimensions call would
    // fire a render(0) → onRender(0) round-trip even though nothing moved,
    // which downstream (TimelineView's setScroll) misinterprets as a
    // navigation to scroll=0 and resets the active period to 1. See #58.
    const clamped = clamp(scrollLeft.value, 0, maxLeft)
    if (clamped !== scrollLeft.value) {
      scrollTo(clamped, false)
    }
  }

  function render(left: number, top: number) {
    scrollLeft.value = left
    scrollTop.value = top
    onRender(left, top)
  }

  function scrollTo(x: number, animate = true) {
    cancelMomentum()
    const target = clamp(x, 0, maxLeft)
    if (!animate || Math.abs(target - scrollLeft.value) < 1) {
      render(target, 0)
      return
    }
    // Ease to target
    let start = scrollLeft.value
    const dist = target - start
    const dur = 350
    const startTime = performance.now()
    function step(now: number) {
      const t = Math.min((now - startTime) / dur, 1)
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      render(start + dist * ease, 0)
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        isAnimating = false
      }
    }
    isAnimating = true
    rafId = requestAnimationFrame(step)
  }

  function scrollBy(dx: number, animate = true) {
    scrollTo(scrollLeft.value + dx, animate)
  }

  function cancelMomentum() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    isAnimating = false
  }

  function startMomentum() {
    cancelMomentum()
    if (Math.abs(velocityX) < MIN_VELOCITY) return

    function step() {
      velocityX *= FRICTION
      let next = scrollLeft.value - velocityX

      // Bounce at boundaries
      if (next < 0) {
        next = 0
        velocityX *= -BOUNCE_FRICTION
      } else if (next > maxLeft) {
        next = maxLeft
        velocityX *= -BOUNCE_FRICTION
      }

      render(next, 0)

      if (Math.abs(velocityX) > MIN_VELOCITY) {
        rafId = requestAnimationFrame(step)
      } else {
        isAnimating = false
      }
    }
    isAnimating = true
    rafId = requestAnimationFrame(step)
  }

  // ── Mouse events ──
  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    cancelMomentum()
    dragging = true
    startX = e.clientX
    startScrollLeft = scrollLeft.value
    lastX = e.clientX
    lastTime = Date.now()
    velocityX = 0
    e.preventDefault()
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return
    const dx = e.clientX - startX
    const next = clamp(startScrollLeft - dx, 0, maxLeft)
    render(next, 0)

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      velocityX = (e.clientX - lastX) / dt * 16 // normalize to ~16ms frame
    }
    lastX = e.clientX
    lastTime = now
  }

  function onMouseUp(_e: MouseEvent) {
    if (!dragging) return
    dragging = false
    startMomentum()
  }

  // ── Touch events ──
  function onTouchStart(e: TouchEvent) {
    cancelMomentum()
    dragging = true
    startX = e.touches[0].clientX
    startScrollLeft = scrollLeft.value
    lastX = startX
    lastTime = Date.now()
    velocityX = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return
    const dx = e.touches[0].clientX - startX
    const next = clamp(startScrollLeft - dx, 0, maxLeft)
    render(next, 0)

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      velocityX = (e.touches[0].clientX - lastX) / dt * 16
    }
    lastX = e.touches[0].clientX
    lastTime = now
    e.preventDefault()
  }

  function onTouchEnd(_e: TouchEvent) {
    if (!dragging) return
    dragging = false
    startMomentum()
  }

  // ── Mouse wheel ──
  function onWheel(e: WheelEvent) {
    cancelMomentum()
    const delta = e.deltaX !== 0 ? e.deltaX : -e.deltaY
    const next = clamp(scrollLeft.value + delta * 1.5, 0, maxLeft)
    render(next, 0)
    e.preventDefault()
  }

  onMounted(() => {
    const el = containerRef.value
    if (!el) return
    el.addEventListener('mousedown', onMouseDown, { passive: false })
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
  })

  onUnmounted(() => {
    cancelMomentum()
    const el = containerRef.value
    if (!el) return
    el.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('wheel', onWheel)
  })

  return { scrollLeft, scrollTop, setDimensions, scrollTo, scrollBy }
}
