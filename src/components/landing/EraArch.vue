<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ERAS } from '@/data/periods'

const { t } = useI18n()
</script>

<template>
  <div class="arches">
    <div
      v-for="era in ERAS"
      :key="era.id"
      :class="`arch arch-${era.id}`"
      :data-testid="`era-arch-${era.id}`"
    >
      <h3>{{ t(`eras.${era.id}`) }}</h3>
      <p>{{ t(`eras.descriptions.${era.id}`) }}</p>
    </div>
  </div>
</template>
