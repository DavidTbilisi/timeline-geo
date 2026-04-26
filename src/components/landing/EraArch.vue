<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ERAS } from '@/data/periods'

const { t } = useI18n()
</script>

<template>
  <div class="flex gap-2 mb-4 px-2">
    <div
      v-for="era in ERAS"
      :key="era.id"
      class="flex-1 border-t border-white/20 pt-2"
    >
      <h4 class="text-xs font-semibold text-white/60 uppercase tracking-widest">
        {{ t(`eras.${era.id}`) }}
      </h4>
    </div>
  </div>
</template>
