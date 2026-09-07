<script setup lang="ts">
import type { Period } from '@lib/types'
import { useLocalized } from '@lib/i18n'
import { useRouter } from 'vue-router'
import { log } from '@/utils/log'

const props = defineProps<{ period: Period }>()
const { l } = useLocalized()
const router = useRouter()

function goToPeriod() {
  log.ui('PeriodCard click', { id: props.period.id, slug: props.period.slug })
  router.push(`/period/${props.period.slug}`)
}
</script>

<template>
  <div
    :class="`landing-period landing-period-${period.id} hoverable`"
    :data-id="period.id"
    :data-testid="`period-card-${period.id}`"
    @click="goToPeriod"
  >
    <div class="image" />
    <div class="info">
      <h3>{{ l(period.name) }}</h3>
      <div class="dash-line" />
      <h4>{{ l(period.description) }}</h4>
    </div>
  </div>
</template>
