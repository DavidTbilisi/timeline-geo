/** A BCP-47-ish locale code as used by vue-i18n, e.g. `'en'`, `'ka'`. */
export type LocaleCode = string

/**
 * A string available in one or more locales, keyed by locale code.
 * Missing locales fall back along the chain configured in `locales`.
 *
 *   { en: 'Adam', ka: 'ადამი' }
 */
export type LocalizedString = Partial<Record<LocaleCode, string>>

/** A nested vue-i18n message dictionary for one locale. */
export type MessageTree = { [key: string]: string | MessageTree }
