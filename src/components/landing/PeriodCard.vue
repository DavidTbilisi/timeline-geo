<script setup lang="ts">
import type { PeriodData } from '@/types/event'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = defineProps<{ period: PeriodData }>()
const { locale } = useI18n()
const router = useRouter()

const name = () => locale.value === 'ka' ? (props.period.nameKa ?? props.period.nameEn) : props.period.nameEn
const description = () =>
  locale.value === 'ka'
    ? (props.period.descriptionKa ?? props.period.descriptionEn)
    : props.period.descriptionEn

function goToPeriod() {
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
