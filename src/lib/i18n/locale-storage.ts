import type { LocaleCode } from '../types/locale'
import type { ResolvedTimelineConfig } from '../config/types'

/** The persisted locale, if it is one of the available ones. */
export function loadStoredLocale(config: ResolvedTimelineConfig): LocaleCode | null {
  try {
    const saved = localStorage.getItem(config.storage.locale)
    if (saved && config.locales.available.includes(saved)) return saved
  } catch {
    /* storage blocked */
  }
  return null
}

export function persistLocale(config: ResolvedTimelineConfig, locale: LocaleCode) {
  try {
    localStorage.setItem(config.storage.locale, locale)
  } catch {
    /* storage blocked */
  }
}
