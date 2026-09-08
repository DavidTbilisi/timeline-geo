import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { LocalizedString } from '../types'
import { useTimelineConfig } from '../config'
import { log } from '../utils/log'

/** The minimum an event needs to appear in the favorites list. */
export interface FavoriteEntry {
  slug: string
  title: LocalizedString
  period: number
}

function readSlugs(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const config = useTimelineConfig()
  const STORAGE_KEY = config.storage.favorites

  const slugs = ref<string[]>(readSlugs(STORAGE_KEY))
  log.store('favorites init', { count: slugs.value.length })

  // Cache of event data for display in the favorites list
  const eventCache = ref<Record<string, FavoriteEntry>>({})

  watch(slugs, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      log.warn('favorites persist failed', e)
    }
    log.store('favorites persisted', { count: val.length })
  }, { deep: true })

  function isFavorite(slug: string) {
    return slugs.value.includes(slug)
  }

  function toggle(slug: string, eventData?: FavoriteEntry) {
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

  function cacheEvent(event: FavoriteEntry) {
    eventCache.value[event.slug] = event
  }

  return { slugs, eventCache, isFavorite, toggle, cacheEvent }
})
