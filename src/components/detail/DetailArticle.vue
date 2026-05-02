<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EventDetail } from '@/types/detail'

const props = defineProps<{ detail: EventDetail | null }>()
const { locale, t } = useI18n()

const description = computed(() => {
  const d = props.detail
  if (!d) return null
  return locale.value === 'ka' && d.descriptionKa ? d.descriptionKa : d.descriptionEn
})
const article = computed(() => {
  const d = props.detail
  if (!d) return null
  return locale.value === 'ka' && d.articleKa ? d.articleKa : d.articleEn
})
const paragraphs = computed<string[]>(() => {
  const a = article.value
  if (!a) return []
  return a
    .split(/(?:<br\s*\/?>\s*){2,}/i)
    .map(p => p.trim())
    .filter(Boolean)
})
</script>

<template>
  <div v-if="description || article" class="text-white/90 leading-relaxed space-y-4">
    <p v-if="description" class="font-semibold text-base text-white leading-snug">{{ description }}</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p
      v-for="(para, i) in paragraphs"
      :key="i"
      class="text-sm text-white/80 leading-relaxed"
      v-html="para"
    />
  </div>

  <!-- No content placeholder -->
  <div v-else class="flex flex-col items-center justify-center py-12 gap-3 text-center">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-white/20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
    <p class="text-white/30 text-sm italic max-w-xs">{{ t('detail.noContent') }}</p>
  </div>
</template>
