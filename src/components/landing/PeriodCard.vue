<script setup lang="ts">
import { ref } from 'vue'
import type { PeriodData } from '@/types/event'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = defineProps<{ period: PeriodData }>()
const { locale } = useI18n()
const router = useRouter()
const hovered = ref(false)

const name = () => locale.value === 'ka' ? (props.period.nameKa ?? props.period.nameEn) : props.period.nameEn
const description = () => locale.value === 'ka'
  ? (props.period.descriptionKa ?? props.period.descriptionEn)
  : props.period.descriptionEn

function goToPeriod() {
  router.push(`/period/${props.period.slug}`)
}
</script>

<template>
  <div
    class="relative flex-shrink-0 w-44 cursor-pointer transition-all duration-300 overflow-hidden rounded-sm"
    :style="{
      height: hovered ? '280px' : '220px',
      borderBottom: `3px solid ${period.color}`,
    }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @click="goToPeriod"
  >
    <!-- Background image -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-transform duration-300"
      :class="hovered ? 'scale-105' : 'scale-100'"
      :style="{ backgroundImage: `url('${period.landingImage}')` }"
    />
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

    <!-- Content -->
    <div class="absolute bottom-0 left-0 right-0 p-3 text-white">
      <h3
        class="text-sm font-bold uppercase leading-tight mb-1"
        :style="{ color: period.color }"
      >
        {{ name() }}
      </h3>
      <div class="w-6 h-px mb-2" :style="{ background: period.color }" />
      <p v-if="hovered" class="text-xs text-white/80 leading-relaxed">
        {{ description() }}
      </p>
    </div>
  </div>
</template>
