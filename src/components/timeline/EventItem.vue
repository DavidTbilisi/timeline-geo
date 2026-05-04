<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TimelineEvent } from '@/types/event'
import { useI18n } from 'vue-i18n'
import { PERIOD_BY_ID } from '@/data/periods'
import { htmlToPlainText } from '@/utils/htmlText'

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
// Plain-text version for use inside title/alt attributes (browsers don't
// decode HTML inside attributes; raw <span> and entities would be visible).
const datesPlain = computed(() => htmlToPlainText(dates.value))

const showImage = computed(() => props.event.imagePath && !imageError.value)

// Effective rendered width: data is 0 for ~84% of events because the source
// HTML omits an inline style. The reference site falls back to a 260px CSS
// default in that case (see .tl-event.major in style.css).
const effectiveWidth = computed(() =>
  props.event.width > 0 ? props.event.width : 260
)

// Build a URL-safe path for the event-specific thumbnail
const imageUrl = computed(() => {
  if (!props.event.imagePath) return ''
  // imagePath is like "media/images/t/filename.jpg" — serve from root
  const parts = props.event.imagePath.split('/')
  const encodedParts = parts.map(p => encodeURIComponent(p))
  return '/' + encodedParts.join('/')
})

const periodData = computed(() => PERIOD_BY_ID[props.event.period])
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
      width: event.width > 0 ? event.width + 'px' : undefined,
      borderLeft: `2px solid ${periodColor}88`,
    }"
    :data-slug="event.slug"
    :data-period="event.period"
    :data-hover-width="event.hoverWidth"
    :title="title"
    @click="emit('click', event)"
  >
    <!--
      Event thumbnail as a small box anchored to the RIGHT edge of the card
      (matches reference site layout: image is a side thumbnail, not a
      cover background). Hidden when the card is too narrow to fit it
      without overlapping the title text on the left.
    -->
    <img
      v-if="showImage && effectiveWidth >= 160"
      :src="imageUrl"
      class="ev-thumb absolute right-0 top-0 h-full pointer-events-none"
      :alt="title"
      loading="lazy"
      @error="onImageError"
    />

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
    :data-period="event.period"
    :data-hover-width="event.hoverWidth"
    :title="`${title} · ${datesPlain}`"
    @click="emit('click', event)"
  >
    <h3 class="group-hover:text-white transition-colors">{{ title }}</h3>
  </div>
</template>
