import type { LocaleCode, MessageTree } from '../types/locale'
import type { ResolvedTimelineConfig } from '../config/types'
import { engineMessagesEn } from './messages/en'

type Messages = MessageTree

function isPlainObject(v: unknown): v is Messages {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Recursively merge `patch` over `base`, returning a new object. */
export function deepMerge(base: Messages, patch: Messages): Messages {
  const out: Messages = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    const existing = out[k]
    out[k] = isPlainObject(existing) && isPlainObject(v) ? deepMerge(existing, v) : (v as string | MessageTree)
  }
  return out
}

/** vue-i18n `messages`: engine English chrome plus every locale the consumer supplies. */
export function buildMessages(config: ResolvedTimelineConfig): Record<LocaleCode, Messages> {
  const out: Record<LocaleCode, Messages> = { en: { ...engineMessagesEn } }
  for (const [locale, msgs] of Object.entries(config.i18n.messages)) {
    out[locale] = deepMerge(out[locale] ?? {}, msgs)
  }
  return out
}
