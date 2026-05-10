import { createI18n } from 'vue-i18n'
import ka from './locales/ka'
import en from './locales/en'
import { log } from '@/utils/log'

const STORAGE_KEY = 'timeline-locale'

function loadLocale(): 'ka' | 'en' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ka' || saved === 'en') {
      log.i18n('loadLocale', { source: 'localStorage', value: saved })
      return saved
    }
  } catch (e) { log.warn('i18n loadLocale: localStorage blocked', e) }
  log.i18n('loadLocale', { source: 'default', value: 'ka' })
  return 'ka'
}

export const i18n = createI18n({
  legacy: false,
  locale: loadLocale(),
  fallbackLocale: 'en',
  messages: { ka, en },
})

export function persistLocale(value: 'ka' | 'en') {
  log.i18n('persistLocale', { value })
  try { localStorage.setItem(STORAGE_KEY, value) } catch (e) { log.warn('persistLocale failed', e) }
}
