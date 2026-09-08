<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTimelineConfig } from '../../config/inject'
import type { LandingPanelPlacement } from '../../plugins/types'
import PeriodCard from './PeriodCard.vue'
import EraArch from './EraArch.vue'
import WelcomePanel from './WelcomePanel.vue'
import { useDragScroll } from '../../composables/useDragScroll'

const config = useTimelineConfig()
const PERIODS = config.periods

/** Panels registered for a slot, sorted by `order`. */
function panels(placement: LandingPanelPlacement) {
  return config.plugins.landingPanels
    .filter(p => p.placement === placement)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
const stageBefore = computed(() => panels('stage-before'))
const stageAfter = computed(() => panels('stage-after'))
const footerPanels = computed(() => panels('footer'))

/** A footer panel emits `expand(boolean)` to open/close the footer (drives .active on .landing-footer). */
const footerExpanded = ref(false)
function onExpand(expanded: boolean) {
  footerExpanded.value = expanded
}

// ── Drag / momentum scroll for the landing stage ────────────────────────────

const containerRef = ref<HTMLElement | null>(null)
const stageRef     = ref<HTMLElement | null>(null)

/** Current horizontal scroll offset in px (positive = scrolled right) */
const scrollOffset = ref(0)

function getMaxOffset(): number {
  const container = containerRef.value
  const stage     = stageRef.value
  if (!container || !stage) return 0
  return Math.max(0, stage.offsetWidth - container.clientWidth)
}

function getOffset(): number {
  return scrollOffset.value
}

function setOffset(x: number): void {
  const clamped = Math.max(0, Math.min(x, getMaxOffset()))
  scrollOffset.value = clamped
  if (stageRef.value) {
    stageRef.value.style.transform = `translateX(${-clamped}px)`
  }
}

const { isDragging, mount } = useDragScroll(containerRef, getOffset, setOffset)

onMounted(() => {
  mount()
})
</script>

<template>
  <!--
    .landing fills the full viewport (minus the app menu offset).
    We keep `position: absolute` so the reference CSS rules for .landing apply,
    but add flex layout so the footer sticks to the bottom.
  -->
  <div class="landing lv-root" data-testid="landing-view">

    <!-- Scrollable stage area -->
    <div ref="containerRef" class="landing-container lv-stage-area">

      <!-- Decorative backgrounds -->
      <div class="landing-paper" />
      <div class="landing-grid" />

      <component :is="p.component" v-for="p in stageBefore" :key="p.id" v-bind="p.props" />

      <!-- The centered stage: era arches + period cards -->
      <div
        ref="stageRef"
        class="landing-stage zoom-2"
        :class="{ 'lv-dragging': isDragging }"
        data-testid="landing-stage"
      >
        <EraArch />
        <div class="landing-periods" data-testid="landing-periods">
          <PeriodCard
            v-for="period in PERIODS"
            :key="period.id"
            :period="period"
          />
        </div>
      </div>

      <component :is="p.component" v-for="p in stageAfter" :key="p.id" v-bind="p.props" />

    </div>

    <!-- Footer pinned to bottom of viewport -->
    <div :class="['landing-footer', 'lv-footer', footerExpanded ? 'active' : '']" data-testid="landing-footer">
      <WelcomePanel />
      <component :is="p.component" v-for="p in footerPanels" :key="p.id" v-bind="p.props" @expand="onExpand" />
    </div>

  </div>
</template>

<style scoped>
/* Override grab cursor while actively dragging */
.lv-dragging {
  cursor: grabbing !important;
  cursor: -webkit-grabbing !important;
}

/*
  Override the reference absolute positioning so the landing works in
  our single-page app layout (LandingPage.vue is position:relative/overflow:hidden).
  The reference CSS sets:
    .landing            { position: absolute; top: 0; left: 0; height: 100%; width: 100%; }
    .landing-container  { position: absolute; overflow: hidden; }
    .landing-footer     { position: absolute; bottom: 0; }
  We keep those rules from the imported CSS but add a flex wrapper so the
  footer is always at the bottom without the stage overflowing it.
*/

/* Root: fill the area below the app-menu (50px top padding applied in parent) */
.lv-root {
  position: absolute;
  inset: 0;
  padding-top: 50px;           /* same offset as LandingPage menu bar */
  display: flex;
  flex-direction: column;
  /* prevent the reference z-index:500 from hiding menu items */
  z-index: 5 !important;
}

/* Stage area takes all remaining vertical space */
.lv-stage-area {
  flex: 1;
  min-height: 0;
  position: relative !important; /* override the reference absolute */
}

/*
  Footer: override the reference `position: absolute; bottom: 0` with a
  flex-shrink:0 relative element so the footer doesn't overlap the stage.
  We keep enough height for the welcome panel + bar + color bar.
*/
.lv-footer {
  position: relative !important;
  flex-shrink: 0;
  /* Height accounts for: welcome (84px) + its -13px overhang = ~118px,
     plus bar (41px) stacked = all handled by ref CSS absolute children.
     We give an explicit min-height so the container doesn't collapse. */
  min-height: 132px;
}

/* Color bar removed from landing — bar / info / welcome use the reference
   site's original `bottom` values from engine.css, no overrides needed. */

/*
  Mobile (< md): the reference stylesheet sets `.welcome p { width: 710px }`,
  which overflows narrow viewports. Constrain it to the container width and
  give it edge padding so the body text wraps cleanly on phones.
*/
@media (max-width: 767px) {
  .lv-footer :deep(.welcome p) {
    width: auto !important;
    max-width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
    box-sizing: border-box;
  }
}
</style>
