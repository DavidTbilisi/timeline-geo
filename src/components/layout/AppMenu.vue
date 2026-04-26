<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { persistLocale } from '@/i18n'
import { useEventsStore } from '@/stores/events'
import { useFavoritesStore } from '@/stores/favorites'
import { useTimelineStore } from '@/stores/timeline'
import type { TimelineEvent } from '@/types/event'
import FaqModal from './FaqModal.vue'
import SignInModal from './SignInModal.vue'

const { t, locale } = useI18n()
const router = useRouter()
const eventsStore = useEventsStore()
const favStore = useFavoritesStore()
const tlStore = useTimelineStore()

const searchQuery = ref('')
const searchResults = ref<TimelineEvent[]>([])
const showFavorites = ref(false)
const showFaq = ref(false)
const showSignIn = ref(false)
let searchTimer = 0
let blurTimer = 0

function onSearchBlur() {
  blurTimer = window.setTimeout(() => { searchResults.value = [] }, 200)
}

async function onSearch(q: string) {
  searchQuery.value = q
  clearTimeout(searchTimer)
  if (!q.trim()) { searchResults.value = []; return }
  searchTimer = window.setTimeout(async () => {
    await eventsStore.loadAll()
    searchResults.value = eventsStore.search(q)
  }, 200)
}

function goToEvent(slug: string) {
  searchQuery.value = ''
  searchResults.value = []
  tlStore.openEvent(slug)
  router.push(`/event/${slug}`)
}

function goHome() {
  router.push('/')
}

function toggleLocale() {
  const next = locale.value === 'ka' ? 'en' : 'ka'
  locale.value = next
  persistLocale(next)
}

watch(locale, (v) => { document.documentElement.lang = v })
document.documentElement.lang = locale.value

const favList = computed(() =>
  favStore.slugs.map(s => favStore.eventCache[s]).filter(Boolean)
)

const searchCountLabel = computed(() => {
  const n = searchResults.value.length
  if (n === 0) return t('nav.searchResults.zero')
  if (n === 1) return t('nav.searchResults.one')
  return t('nav.searchResults.many', { count: n })
})
</script>

<template>
  <header class="absolute top-0 left-0 right-0 h-[50px] z-50 flex items-center gap-3 px-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
    <!-- Logo / Home -->
    <button
      class="text-white font-bold text-sm whitespace-nowrap hover:opacity-80 transition-opacity mr-2"
      @click="goHome"
    >
      ✦ {{ t('nav.title') }}
    </button>

    <!-- Search -->
    <div class="relative flex-1 max-w-xs">
      <input
        :value="searchQuery"
        :placeholder="t('nav.searchPlaceholder')"
        class="w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
        @input="onSearch(($event.target as HTMLInputElement).value)"
        @blur="onSearchBlur"
      />
      <!-- Search results -->
      <div
        v-if="searchResults.length"
        class="absolute top-full left-0 right-0 mt-1 bg-stone-900 border border-white/10 rounded shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto"
      >
        <p class="text-xs text-white/40 px-3 py-1.5 border-b border-white/10">{{ searchCountLabel }}</p>
        <button
          v-for="r in searchResults"
          :key="r.slug"
          class="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors block"
          @mousedown="goToEvent(r.slug)"
        >
          {{ locale === 'ka' && r.titleKa ? r.titleKa : r.titleEn }}
        </button>
      </div>
      <p v-else-if="searchQuery && !searchResults.length" class="absolute top-full left-0 mt-1 text-xs text-white/40 px-2 py-1">
        {{ t('nav.noResults') }}
      </p>
    </div>

    <div class="flex items-center gap-2 ml-auto">
      <!-- Favorites -->
      <div class="relative">
        <button
          class="text-white/70 hover:text-white text-xs px-2 py-1 transition-colors"
          @click="showFavorites = !showFavorites"
        >
          ★ {{ t('nav.favorites') }}
        </button>
        <div
          v-if="showFavorites"
          class="absolute top-full right-0 mt-1 w-64 bg-stone-900 border border-white/10 rounded shadow-xl z-50"
        >
          <div class="p-3 max-h-64 overflow-y-auto">
            <p v-if="!favList.length" class="text-white/40 text-xs italic">{{ t('nav.noFavorites') }}</p>
            <button
              v-for="ev in favList"
              :key="ev.slug"
              class="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded transition-colors block"
              @click="goToEvent(ev.slug); showFavorites = false"
            >
              {{ locale === 'ka' && ev.titleKa ? ev.titleKa : ev.titleEn }}
            </button>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <button
        class="text-white/70 hover:text-white text-xs px-2 py-1 transition-colors"
        @click="showFaq = true"
      >
        {{ t('nav.faq') }}
      </button>

      <!-- Sign In -->
      <button
        class="text-white/70 hover:text-white text-xs px-2 py-1 transition-colors"
        @click="showSignIn = true"
      >
        {{ t('nav.signIn') }}
      </button>

      <!-- Language toggle -->
      <button
        class="text-white/50 hover:text-white text-xs px-2 py-1 transition-colors border border-white/20 rounded"
        :title="locale === 'ka' ? t('nav.toggleLocale.toEn') : t('nav.toggleLocale.toKa')"
        @click="toggleLocale"
      >
        {{ locale === 'ka' ? 'EN' : 'ქა' }}
      </button>
    </div>
  </header>

  <!-- Backdrop for favorites dropdown -->
  <div
    v-if="showFavorites"
    class="fixed inset-0 z-40"
    @click="showFavorites = false"
  />

  <!-- Modals -->
  <FaqModal v-if="showFaq" @close="showFaq = false" />
  <SignInModal v-if="showSignIn" @close="showSignIn = false" />
</template>
