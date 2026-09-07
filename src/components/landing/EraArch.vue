<script setup lang="ts">
import { useTimelineConfig } from '@lib/config'
import { useLocalized } from '@lib/i18n'

const config = useTimelineConfig()
const { l } = useLocalized()
</script>

<template>
  <div class="arches">
    <div
      v-for="era in config.eras"
      :key="era.id"
      :class="`arch arch-${era.id}`"
      :data-testid="`era-arch-${era.id}`"
    >
      <h3>{{ l(era.name) }}</h3>
      <p>{{ l(era.description) }}</p>
    </div>
  </div>
</template>
