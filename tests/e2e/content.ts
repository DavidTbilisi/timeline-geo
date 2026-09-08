import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Dataset-derived expectations for the e2e suite, read from content/ at test
 * time so specs don't hardcode period counts, names or colours.
 */
export type LocalizedString = Partial<Record<string, string>>

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8')) as T
}

export interface ContentPeriod {
  id: number
  slug: string
  name: LocalizedString
  description?: LocalizedString
  color: string
  era: number
  startYear: number
  pxPerYear: number
}
export interface ContentEra {
  id: number
  name: LocalizedString
  description?: LocalizedString
  periods: number[]
}

/** Periods in chronological order (the order the app renders them). */
export const PERIODS = readJson<ContentPeriod[]>('content/periods.json').sort((a, b) => a.startYear - b.startYear)
export const ERAS = readJson<ContentEra[]>('content/eras.json')
export const SITE = readJson<{ title: LocalizedString; welcome: { heading: LocalizedString; body: LocalizedString } }>('content/site.json')

/** Default UI locale of the Bible app. */
export const DEFAULT_LOCALE = 'ka'

export function l(value: LocalizedString | undefined, locale = DEFAULT_LOCALE): string {
  return value?.[locale] ?? value?.en ?? ''
}

export function periodBySlug(slug: string): ContentPeriod {
  const p = PERIODS.find(p => p.slug === slug)
  if (!p) throw new Error(`no period with slug ${slug} in content/periods.json`)
  return p
}

/** '#ad1f26' → 'rgb(173, 31, 38)' (how browsers report computed colours). */
export function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}
