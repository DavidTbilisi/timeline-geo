import { createI18n } from 'vue-i18n'
import ka from './locales/ka'
import en from './locales/en'

const STORAGE_KEY = 'timeline-locale'

function loadLocale(): 'ka' | 'en' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ka' || saved === 'en') return saved
  } catch { /* SSR / blocked storage — fall through */ }
  return 'ka'
}

export const i18n = createI18n({
  legacy: false,
  locale: loadLocale(),
  fallbackLocale: 'en',
  messages: { ka, en },
})

export function persistLocale(value: 'ka' | 'en') {
  try { localStorage.setItem(STORAGE_KEY, value) } catch { /* ignore */ }
}
