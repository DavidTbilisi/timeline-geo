<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EventDetail } from '@lib/types'
import type { Scripture } from '@app/types/bible'

/** Detail tab (Bible dataset): scripture passages from `extensions.scriptures`. */
const props = defineProps<{ detail: EventDetail; periodColor?: string }>()
const { t } = useI18n()
const scriptures = computed<Scripture[]>(() => props.detail.extensions?.scriptures ?? [])
</script>

<template>
  <div v-if="scriptures.length" class="space-y-6">
    <div v-for="s in scriptures" :key="s.reference" class="text-white/90">
      <h4 class="font-semibold text-sm text-white/60 uppercase tracking-wide mb-2">
        {{ s.reference }}
      </h4>
      <p
        v-for="v in s.verses"
        :key="v.number"
        class="text-sm leading-relaxed"
      >
        <sup class="text-white/40 mr-1">{{ v.number }}</sup>{{ v.line }}
      </p>
    </div>
  </div>
  <p v-else class="text-white/40 text-sm italic">{{ t('detail.noScriptures') }}</p>
</template>
