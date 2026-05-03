<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TimelineEvent } from '@/types/event'
import { useI18n } from 'vue-i18n'
import { PERIOD_BY_ID } from '@/data/periods'

const props = defineProps<{ event: TimelineEvent }>()
const emit = defineEmits<{ click: [event: TimelineEvent] }>()
const { locale } = useI18n()

const imageError = ref(false)

const title = computed(() =>
  locale.value === 'ka' && props.event.titleKa ? props.event.titleKa : props.event.titleEn
)
const dates = computed(() =>
  locale.value === 'ka' && props.event.datesKa ? props.event.datesKa : props.event.datesEn
)

const showImage = computed(() => props.event.imagePath && !imageError.value)

// Build a URL-safe path for the event-specific thumbnail
const imageUrl = computed(() => {
  if (!props.event.imagePath) return ''
  // imagePath is like "media/images/t/filename.jpg" — serve from root
  const parts = props.event.imagePath.split('/')
  const encodedParts = parts.map(p => encodeURIComponent(p))
  return '/' + encodedParts.join('/')
})

// Period artwork: used as fallback background when the event has no own thumbnail
const periodData = computed(() => PERIOD_BY_ID[props.event.period])
const periodImage = computed(() => periodData.value?.sidebarImage ?? '')
const periodColor = computed(() => periodData.value?.color ?? '#555')

function onImageError() {
  imageError.value = true
}
</script>

<template>
  <!-- ── Major event ── -->
  <div
    v-if="event.type === 'major'"
    class="tl-event major group"
    :class="[
      `row-${event.row}`,
      `period-${event.period}`,
      event.size === 'small' ? 'small' : '',
    ]"
    :style="{
      left: event.left + 'px',
      width: event.width > 0 ? event.width + 'px' : '6px',
      borderLeft: `2px solid ${periodColor}88`,
    }"
    :data-slug="event.slug"
    :title="title"
    @click="emit('click', event)"
  >
    <!-- Period artwork as subtle background (always shown, low opacity) -->
    <img
      v-if="periodImage"
      :src="periodImage"
      class="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style="opacity: 0.08;"
      aria-hidden="true"
      loading="lazy"
    />

    <!-- Event-specific thumbnail overlaid on top of period artwork -->
    <img
      v-if="showImage"
      :src="imageUrl"
      class="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
      :alt="title"
      loading="lazy"
      @error="onImageError"
    />

    <!-- Hover highlight ring -->
    <div class="absolute inset-0 ring-inset ring-white/0 group-hover:ring-1 group-hover:ring-white/40 transition-all duration-150 pointer-events-none" />

    <!-- Label -->
    <div
      class="info"
      :class="event.labelStyle === 'full' ? 'info-full' : ''"
    >
      <h3>{{ title }}</h3>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h4 v-if="event.size !== 'small'" v-html="dates" />
    </div>
  </div>

  <!-- ── Minor event ── -->
  <div
    v-else
    class="tl-event minor group"
    :class="[`row-${event.row}`, `period-${event.period}`]"
    :style="{ left: event.left + 'px' }"
    :data-slug="event.slug"
    :title="`${title} · ${dates}`"
    @click="emit('click', event)"
  >
    <h3 class="group-hover:text-white transition-colors">{{ title }}</h3>
  </div>
</template>
