<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTimelineNav } from '../../router/useTimelineNav'
import { useI18n } from 'vue-i18n'
import { useTimelineConfig } from '../../config'
import { persistLocale, useLocalized } from '../../i18n'
import { useEventsStore } from '../../stores/events'
import { useFavoritesStore } from '../../stores/favorites'
import { useTimelineStore } from '../../stores/timeline'
import type { LaidOutEvent } from '../../types'
import FaqModal from './FaqModal.vue'
import { log } from '../../utils/log'

const { t, locale } = useI18n()
const { l } = useLocalized()
const config = useTimelineConfig()
const nav = useTimelineNav()
const eventsStore = useEventsStore()
const favStore = useFavoritesStore()
const tlStore = useTimelineStore()

const searchQuery = ref('')
const searchResults = ref<LaidOutEvent[]>([])
const showFavorites = ref(false)
const showFaq = ref(false)
const searchFocused = ref(false)
const highlightedIndex = ref(-1)
const allLoadedOnce = ref(false)
const mobileMenuOpen = ref(false)

let searchTimer = 0
let blurTimer = 0

function onSearchFocus() {
  searchFocused.value = true
}

function onSearchBlur() {
  blurTimer = window.setTimeout(() => {
    searchFocused.value = false
    highlightedIndex.value = -1
  }, 200)
}

async function onSearch(q: string) {
  searchQuery.value = q
  highlightedIndex.value = -1
  clearTimeout(searchTimer)
  if (!q.trim() || q.trim().length < 2) { searchResults.value = []; return }
  log.search('input', { q })
  if (!allLoadedOnce.value) {
    allLoadedOnce.value = true
    await eventsStore.loadAll()
  }
  searchTimer = window.setTimeout(async () => {
    if (!allLoadedOnce.value) {
      allLoadedOnce.value = true
      await eventsStore.loadAll()
    }
    searchResults.value = eventsStore.search(q)
  }, 200)
}

function onSearchKeydown(e: KeyboardEvent) {
  if (!showDropdown.value && e.key !== 'Escape') return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const max = searchResults.value.length - 1
    highlightedIndex.value = highlightedIndex.value < max ? highlightedIndex.value + 1 : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const max = searchResults.value.length - 1
    highlightedIndex.value = highlightedIndex.value > 0 ? highlightedIndex.value - 1 : max
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
      goToEvent(searchResults.value[highlightedIndex.value].slug)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    searchQuery.value = ''
    searchResults.value = []
    searchFocused.value = false
    highlightedIndex.value = -1
    ;(e.target as HTMLInputElement).blur()
  }
}

function goToEvent(slug: string) {
  log.nav('goToEvent', { slug })
  searchQuery.value = ''
  searchResults.value = []
  searchFocused.value = false
  highlightedIndex.value = -1
  mobileMenuOpen.value = false
  tlStore.openEvent(slug)
  nav.toEvent(slug)
}

function goHome() {
  log.nav('goHome')
  nav.toHome()
}

/** The locale the switcher offers next: cycles through `locales.available`. */
const nextLocale = computed(() => {
  const avail = config.locales.available
  const i = avail.indexOf(locale.value)
  return avail[(i + 1) % avail.length] ?? avail[0]
})
const localeLabel = (code: string) => config.locales.labels[code] ?? code.toUpperCase()
const localeName = (code: string) => config.locales.names[code] ?? code

function switchLocale(next: string = nextLocale.value) {
  if (next === locale.value) return
  log.i18n('switchLocale', { from: locale.value, to: next })
  locale.value = next
  persistLocale(config, next)
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

/** Show the dropdown when focused, query >= 2 chars, and either there are results or query is long enough to show "no results" */
const showDropdown = computed(() =>
  searchFocused.value && searchQuery.value.trim().length >= 2
)
</script>

<template>
  <header class="absolute top-0 left-0 right-0 h-[50px] z-50 flex items-center gap-3 px-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
    <!-- Logo / Home -->
    <button
      class="text-white font-bold text-sm whitespace-nowrap hover:opacity-80 transition-opacity mr-2"
      @click="goHome"
    >
      ✦ {{ l(config.title) }}
    </button>

    <!-- Search (desktop only — mobile uses the drawer copy) -->
    <div class="relative flex-1 max-w-xs hidden md:block">
      <input
        :value="searchQuery"
        :placeholder="t('nav.searchPlaceholder')"
        class="w-full bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
        @input="onSearch(($event.target as HTMLInputElement).value)"
        @focus="onSearchFocus"
        @blur="onSearchBlur"
        @keydown="onSearchKeydown"
      />

      <!-- Search dropdown -->
      <div
        v-if="showDropdown"
        class="absolute top-full left-0 right-0 mt-1 bg-stone-900 border border-white/10 rounded shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
      >
        <!-- Results count header -->
        <p class="text-xs text-white/40 px-3 py-1.5 border-b border-white/10">{{ searchCountLabel }}</p>

        <!--
          Result items. The empty/zero state is already conveyed by the
          `searchCountLabel` header above ("No Results" / "შედეგი არ არის");
          we intentionally don't render a second "no results" paragraph
          here. See issue #54.
        -->
        <button
          v-for="(r, i) in searchResults"
          :key="r.slug"
          class="w-full text-left px-3 py-2 text-sm text-white transition-colors block"
          :class="i === highlightedIndex ? 'bg-white/20' : 'hover:bg-white/10'"
          @mousedown="goToEvent(r.slug)"
          @mouseover="highlightedIndex = i"
        >
          <span class="block font-medium leading-tight">{{ l(r.title) }}</span>
          <span class="block text-xs text-white/50 mt-0.5">{{ l(r.dates) }}</span>
        </button>
      </div>
    </div>

    <div class="hidden md:flex items-center gap-2 ml-auto">
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
              {{ l(ev.title) }}
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

      <!-- Language switcher: a toggle for two locales, a select for more -->
      <button
        v-if="config.locales.available.length <= 2"
        class="text-white/50 hover:text-white text-xs px-2 py-1 transition-colors border border-white/20 rounded"
        :title="localeName(nextLocale)"
        data-testid="locale-toggle"
        @click="switchLocale()"
      >
        {{ localeLabel(nextLocale) }}
      </button>
      <select
        v-else
        class="bg-transparent text-white/70 text-xs px-2 py-1 border border-white/20 rounded"
        :value="locale"
        data-testid="locale-toggle"
        @change="switchLocale(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="code in config.locales.available" :key="code" :value="code" class="text-black">
          {{ localeName(code) }}
        </option>
      </select>
    </div>

    <!-- Hamburger (mobile only) -->
    <button
      class="md:hidden ml-auto flex items-center justify-center w-10 h-10 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
      aria-controls="mobile-menu"
      aria-label="Menu"
      data-testid="mobile-menu-toggle"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <svg v-if="!mobileMenuOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="4" y1="7"  x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
      <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="6" y1="6"  x2="18" y2="18" />
        <line x1="18" y1="6" x2="6"  y2="18" />
      </svg>
    </button>
  </header>

  <!-- Backdrop for favorites dropdown -->
  <div
    v-if="showFavorites"
    class="fixed inset-0 z-40"
    @click="showFavorites = false"
  />

  <!-- Mobile drawer (visible only when hamburger is open and < md) -->
  <div
    v-if="mobileMenuOpen"
    class="md:hidden fixed inset-0 z-40 bg-black/60"
    @click="mobileMenuOpen = false"
  />
  <div
    v-if="mobileMenuOpen"
    id="mobile-menu"
    class="md:hidden fixed top-[50px] left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-sm border-b border-white/10 p-4 flex flex-col gap-3 max-h-[calc(100vh-50px)] overflow-y-auto"
    data-testid="mobile-menu"
  >
    <!-- Mobile search -->
    <div class="relative">
      <input
        :value="searchQuery"
        :placeholder="t('nav.searchPlaceholder')"
        class="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
        @input="onSearch(($event.target as HTMLInputElement).value)"
        @focus="onSearchFocus"
        @blur="onSearchBlur"
        @keydown="onSearchKeydown"
      />
      <!-- Mobile search results -->
      <div
        v-if="showDropdown"
        class="mt-2 bg-stone-900 border border-white/10 rounded shadow-xl overflow-hidden max-h-72 overflow-y-auto"
      >
        <p class="text-xs text-white/40 px-3 py-1.5 border-b border-white/10">{{ searchCountLabel }}</p>
        <!-- Empty state is conveyed by `searchCountLabel` above; see issue #54. -->
        <button
          v-for="(r, i) in searchResults"
          :key="r.slug"
          class="w-full text-left px-3 py-2 text-sm text-white transition-colors block"
          :class="i === highlightedIndex ? 'bg-white/20' : 'hover:bg-white/10'"
          @mousedown="goToEvent(r.slug)"
          @mouseover="highlightedIndex = i"
        >
          <span class="block font-medium leading-tight">{{ l(r.title) }}</span>
          <span class="block text-xs text-white/50 mt-0.5">{{ l(r.dates) }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile favorites (inline expansion) -->
    <button
      class="text-left text-white/80 hover:text-white text-sm px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
      @click="showFavorites = !showFavorites"
    >
      <span>★ {{ t('nav.favorites') }}</span>
      <span class="text-white/40 text-xs">{{ showFavorites ? '▲' : '▼' }}</span>
    </button>
    <div v-if="showFavorites" class="bg-stone-900 border border-white/10 rounded p-2 max-h-48 overflow-y-auto">
      <p v-if="!favList.length" class="text-white/40 text-xs italic px-2 py-1">{{ t('nav.noFavorites') }}</p>
      <button
        v-for="ev in favList"
        :key="ev.slug"
        class="w-full text-left px-2 py-1.5 text-sm text-white hover:bg-white/10 rounded transition-colors block"
        @click="goToEvent(ev.slug)"
      >
        {{ l(ev.title) }}
      </button>
    </div>

    <!-- Mobile FAQ -->
    <button
      class="text-left text-white/80 hover:text-white text-sm px-3 py-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
      @click="showFaq = true; mobileMenuOpen = false"
    >
      {{ t('nav.faq') }}
    </button>

    <!-- Mobile language switcher -->
    <button
      v-if="config.locales.available.length <= 2"
      class="text-left text-white/60 hover:text-white text-sm px-3 py-2 rounded border border-white/20 hover:bg-white/10 transition-colors"
      :title="localeName(nextLocale)"
      @click="switchLocale()"
    >
      {{ localeName(nextLocale) }}
    </button>
    <select
      v-else
      class="bg-transparent text-white/70 text-sm px-3 py-2 border border-white/20 rounded"
      :value="locale"
      @change="switchLocale(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="code in config.locales.available" :key="code" :value="code" class="text-black">
        {{ localeName(code) }}
      </option>
    </select>
  </div>

  <!-- Modals -->
  <FaqModal v-if="showFaq" @close="showFaq = false" />
</template>
