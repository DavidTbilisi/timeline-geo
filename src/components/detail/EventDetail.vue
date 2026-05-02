<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTimelineStore } from '@/stores/timeline'
import { useEventsStore } from '@/stores/events'
import { useFavoritesStore } from '@/stores/favorites'
import { PERIODS } from '@/data/periods'
import { useI18n } from 'vue-i18n'
import type { EventDetail as DetailType } from '@/types/detail'
import DetailArticle from './DetailArticle.vue'
import DetailScriptures from './DetailScriptures.vue'
import DetailRelated from './DetailRelated.vue'
import DetailImages from './DetailImages.vue'
import DetailVideos from './DetailVideos.vue'

const tlStore = useTimelineStore()
const eventsStore = useEventsStore()
const favStore = useFavoritesStore()
const router = useRouter()
const { t, locale } = useI18n()

const detail = ref<DetailType | null>(null)
const loading = ref(true)
const activeTab = ref<'article' | 'scriptures' | 'related' | 'images' | 'video'>('article')
const slug = computed(() => tlStore.activeEventSlug ?? '')

const isFav = computed(() => favStore.isFavorite(slug.value))
const periodData = computed(() => {
  if (!detail.value) return null
  return PERIODS[detail.value.period - 1] ?? null
})
const periodColor = computed(() => periodData.value?.color ?? '#555')
const title = computed(() => {
  if (!detail.value) return ''
  return locale.value === 'ka' && detail.value.titleKa ? detail.value.titleKa : detail.value.titleEn
})
const dates = computed(() => {
  if (!detail.value) return ''
  return locale.value === 'ka' && detail.value.datesKa ? detail.value.datesKa : detail.value.datesEn
})
const periodName = computed(() => {
  if (!periodData.value) return ''
  return locale.value === 'ka' ? periodData.value.nameKa : periodData.value.nameEn
})

const hasImages = computed(() => (detail.value?.images?.length ?? 0) > 0)
const hasVideos = computed(() => (detail.value?.videos?.length ?? 0) > 0)

// Build the visible tab list dynamically
type TabKey = 'article' | 'scriptures' | 'related' | 'images' | 'video'
const visibleTabs = computed((): TabKey[] => {
  const tabs: TabKey[] = ['article', 'scriptures', 'related', 'images']
  if (hasVideos.value) tabs.push('video')
  return tabs
})

onMounted(async () => {
  if (!slug.value) return
  loading.value = true
  detail.value = await eventsStore.loadDetail(slug.value)
  loading.value = false
})

function close() {
  tlStore.closeEvent()
  const period = PERIODS[(tlStore.activePeriod ?? 1) - 1] ?? PERIODS[0]
  router.replace(`/period/${period.slug}`)
}

function toggleFav() {
  if (detail.value) {
    favStore.toggle(slug.value, {
      slug: slug.value,
      titleEn: detail.value.titleEn,
      titleKa: detail.value.titleKa,
      period: detail.value.period,
    })
  }
}
</script>

<template>
  <div class="detail-overlay">
    <!-- Colored header bar -->
    <div
      class="flex items-center gap-3 px-4 py-3 flex-shrink-0 relative overflow-hidden"
      :style="{ background: periodColor }"
    >
      <!-- Back button -->
      <button
        class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        :title="t('detail.back')"
        @click="close"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      <!-- Title block -->
      <div class="flex-1 min-w-0">
        <p v-if="periodName" class="text-white/60 text-[10px] uppercase tracking-widest font-semibold leading-none mb-0.5">{{ periodName }}</p>
        <h1 class="text-base font-bold text-white leading-tight truncate">{{ title || '…' }}</h1>
        <p v-if="dates" class="text-white/70 text-xs mt-0.5">{{ dates }}</p>
      </div>

      <!-- Favorite star button -->
      <button
        class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all"
        :class="isFav ? 'bg-white/25 text-yellow-300' : 'bg-black/20 text-white/50 hover:text-white/80 hover:bg-black/30'"
        :title="isFav ? t('detail.removeFavorite') : t('detail.addFavorite')"
        @click="toggleFav"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="isFav ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        <span class="text-white/40 text-xs">{{ t('detail.loading') }}</span>
      </div>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="flex border-b border-white/10 flex-shrink-0 bg-black/40 overflow-x-auto">
        <button
          v-for="tab in visibleTabs"
          :key="tab"
          class="flex-shrink-0 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors relative"
          :class="activeTab === tab
            ? 'text-white'
            : 'text-white/40 hover:text-white/70'"
          :data-testid="`tab-${tab}`"
          @click="activeTab = tab"
        >
          {{ t(`detail.tabs.${tab}`) }}
          <!-- Active underline bar -->
          <span
            v-if="activeTab === tab"
            class="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
            :style="{ background: periodColor }"
          />
        </button>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-6" :class="{ '!p-0': activeTab === 'images' || activeTab === 'video' }">
        <DetailArticle v-if="activeTab === 'article'" :detail="detail" />
        <DetailScriptures v-else-if="activeTab === 'scriptures'" :scriptures="detail?.scriptures ?? []" />
        <DetailRelated v-else-if="activeTab === 'related'" :related="detail?.related ?? []" />
        <DetailImages
          v-else-if="activeTab === 'images'"
          :images="detail?.images ?? []"
          :period-color="periodColor"
          class="h-full"
        />
        <DetailVideos
          v-else-if="activeTab === 'video' && hasVideos"
          :videos="detail!.videos"
          class="h-full"
        />
      </div>
    </template>
  </div>
</template>
