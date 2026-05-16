<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS, PERIOD_BY_ID, STAGE_WIDTH, STAGE_HEIGHT, DATEBAR_HEIGHT, FOOTER_HEIGHT, SIDEBAR_WIDTH } from '@/data/periods'
import { useScroller } from '@/composables/useScroller'
import { useFullLabel } from '@/composables/useFullLabel'
import { withBase } from '@/utils/assetUrl'
import type { TimelineEvent } from '@/types/event'
import TimelineStage from './TimelineStage.vue'
import TimelineDateBar from './TimelineDateBar.vue'
import YearBubble from './YearBubble.vue'
import TimelineFooter from './TimelineFooter.vue'
import ArrowNav from './ArrowNav.vue'
import SidebarPanel from './SidebarPanel.vue'
import CanvasPointer from './CanvasPointer.vue'

const tlStore = useTimelineStore()
const router = useRouter()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<InstanceType<typeof TimelineStage> | null>(null)
const paperRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const bottomDatebarRef = ref<HTMLElement | null>(null)
const bottomDatebarColorRef = ref<HTMLElement | null>(null)

// ── Zoom ─────────────────────────────────────────────────────────────────────
const ZOOM_MIN  = 0.25
const ZOOM_MAX  = 4.0
const ZOOM_STEP = 0.25
const zoomLevel = ref(1.0)

const { update: updateLabels } = useFullLabel(stageRef as any)

// ── Active period derived values ─────────────────────────────────────────────
const activePeriodData = computed(() => PERIODS[tlStore.activePeriod - 1])
const activePeriodColor = computed(() => activePeriodData.value.color)

// Sidebar strip: all 13 sidebar images side by side; translateX to show active
const sidebarStripTranslate = computed(() =>
  `translate3d(${-(tlStore.activePeriod - 1) * SIDEBAR_WIDTH}px, 0, 0)`
)

// Scroller render: directly writes to DOM for 60fps performance.
// Y axis is enabled so the stage/paper drag vertically — the timeline
// has 14+ event rows on a 1440px canvas, more than fits in the viewport.
// The bottom date bar gets X-only transform so it stays pinned visually.
const { setDimensions, scrollTo, scrollBy } = useScroller(
  containerRef,
  (left, top) => {
    const z = zoomLevel.value
    // All scrollable layers share: scaleX(z) from left edge, then translate.
    // CSS right-to-left: translate3d first, then scaleX — equivalent to
    //   visual_x = stage_x * z - left, visual_y = stage_y - top
    // so events appear where they should at the given zoom + scroll.
    const tx = `scaleX(${z}) translate3d(${-left / z}px,${-top}px,0)`
    const txX = `scaleX(${z}) translate3d(${-left / z}px,0,0)`
    // Grid still parallaxes horizontally for depth; vertical scroll moves
    // it 1:1 so the row dividers stay aligned with the event cards.
    const txParallax = `scaleX(${z}) translate3d(${-(left / 3) / z}px,${-top}px,0)`

    const stageEl = stageRef.value?.stageEl
    if (stageEl) stageEl.style.transform = tx
    if (paperRef.value) paperRef.value.style.transform = tx
    if (gridRef.value)  gridRef.value.style.transform  = txParallax
    // Bottom date bar: X only — must remain pinned at the viewport bottom.
    if (bottomDatebarRef.value) bottomDatebarRef.value.style.transform = txX

    // Floating full-width labels (pass canonical scroll + zoom for correct offsets)
    updateLabels(left / z, z)

    // Coarse store update — pass canonical (zoom=1) scroll so year/period math works
    tlStore.setScroll(left / z)
  },
  { scrollingY: true, bouncing: true }
)

function init() {
  const el = containerRef.value
  if (!el) return
  // Ensure transform-origin is at the left edge so scaleX expands rightward
  const setOrigin = (e: HTMLElement | null) => { if (e) e.style.transformOrigin = '0 0' }
  setOrigin(stageRef.value?.stageEl ?? null)
  setOrigin(paperRef.value)
  setOrigin(gridRef.value)
  setOrigin(bottomDatebarRef.value)

  const w = el.clientWidth
  const h = el.clientHeight
  tlStore.setViewportWidth(w)
  setDimensions(w, h, STAGE_WIDTH * zoomLevel.value, STAGE_HEIGHT)
  const startPx = tlStore.scrollToPeriod(tlStore.activePeriod) * zoomLevel.value
  scrollTo(startPx, false)
}

// ── Date-bar color overlay on event hover ──────────────────────────────────
function applyOverlay(el: HTMLElement | null, left: number, width: number, color: string) {
  if (!el) return
  el.style.left = left + 'px'
  el.style.width = width + 'px'
  el.style.backgroundColor = color
  el.classList.add('active')
}
function clearOverlay() {
  bottomDatebarColorRef.value?.classList.remove('active')
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
  applyOverlay(bottomDatebarColorRef.value, left, hoverWidth, period.color)
}
function onStageMouseOut(e: MouseEvent) {
  const related = e.relatedTarget as HTMLElement | null
  if (!related || !related.closest('.tl-stage')) clearOverlay()
}

onMounted(() => {
  init()
  window.addEventListener('resize', init)
  window.addEventListener('keydown', onKey)
  const stage = document.querySelector('.tl-stage')
  if (stage) {
    stage.addEventListener('mousemove', onStageMouseMove as EventListener)
    stage.addEventListener('mouseout', onStageMouseOut as EventListener)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', init)
  window.removeEventListener('keydown', onKey)
  const stage = document.querySelector('.tl-stage')
  if (stage) {
    stage.removeEventListener('mousemove', onStageMouseMove as EventListener)
    stage.removeEventListener('mouseout', onStageMouseOut as EventListener)
  }
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
    <!-- z=2: Paper texture — primary cream backdrop, matches landing page.
         Height must equal STAGE_HEIGHT (not 100%) so the paper covers the
         full vertical extent as the stage drag-scrolls; otherwise the
         translated bottom edge rises into the viewport and exposes the
         dark void below. Same for the grid layer. -->
    <div
      ref="paperRef"
      class="tl-paper"
      :style="{
        width: STAGE_WIDTH + 'px',
        height: STAGE_HEIGHT + 'px',
        backgroundImage: `url('${withBase('css/img/paper-bg.jpg')}')`,
      }"
    />

    <!-- z=3: Grid overlay (parallax 1/3 speed) -->
    <div
      ref="gridRef"
      class="tl-grid"
      :style="{ width: STAGE_WIDTH + 'px', height: STAGE_HEIGHT + 'px' }"
    />

    <!-- Year bubble (fixed above the bottom date bar at viewport center) -->
    <YearBubble />

    <!-- Center line indicator -->
    <div
      class="absolute top-0 bottom-0 pointer-events-none z-[5]"
      style="left: 50%; width: 1px; background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.10) 10%, rgba(255,255,255,0.10) 90%, transparent 100%);"
    />

    <!-- Events stage (z=6 via tl-stage) -->
    <TimelineStage
      ref="stageRef"
      @event-click="onEventClick"
    />

    <!-- Canvas hover pointer overlay -->
    <CanvasPointer />

    <!-- z=10: Bottom date bar — cream textured background + per-event color overlay on hover -->
    <div
      ref="bottomDatebarRef"
      class="tl-datebar tl-datebar-bottom absolute left-0 z-10 pointer-events-none will-change-transform"
      :style="{
        bottom: '0',
        width: STAGE_WIDTH + 'px',
        height: DATEBAR_HEIGHT + 'px',
      }"
    >
      <div ref="bottomDatebarColorRef" class="tl-datebar-color" />
      <TimelineDateBar :flip="true" />
    </div>

    <!-- z=20: Sidebar strip — 220px viewport, inner strip has all 13 images side by side.
         Hidden on mobile (< md) so the canvas can fill the viewport. -->
    <div class="tl-sidebar-viewport">
      <div
        class="tl-sidebar-strip"
        :style="{ transform: sidebarStripTranslate, transition: 'transform 0.2s ease-in-out' }"
      >
        <SidebarPanel
          v-for="p in PERIODS"
          :key="p.id"
          :period-id="p.id"
          :active="p.id === tlStore.activePeriod"
        />
      </div>
    </div>

    <!-- Mobile period name chip (< md): replaces the hidden sidebar so the
         user always knows which period they're viewing. -->
    <div
      v-if="activePeriodData"
      class="tl-mobile-period-chip md:hidden"
      :style="{ background: activePeriodColor }"
      data-testid="tl-mobile-period-chip"
    >
      {{ $i18n.locale === 'ka' ? activePeriodData.nameKa : activePeriodData.nameEn }}
    </div>

    <!-- Scroll arrows -->
    <ArrowNav
      @left="scrollBy(-400)"
      @right="scrollBy(400)"
    />

    <!-- Zoom controls (bottom-right, clear of sidebar at 220px on md+, flush right on mobile) -->
    <div class="tl-zoom-controls absolute bottom-3 z-30 flex flex-col items-center gap-1 pointer-events-auto">
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
/* Date bar: flat cream background with a single neutral border line per bar.
   The active period color is shown only as an overlay on event hover. */
.tl-datebar {
  background: #eef0e7;
}
.tl-datebar-top    { border-bottom: 1px solid #828076; }
.tl-datebar-bottom { border-top:    1px solid #828076; }
.tl-datebar-color {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  opacity: 0;
  pointer-events: none;
  z-index: 1;
  transition: opacity 200ms ease, background-color 200ms ease;
}
.tl-datebar-color.active { opacity: 0.85; }

/* Zoom controls position: clear of the 220px sidebar on md+, flush right on mobile */
.tl-zoom-controls {
  right: 8px;
}
@media (max-width: 767px) {
  .tl-zoom-controls {
    right: 8px;
  }
}

/* Mobile period chip: small floating pill with the active period name */
.tl-mobile-period-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 25;
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  max-width: 70vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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
