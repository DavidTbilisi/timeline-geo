import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LocaleCode, LocalizedString } from '../types/locale'
import type { ResolvedTimelineConfig } from '../config/types'
import { useTimelineConfig } from '../config/inject'

/** Locales to consult, in order, for the given active locale. */
export function localeChain(locale: LocaleCode, config: ResolvedTimelineConfig): LocaleCode[] {
  const chain = [locale, config.locales.fallback, config.locales.default, ...config.locales.available]
  return chain.filter((l, i) => chain.indexOf(l) === i)
}

/** The first non-empty translation along `chain`, with the locale it came from. */
export function pickLocalizedEntry(
  value: LocalizedString | string | null | undefined,
  chain: LocaleCode[],
): { text: string; locale: LocaleCode | null } | null {
  if (value == null) return null
  if (typeof value === 'string') return { text: value, locale: null }
  for (const locale of chain) {
    const text = value[locale]
    if (text) return { text, locale }
  }
  return null
}

export function pickLocalized(
  value: LocalizedString | string | null | undefined,
  chain: LocaleCode[],
  fallback = '',
): string {
  return pickLocalizedEntry(value, chain)?.text ?? fallback
}

/**
 * Composable returning `l()`, which resolves a `LocalizedString` for the
 * active vue-i18n locale with the configured fallback chain.
 */
export function useLocalized() {
  const { locale } = useI18n()
  const config = useTimelineConfig()
  const chain = computed(() => localeChain(locale.value, config))
  const l = (value: LocalizedString | string | null | undefined, fallback = '') =>
    pickLocalized(value, chain.value, fallback)
  const pick = (value: LocalizedString | string | null | undefined) =>
    pickLocalizedEntry(value, chain.value)
  return { l, pick, locale, chain }
}

/** Replace English era tokens ("BC"/"AD") in a pre-rendered date label with localized ones. */
export function localizeEraTokens(text: string, labels: { bc: string; ad: string }): string {
  return text.replace(/\bBC\b/g, labels.bc).replace(/\bAD\b/g, labels.ad)
}
