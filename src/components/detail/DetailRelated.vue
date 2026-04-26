<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import type { RelatedEvent } from '@/types/detail'

defineProps<{ related: RelatedEvent[] }>()
const { locale, t } = useI18n()
const router = useRouter()
const tlStore = useTimelineStore()

function goTo(slug: string) {
  tlStore.openEvent(slug)
  router.replace(`/event/${slug}`)
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
      {{ locale === 'ka' && r.titleKa ? r.titleKa : r.titleEn }}
    </button>
  </div>
  <p v-else class="text-white/40 text-sm italic">{{ t('detail.noRelated') }}</p>
</template>
