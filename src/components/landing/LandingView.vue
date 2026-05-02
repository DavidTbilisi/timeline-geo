<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PERIODS } from '@/data/periods'
import { useI18n } from 'vue-i18n'
import PeriodCard from './PeriodCard.vue'
import EraArch from './EraArch.vue'
import WelcomePanel from './WelcomePanel.vue'
import AmazingFacts from './AmazingFacts.vue'
import PeriodColorBar from '@/components/timeline/PeriodColorBar.vue'
import { useDragScroll } from '@/composables/useDragScroll'

const { t } = useI18n()

/** Tracks whether the amazing-facts panel is expanded (drives .active on .landing-footer) */
const factsExpanded = ref(false)

function toggleFacts() {
  factsExpanded.value = !factsExpanded.value
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

    </div>

    <!-- Footer pinned to bottom of viewport -->
    <div :class="['landing-footer', 'lv-footer', factsExpanded ? 'active' : '']" data-testid="landing-footer">
      <WelcomePanel />
      <AmazingFacts @toggle="toggleFacts" />
      <!-- 13-segment period color bar reused from timeline -->
      <div class="lv-color-bar">
        <PeriodColorBar />
      </div>
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

/* Color bar below the amazing-facts bar */
.lv-color-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 320;
}

/*
  Shift bar and info up by the color-bar height (28px) so the color bar
  doesn't overlap the amazing-facts bar.
*/
.lv-footer :deep(.bar) {
  bottom: 28px !important;
}
.lv-footer.active :deep(.bar) {
  bottom: calc(76px + 28px) !important;
}
.lv-footer :deep(.info) {
  bottom: calc(-78px + 28px) !important;
}
.lv-footer.active :deep(.info) {
  bottom: 28px !important;
}
.lv-footer :deep(.welcome) {
  bottom: calc(34px + 28px) !important;
}
</style>
