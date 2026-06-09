/**
 * usePeriodCopy — i18n lookup for a period's display name + description.
 *
 * Translatable strings live in src/i18n/locales/<code>.ts under
 * `periods.<slug>.{name,description}`. vue-i18n's fallback chain handles
 * untranslated keys, so adding a new language only requires creating a
 * new locale file (no edits to src/data/periods.ts).
 *
 * Exposes pure functions `name(slugOrId)` and `description(slugOrId)`
 * because vue-i18n's `t()` is itself reactive — calling these inside a
 * template or computed re-evaluates when the locale changes.
 *
 *   const { name } = usePeriodCopy()
 *   const activeName = computed(() => name(tlStore.activePeriod))
 *   // template:  :title="name(p.slug)"
 */
import { useI18n } from 'vue-i18n'
import { PERIOD_BY_ID } from '@/data/periods'

type SlugOrId = string | number | null | undefined

function resolveSlug(input: SlugOrId): string | null {
  if (input == null) return null
  if (typeof input === 'string') return input
  return PERIOD_BY_ID[input]?.slug ?? null
}

export function usePeriodCopy() {
  const { t } = useI18n()

  function name(input: SlugOrId): string {
    const s = resolveSlug(input)
    return s ? t(`periods.${s}.name`) : ''
  }

  function description(input: SlugOrId): string {
    const s = resolveSlug(input)
    return s ? t(`periods.${s}.description`) : ''
  }

  return { name, description }
}
