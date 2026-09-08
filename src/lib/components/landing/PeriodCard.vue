<script setup lang="ts">
import { computed } from 'vue'
import type { Period } from '../../types'
import { useTimelineConfig } from '../../config'
import { useLocalized } from '../../i18n'
import { resolveAsset } from '../../theme'
import { useTimelineNav } from '../../router/useTimelineNav'
import { log } from '../../utils/log'

const props = defineProps<{ period: Period }>()
const { l } = useLocalized()
const config = useTimelineConfig()
const nav = useTimelineNav()

const cardImage = computed(() =>
  props.period.cardImage ? `url('${resolveAsset(config, props.period.cardImage)}')` : undefined,
)

function goToPeriod() {
  log.ui('PeriodCard click', { id: props.period.id, slug: props.period.slug })
  nav.toPeriod(props.period.slug)
}
</script>

<template>
  <div
    class="landing-period hoverable"
    :style="{ '--period-color': period.color }"
    :data-id="period.id"
    :data-testid="`period-card-${period.id}`"
    @click="goToPeriod"
  >
    <div class="image" :style="{ backgroundImage: cardImage }" />
    <div class="info">
      <h3>{{ l(period.name) }}</h3>
      <div class="dash-line" />
      <h4>{{ l(period.description) }}</h4>
    </div>
  </div>
</template>
