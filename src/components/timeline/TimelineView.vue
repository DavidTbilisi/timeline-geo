<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { PERIODS, STAGE_WIDTH, STAGE_HEIGHT, DATEBAR_HEIGHT, FOOTER_HEIGHT, SIDEBAR_WIDTH } from '@/data/periods'
import { useFullLabel } from '@/composables/useFullLabel'
import { useTimelineTransforms } from '@/composables/useTimelineTransforms'
import { useHoverOverlay } from '@/composables/useHoverOverlay'
import { usePeriodCopy } from '@/composables/usePeriodCopy'
import { withBase } from '@/utils/assetUrl'
import type { TimelineEvent } from '@/types/event'
import TimelineStage from './TimelineStage.vue'
import TimelineDateBar from './TimelineDateBar.vue'
import YearBubble from './YearBubble.vue'
import TimelineFooter from './TimelineFooter.vue'
import ArrowNav from './ArrowNav.vue'
import SidebarPanel from './SidebarPanel.vue'
import CanvasPointer from './CanvasPointer.vue'
import ZoomControls from './ZoomControls.vue'

const tlStore = useTimelineStore()
const router = useRouter()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<InstanceType<typeof TimelineStage> | null>(null)
const paperRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const bottomDatebarRef = ref<HTMLElement | null>(null)
const bottomDatebarColorRef = ref<HTMLElement | null>(null)

// ── Zoom state ──────────────────────────────────────────────────────────────
const ZOOM_MIN  = 0.25
const ZOOM_MAX  = 4.0
const ZOOM_STEP = 0.25
const zoomLevel = ref(1.0)

const { update: updateLabels } = useFullLabel(() => stageRef.value?.stageEl ?? null)

// ── Active period derived values ────────────────────────────────────────────
const activePeriodData = computed(() => PERIODS[tlStore.activePeriod - 1])
const activePeriodColor = computed(() => activePeriodData.value.color)
const { name: periodName } = usePeriodCopy()
const activePeriodName = computed(() => periodName(activePeriodData.value?.slug))

// Sidebar strip: all 13 sidebar images side by side; translateX shows active.
const sidebarStripTranslate = computed(() =>
  `translate3d(${-(tlStore.activePeriod - 1) * SIDEBAR_WIDTH}px, 0, 0)`,
)

// ── Scroll / transform pipeline ─────────────────────────────────────────────
const { setDimensions, scrollTo, scrollBy } = useTimelineTransforms(
  {
    containerRef,
    getStageEl: () => stageRef.value?.stageEl ?? null,
    paperRef,
    gridRef,
    bottomDatebarRef,
  },
  zoomLevel,
  (canonicalLeft) => {
    updateLabels(canonicalLeft, zoomLevel.value)
    tlStore.setScroll(canonicalLeft)
  },
)

// ── Date-bar color overlay on event hover ───────────────────────────────────
useHoverOverlay(
  () => stageRef.value?.stageEl ?? null,
  () => bottomDatebarColorRef.value,
)

function init() {
  const el = containerRef.value
  if (!el) return
  // Ensure transform-origin is at the left edge so scaleX expands rightward.
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
  // Skip shortcuts when typing in an input.
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'ArrowLeft')          scrollBy(-300)
  if (e.key === 'ArrowRight')         scrollBy(300)
  if (e.key === '+' || e.key === '=') changeZoom(ZOOM_STEP)
  if (e.key === '-' || e.key === '_') changeZoom(-ZOOM_STEP)
}

// ── Zoom math (drives the scroller's dimensions + canonical scroll) ─────────
function changeZoom(delta: number) {
  const el = containerRef.value
  if (!el) return
  const oldZoom = zoomLevel.value
  const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((oldZoom + delta) * 100) / 100))
  if (newZoom === oldZoom) return

  // Preserve the canonical scroll center (already in zoom=1 space).
  const canonicalLeft = tlStore.scrollLeft
  zoomLevel.value = newZoom

  const w = el.clientWidth
  const h = el.clientHeight
  setDimensions(w, h, STAGE_WIDTH * newZoom, STAGE_HEIGHT)
  scrollTo(canonicalLeft * newZoom, false)
}

// ── Period navigation ───────────────────────────────────────────────────────
// Guard so setScroll's period-detection doesn't re-trigger programmatic scroll.
let scrollingToPeriod = false

watch(() => tlStore.activePeriod, (p) => {
  if (scrollingToPeriod) return
  const startPx = tlStore.scrollToPeriod(p) * zoomLevel.value
  const diff = Math.abs(tlStore.scrollLeft * zoomLevel.value - startPx)
  if (diff > 500) {
    scrollingToPeriod = true
    scrollTo(startPx, true)
    // Zynga Scroller animation ~250 ms; 800 ms buffer before re-enabling.
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
    <!-- z=2: Paper texture. Height must equal STAGE_HEIGHT (not 100%) so the
         paper covers the full vertical extent as the stage drag-scrolls. -->
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

    <!-- Center line indicator — dashed, marks the year the bubble reports -->
    <div
      class="tl-center-line absolute top-0 bottom-0 pointer-events-none z-[5]"
      style="left: 50%;"
    />

    <!-- Events stage (z=6 via tl-stage) -->
    <TimelineStage
      ref="stageRef"
      @event-click="onEventClick"
    />

    <!-- Canvas hover pointer overlay -->
    <CanvasPointer />

    <!-- z=10: Bottom date bar — cream background + per-event color overlay on hover -->
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

    <!-- z=20: Sidebar strip. Hidden on mobile (< md) so the canvas fills the viewport. -->
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
      {{ activePeriodName }}
    </div>

    <!-- Scroll arrows -->
    <ArrowNav
      @left="scrollBy(-400)"
      @right="scrollBy(400)"
    />

    <ZoomControls
      :current="zoomLevel"
      :min="ZOOM_MIN"
      :max="ZOOM_MAX"
      :step="ZOOM_STEP"
      @step="changeZoom"
    />
  </div>

  <!-- Period footer bar -->
  <TimelineFooter
    class="absolute bottom-0 left-0 right-0"
    :style="{ height: FOOTER_HEIGHT + 'px' }"
  />
</template>

<style scoped>
/* Dashed vertical guide at viewport center — visually links the year bubble
   below to the event row above so the reader can read off "what year am I at." */
.tl-center-line {
  width: 1px;
  background-image: repeating-linear-gradient(
    to bottom,
    rgba(20, 16, 10, 0.45) 0 5px,
    transparent 5px 10px
  );
}

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
</style>
