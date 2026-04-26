<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { STAGE_WIDTH, STAGE_HEIGHT, DATEBAR_HEIGHT, FOOTER_HEIGHT } from '@/data/periods'
import { useScroller } from '@/composables/useScroller'
import { useFullLabel } from '@/composables/useFullLabel'
import type { TimelineEvent } from '@/types/event'
import TimelineStage from './TimelineStage.vue'
import TimelineDateBar from './TimelineDateBar.vue'
import YearBubble from './YearBubble.vue'
import TimelineFooter from './TimelineFooter.vue'
import ArrowNav from './ArrowNav.vue'
import SidebarPanel from './SidebarPanel.vue'

const tlStore = useTimelineStore()
const router = useRouter()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<InstanceType<typeof TimelineStage> | null>(null)
const paperRef = ref<HTMLElement | null>(null)
const topDatebarRef = ref<HTMLElement | null>(null)
const bottomDatebarRef = ref<HTMLElement | null>(null)

// ── Zoom ─────────────────────────────────────────────────────────────────────
const ZOOM_MIN  = 0.25
const ZOOM_MAX  = 4.0
const ZOOM_STEP = 0.25
const zoomLevel = ref(1.0)

const { update: updateLabels } = useFullLabel(stageRef as any)

// Scroller render: directly writes to DOM for 60fps performance
const { setDimensions, scrollTo, scrollBy } = useScroller(
  containerRef,
  (left, _top) => {
    const z = zoomLevel.value
    // All scrollable layers share: scaleX(z) from left edge, then translate.
    // CSS right-to-left: translate3d first, then scaleX — equivalent to
    //   visual position = stageX * z - left
    // so events appear where they should at the given zoom.
    const tx = `scaleX(${z}) translate3d(${-left / z}px,0,0)`

    const stageEl = stageRef.value?.stageEl
    if (stageEl) stageEl.style.transform = tx
    if (paperRef.value) paperRef.value.style.transform =
      `scaleX(${z}) translate3d(${-(left / 3) / z}px,0,0)`
    if (topDatebarRef.value)    topDatebarRef.value.style.transform    = tx
    if (bottomDatebarRef.value) bottomDatebarRef.value.style.transform = tx

    // Floating full-width labels (pass canonical scroll + zoom for correct offsets)
    updateLabels(left / z, z)

    // Coarse store update — pass canonical (zoom=1) scroll so year/period math works
    tlStore.setScroll(left / z)
  },
  { scrollingY: false, bouncing: true }
)

function init() {
  const el = containerRef.value
  if (!el) return
  // Ensure transform-origin is at the left edge so scaleX expands rightward
  const setOrigin = (e: HTMLElement | null) => { if (e) e.style.transformOrigin = '0 0' }
  setOrigin(stageRef.value?.stageEl ?? null)
  setOrigin(paperRef.value)
  setOrigin(topDatebarRef.value)
  setOrigin(bottomDatebarRef.value)

  const w = el.clientWidth
  const h = el.clientHeight
  tlStore.setViewportWidth(w)
  setDimensions(w, h, STAGE_WIDTH * zoomLevel.value, STAGE_HEIGHT)
  const startPx = tlStore.scrollToPeriod(tlStore.activePeriod) * zoomLevel.value
  scrollTo(startPx, false)
}

onMounted(() => {
  init()
  window.addEventListener('resize', init)
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('resize', init)
  window.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  // Skip zoom shortcuts if typing in an input
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'ArrowLeft')             scrollBy(-300)
  if (e.key === 'ArrowRight')            scrollBy(300)
  if (e.key === '+' || e.key === '=')    changeZoom(ZOOM_STEP)
  if (e.key === '-' || e.key === '_')    changeZoom(-ZOOM_STEP)
}

// ── Zoom ─────────────────────────────────────────────────────────────────────
function changeZoom(delta: number) {
  const el = containerRef.value
  if (!el) return
  const oldZoom = zoomLevel.value
  const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((oldZoom + delta) * 100) / 100))
  if (newZoom === oldZoom) return

  // Preserve the canonical scroll center
  const canonicalLeft = tlStore.scrollLeft  // already in zoom=1 space
  zoomLevel.value = newZoom

  const w = el.clientWidth
  const h = el.clientHeight
  setDimensions(w, h, STAGE_WIDTH * newZoom, STAGE_HEIGHT)
  scrollTo(canonicalLeft * newZoom, false)
}

// ── Period navigation ─────────────────────────────────────────────────────────
// Prevent setScroll period-detection from re-triggering programmatic scroll
let scrollingToPeriod = false

// Period footer dot clicks / handleRoute → scroll to that period
watch(() => tlStore.activePeriod, (p) => {
  if (scrollingToPeriod) return   // ignore scroll-detection updates during animation
  const startPx = tlStore.scrollToPeriod(p) * zoomLevel.value
  const diff = Math.abs(tlStore.scrollLeft * zoomLevel.value - startPx)
  if (diff > 500) {
    scrollingToPeriod = true
    scrollTo(startPx, true)
    // Zynga Scroller animation is ~250ms; allow 800ms buffer before re-enabling detection
    setTimeout(() => { scrollingToPeriod = false }, 800)
  }
})

function onEventClick(event: TimelineEvent) {
  tlStore.openEvent(event.slug)
  router.push(`/event/${event.slug}`)
}
</script>

<template>
  <div
    ref="containerRef"
    class="absolute overflow-hidden cursor-grab active:cursor-grabbing select-none bg-stone-950"
    :style="{
      top: '50px',
      left: '0', right: '0',
      bottom: FOOTER_HEIGHT + 'px',
    }"
  >
    <!-- Sidebar panel -->
    <SidebarPanel class="absolute left-0 top-0 bottom-0 z-20 pointer-events-none" />

    <!-- Paper background (parallax 1/3 speed) -->
    <div
      ref="paperRef"
      class="tl-paper"
      :style="{
        width: STAGE_WIDTH + 'px',
        backgroundImage: `url('/css/img/paper-bg.jpg')`,
      }"
    />

    <!-- Top date bar -->
    <div
      ref="topDatebarRef"
      class="tl-datebar border-b border-white/10"
      :style="{ width: STAGE_WIDTH + 'px', height: DATEBAR_HEIGHT + 'px' }"
    >
      <TimelineDateBar :flip="false" />
    </div>

    <!-- Year bubble (fixed to center of viewport) -->
    <YearBubble />

    <!-- Center line indicator -->
    <div
      class="absolute top-0 bottom-0 pointer-events-none z-[5]"
      style="left: 50%; width: 1px; background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.10) 10%, rgba(255,255,255,0.10) 90%, transparent 100%);"
    />

    <!-- Events stage -->
    <TimelineStage
      ref="stageRef"
      @event-click="onEventClick"
    />

    <!-- Bottom date bar -->
    <div
      ref="bottomDatebarRef"
      class="tl-datebar-bottom absolute left-0 border-t border-white/10 z-10 pointer-events-none will-change-transform"
      :style="{
        bottom: '0',
        width: STAGE_WIDTH + 'px',
        height: DATEBAR_HEIGHT + 'px',
        background: 'rgba(8, 8, 8, 0.88)',
      }"
    >
      <TimelineDateBar :flip="true" />
    </div>

    <!-- Scroll arrows -->
    <ArrowNav
      @left="scrollBy(-400)"
      @right="scrollBy(400)"
    />

    <!-- Zoom controls (bottom-right, clear of the right arrow at center) -->
    <div class="absolute bottom-3 right-3 z-30 flex flex-col items-center gap-1 pointer-events-auto">
      <button
        class="zoom-btn"
        :disabled="zoomLevel >= ZOOM_MAX"
        :title="$t('timeline.zoomIn')"
        @click="changeZoom(ZOOM_STEP)"
      >+</button>
      <span class="text-white/60 text-xs font-mono tabular-nums select-none">
        {{ Math.round(zoomLevel * 100) }}%
      </span>
      <button
        class="zoom-btn"
        :disabled="zoomLevel <= ZOOM_MIN"
        :title="$t('timeline.zoomOut')"
        @click="changeZoom(-ZOOM_STEP)"
      >−</button>
    </div>
  </div>

  <!-- Period footer bar -->
  <TimelineFooter
    class="absolute bottom-0 left-0 right-0"
    :style="{ height: FOOTER_HEIGHT + 'px' }"
  />
</template>

<style scoped>
.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
  line-height: 1;
  user-select: none;
}
.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}
.zoom-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
