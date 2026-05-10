import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { TimelineEvent } from '@/types/event'
import { log } from '@/utils/log'

const STORAGE_KEY = 'tl-geo-favorites'

export const useFavoritesStore = defineStore('favorites', () => {
  const slugs = ref<string[]>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  )
  log.store('favorites init', { count: slugs.value.length })

  // Cache of event data for display in the favorites list
  const eventCache = ref<Record<string, Pick<TimelineEvent, 'slug' | 'titleEn' | 'titleKa' | 'period'>>>({})

  watch(slugs, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    log.store('favorites persisted', { count: val.length })
  }, { deep: true })

  function isFavorite(slug: string) {
    return slugs.value.includes(slug)
  }

  function toggle(slug: string, eventData?: Pick<TimelineEvent, 'slug' | 'titleEn' | 'titleKa' | 'period'>) {
    const idx = slugs.value.indexOf(slug)
    if (idx === -1) {
      slugs.value.push(slug)
      if (eventData) eventCache.value[slug] = eventData
      log.store('favorites add', { slug })
    } else {
      slugs.value.splice(idx, 1)
      log.store('favorites remove', { slug })
    }
  }

  function cacheEvent(event: Pick<TimelineEvent, 'slug' | 'titleEn' | 'titleKa' | 'period'>) {
    eventCache.value[event.slug] = event
  }

  return { slugs, eventCache, isFavorite, toggle, cacheEvent }
})
