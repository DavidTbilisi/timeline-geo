<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTimelineStore } from '../../stores/timeline'
import { useLocalized } from '../../i18n/localized'
import { useTimelineNav } from '../../router/useTimelineNav'
import type { EventDetail } from '../../types/detail'

const props = defineProps<{ detail: EventDetail; periodColor?: string }>()
const { t } = useI18n()
const { l } = useLocalized()
const nav = useTimelineNav()
const tlStore = useTimelineStore()
const related = computed(() => props.detail.related ?? [])

function goTo(slug: string) {
  tlStore.openEvent(slug)
  nav.toEvent(slug, { replace: true })
}
</script>

<template>
  <div v-if="related.length" class="space-y-2">
    <button
      v-for="r in related"
      :key="r.slug"
      class="w-full text-left px-4 py-3 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
      @click="goTo(r.slug)"
    >
      {{ l(r.title) }}
    </button>
  </div>
  <p v-else class="text-white/40 text-sm italic">{{ t('detail.noRelated') }}</p>
</template>
