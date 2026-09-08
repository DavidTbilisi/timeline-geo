<script setup lang="ts">
import { computed } from 'vue'
import type { Period } from '@lib/types'
import { useTimelineConfig } from '@lib/config'
import { useLocalized } from '@lib/i18n'
import { resolveAsset } from '@lib/theme'
import { useRouter } from 'vue-router'
import { log } from '@/utils/log'

const props = defineProps<{ period: Period }>()
const { l } = useLocalized()
const config = useTimelineConfig()
const router = useRouter()

const cardImage = computed(() =>
  props.period.cardImage ? `url('${resolveAsset(config, props.period.cardImage)}')` : undefined,
)

function goToPeriod() {
  log.ui('PeriodCard click', { id: props.period.id, slug: props.period.slug })
  router.push(`/period/${props.period.slug}`)
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
