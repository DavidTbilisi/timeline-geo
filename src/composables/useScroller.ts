/**
 * useScroller — momentum scroll composable (X-axis always; Y-axis when
 * `scrollingY: true` is passed). Replaces the Zynga Scroller with a
 * lightweight equivalent. The render callback is called directly
 * (bypassing Vue reactivity) for 60fps performance.
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
  options: ScrollerOptions = {}
) {
  const scrollingY = !!options.scrollingY
  const scrollLeft = shallowRef(0)
  const scrollTop = shallowRef(0)

  let contentWidth = 0
  let contentHeight = 0
  let clientWidth = 0
  let clientHeight = 0
  let maxLeft = 0
  let maxTop = 0

  // Drag state
  let dragging = false
  let startX = 0
  let startY = 0
  let startScrollLeft = 0
  let startScrollTop = 0
  let lastX = 0
  let lastY = 0
  let lastTime = 0
  let velocityX = 0
  let velocityY = 0

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
    maxTop = Math.max(0, sh - ch)
    // Only re-render if the scroll position actually needs clamping into
    // the new bounds. Without this, an initial setDimensions call would
    // fire a render(0) → onRender(0) round-trip even though nothing moved,
    // which downstream (TimelineView's setScroll) misinterprets as a
    // navigation to scroll=0 and resets the active period to 1. See #58.
    const clampedX = clamp(scrollLeft.value, 0, maxLeft)
    const clampedY = scrollingY ? clamp(scrollTop.value, 0, maxTop) : 0
    if (clampedX !== scrollLeft.value || clampedY !== scrollTop.value) {
      render(clampedX, clampedY)
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
    const currentTop = scrollTop.value
    if (!animate || Math.abs(target - scrollLeft.value) < 1) {
      render(target, currentTop)
      return
    }
    // Ease to target — only animates the X axis; Y is preserved.
    let start = scrollLeft.value
    const dist = target - start
    const dur = 350
    const startTime = performance.now()
    function step(now: number) {
      const t = Math.min((now - startTime) / dur, 1)
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      render(start + dist * ease, currentTop)
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
    if (
      Math.abs(velocityX) < MIN_VELOCITY &&
      Math.abs(velocityY) < MIN_VELOCITY
    ) return

    function step() {
      velocityX *= FRICTION
      let nextX = scrollLeft.value - velocityX
      if (nextX < 0) { nextX = 0; velocityX *= -BOUNCE_FRICTION }
      else if (nextX > maxLeft) { nextX = maxLeft; velocityX *= -BOUNCE_FRICTION }

      let nextY = scrollTop.value
      if (scrollingY) {
        velocityY *= FRICTION
        nextY = scrollTop.value - velocityY
        if (nextY < 0) { nextY = 0; velocityY *= -BOUNCE_FRICTION }
        else if (nextY > maxTop) { nextY = maxTop; velocityY *= -BOUNCE_FRICTION }
      }

      render(nextX, nextY)

      if (
        Math.abs(velocityX) > MIN_VELOCITY ||
        (scrollingY && Math.abs(velocityY) > MIN_VELOCITY)
      ) {
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
    startY = e.clientY
    startScrollLeft = scrollLeft.value
    startScrollTop = scrollTop.value
    lastX = e.clientX
    lastY = e.clientY
    lastTime = Date.now()
    velocityX = 0
    velocityY = 0
    e.preventDefault()
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const nextX = clamp(startScrollLeft - dx, 0, maxLeft)
    const nextY = scrollingY ? clamp(startScrollTop - dy, 0, maxTop) : 0
    render(nextX, nextY)

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      velocityX = (e.clientX - lastX) / dt * 16 // normalize to ~16ms frame
      if (scrollingY) velocityY = (e.clientY - lastY) / dt * 16
    }
    lastX = e.clientX
    lastY = e.clientY
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
    startY = e.touches[0].clientY
    startScrollLeft = scrollLeft.value
    startScrollTop = scrollTop.value
    lastX = startX
    lastY = startY
    lastTime = Date.now()
    velocityX = 0
    velocityY = 0
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging) return
    const dx = e.touches[0].clientX - startX
    const dy = e.touches[0].clientY - startY
    const nextX = clamp(startScrollLeft - dx, 0, maxLeft)
    const nextY = scrollingY ? clamp(startScrollTop - dy, 0, maxTop) : 0
    render(nextX, nextY)

    const now = Date.now()
    const dt = now - lastTime
    if (dt > 0) {
      velocityX = (e.touches[0].clientX - lastX) / dt * 16
      if (scrollingY) velocityY = (e.touches[0].clientY - lastY) / dt * 16
    }
    lastX = e.touches[0].clientX
    lastY = e.touches[0].clientY
    lastTime = now
    e.preventDefault()
  }

  function onTouchEnd(_e: TouchEvent) {
    if (!dragging) return
    dragging = false
    startMomentum()
  }

  // ── Mouse wheel ──
  // Vertical wheel scrolls horizontally on the timeline (matches the
  // reference site's primary navigation axis) unless `shift` is held —
  // shift+wheel scrolls vertically when Y is enabled. Horizontal wheel
  // (trackpad gesture) always maps to X.
  function onWheel(e: WheelEvent) {
    cancelMomentum()
    if (scrollingY && e.shiftKey && e.deltaY !== 0) {
      const nextY = clamp(scrollTop.value + e.deltaY * 1.5, 0, maxTop)
      render(scrollLeft.value, nextY)
    } else {
      const delta = e.deltaX !== 0 ? e.deltaX : -e.deltaY
      const nextX = clamp(scrollLeft.value + delta * 1.5, 0, maxLeft)
      render(nextX, scrollTop.value)
    }
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
