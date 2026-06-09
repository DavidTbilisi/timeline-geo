<script setup lang="ts">
import type { PeriodData } from '@/types/event'
import { useRouter } from 'vue-router'
import { usePeriodCopy } from '@/composables/usePeriodCopy'
import { log } from '@/utils/log'

const props = defineProps<{ period: PeriodData }>()
const router = useRouter()
const { name: periodName, description: periodDescription } = usePeriodCopy()

const name = () => periodName(props.period.slug)
const description = () => periodDescription(props.period.slug)

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
      <h3>{{ name() }}</h3>
      <div class="dash-line" />
      <h4>{{ description() }}</h4>
    </div>
  </div>
</template>
