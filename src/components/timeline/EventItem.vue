<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LaidOutEvent } from '@lib/types'
import { useI18n } from 'vue-i18n'
import { useTimelineConfig } from '@lib/config'
import { useLocalized, localizeEraTokens } from '@lib/i18n'
import { formatDateRange } from '@lib/layout'
import { htmlToPlainText } from '@/utils/htmlText'
import { withBase } from '@/utils/assetUrl'
import { log } from '@/utils/log'

const props = defineProps<{
  event: LaidOutEvent
  /**
   * Vertical band offset (px) from TimelineStage. Non-zero shifts this
   * event below the row's primary band so it doesn't visually overlap
   * an earlier same-row event whose X-range it falls inside.
   */
  topOffset?: number
}>()
const emit = defineEmits<{ click: [event: LaidOutEvent] }>()

function onClick() {
  log.ui('EventItem click', { slug: props.event.slug, type: props.event.type, period: props.event.period })
  emit('click', props.event)
}
const { locale, t } = useI18n()
const { l, pick } = useLocalized()
const config = useTimelineConfig()

const imageError = ref(false)

const title = computed(() => l(props.event.title))
// Localize the BC/AD suffix in the date subtitle. A label authored in the
// active locale is used as-is; one borrowed from a fallback locale gets its
// era tokens substituted with the localized abbreviations. See issue #47.
const dates = computed(() => {
  const entry = pick(props.event.dates)
  if (!entry) {
    return formatDateRange(props.event.start, props.event.end,
      { bc: t('timeline.bc'), ad: t('timeline.ad') }, { showDuration: props.event.type === 'major' })
  }
  if (entry.locale === locale.value) return entry.text
  return localizeEraTokens(entry.text, { bc: t('timeline.bc'), ad: t('timeline.ad') })
})
// Plain-text version for use inside title/alt attributes (browsers don't
// decode HTML inside attributes; raw <span> and entities would be visible).
const datesPlain = computed(() => htmlToPlainText(dates.value))

const showImage = computed(() => props.event.image && !imageError.value)

// Effective rendered width: 0 means a card without a duration bar, which
// renders at the configured card width (see .tl-event.major in style.css).
const effectiveWidth = computed(() =>
  props.event.width > 0 ? props.event.width : config.layout.cardWidth
)

// Vertical position from the layout engine, plus any band shift.
const computedTop = computed(() => props.event.top + (props.topOffset ?? 0))

// Build a URL-safe path for the event-specific thumbnail.
// image is like "media/images/t/filename.jpg" — encode each segment
// then prefix with the deploy base so it works on subpaths (GH Pages).
const imageUrl = computed(() => {
  if (!props.event.image) return ''
  const encoded = props.event.image.split('/').map(p => encodeURIComponent(p)).join('/')
  return withBase(encoded)
})

const periodData = computed(() => config.byId[props.event.period])
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
      `period-${event.period}`,
      event.size === 'small' ? 'small' : '',
    ]"
    :style="{
      left: event.left + 'px',
      width: event.width > 0 ? event.width + 'px' : undefined,
      top: computedTop + 'px',
      borderLeft: `2px solid ${periodColor}88`,
    }"
    :data-slug="event.slug"
    :data-period="event.period"
    :data-row="event.row"
    :data-hover-width="event.hoverWidth"
    :title="title"
    @click="onClick"
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
      :class="event.bar ? 'info-full' : ''"
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
    :class="`period-${event.period}`"
    :style="{
      left: event.left + 'px',
      top: computedTop + 'px',
    }"
    :data-slug="event.slug"
    :data-period="event.period"
    :data-row="event.row"
    :data-hover-width="event.hoverWidth"
    :title="`${title} · ${datesPlain}`"
    @click="onClick"
  >
    <h3 class="group-hover:text-white transition-colors">{{ title }}</h3>
  </div>
</template>
