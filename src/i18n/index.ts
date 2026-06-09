/**
 * Locale registry. Each locale ships its full message tree in
 * `./locales/<code>.ts`.
 *
 * ── Adding a new language ──────────────────────────────────────────────────
 * 1. Copy `./locales/en.ts` to `./locales/<code>.ts` (e.g. `ru.ts`).
 * 2. Translate the values. The shape must mirror `en.ts`. Untranslated
 *    keys fall back to `en` automatically (see `fallbackLocale` below).
 *    The minimum-viable set for a new language is `periods.<slug>.name`
 *    plus the `nav` and `timeline` namespaces — everything else falls
 *    back to English while you translate it.
 * 3. Import + register the new file below (`import ru from './locales/ru'`,
 *    add it to `messages`, widen the `Locale` type, extend `loadLocale`).
 * 4. Period names + descriptions are looked up by slug via
 *    `usePeriodCopy()`. Nothing in src/data/periods.ts needs editing.
 * 5. The search ranker (src/stores/events.ts) auto-picks up all
 *    registered locales when matching queries to period names.
 */
import { createI18n } from 'vue-i18n'
import ka from './locales/ka'
import en from './locales/en'
import { log } from '@/utils/log'

type Locale = 'ka' | 'en'

const STORAGE_KEY = 'timeline-locale'

function loadLocale(): Locale {
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

export function persistLocale(value: Locale) {
  log.i18n('persistLocale', { value })
  try { localStorage.setItem(STORAGE_KEY, value) } catch (e) { log.warn('persistLocale failed', e) }
}
