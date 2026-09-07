import type { ResolvedPeriod, Era } from '../types/period'
import type { LayoutOptions, ResolvedLayoutOptions, TimelineConfig, ResolvedTimelineConfig } from './types'

export const DEFAULT_LAYOUT: Omit<ResolvedLayoutOptions, 'stageWidth' | 'endYear'> = {
  stageHeight: 1440,
  futureFromYear: Number.POSITIVE_INFINITY,
  sidebarWidth: 220,
  datebarHeight: 66,
  footerHeight: 75,
}

/**
 * Sort periods chronologically and fill in `startPx` / `endPx` / `index`.
 * `startPx` defaults to the cumulative offset from the previous period.
 */
export function resolvePeriods(periods: TimelineConfig['periods'], layout: LayoutOptions): {
  periods: ResolvedPeriod[]
  stageWidth: number
  endYear: number
} {
  const sorted = [...periods].sort((a, b) => a.startYear - b.startYear)
  const out: ResolvedPeriod[] = []
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]
    const prev = out[i - 1]
    const startPx = p.startPx ?? (prev ? prev.startPx + (p.startYear - prev.startYear) * prev.pxPerYear : 0)
    out.push({ ...p, startPx, endPx: 0, index: i })
  }
  const last = out[out.length - 1]
  const endYear = layout.endYear ?? (last ? last.startYear + 100 : 0)
  const stageWidth = layout.stageWidth ?? (last ? Math.ceil(last.startPx + (endYear - last.startYear) * last.pxPerYear) : 0)
  for (let i = 0; i < out.length; i++) {
    out[i].endPx = i < out.length - 1 ? out[i + 1].startPx : stageWidth
  }
  return { periods: out, stageWidth, endYear }
}

function validate(config: TimelineConfig, periods: ResolvedPeriod[], eras: Era[]) {
  const ids = new Set<number>()
  const slugs = new Set<string>()
  for (const p of periods) {
    if (ids.has(p.id)) throw new Error(`[timeline] duplicate period id ${p.id}`)
    if (slugs.has(p.slug)) throw new Error(`[timeline] duplicate period slug "${p.slug}"`)
    ids.add(p.id)
    slugs.add(p.slug)
  }
  const eraIds = new Set(eras.map(e => e.id))
  for (const p of periods) {
    if (!eraIds.has(p.era)) throw new Error(`[timeline] period "${p.slug}" references unknown era ${p.era}`)
  }
  if (!config.locales.available.includes(config.locales.default)) {
    throw new Error(`[timeline] locales.default "${config.locales.default}" is not in locales.available`)
  }
}

export function resolveConfig(config: TimelineConfig): ResolvedTimelineConfig {
  const layoutIn = config.layout ?? {}
  const { periods, stageWidth, endYear } = resolvePeriods(config.periods, layoutIn)
  validate(config, periods, config.eras)

  const layout: ResolvedLayoutOptions = { ...DEFAULT_LAYOUT, ...stripUndefined(layoutIn), stageWidth, endYear }
  const byId: Record<number, ResolvedPeriod> = {}
  const bySlug: Record<string, ResolvedPeriod> = {}
  for (const p of periods) { byId[p.id] = p; bySlug[p.slug] = p }
  const eraById: Record<number, Era> = {}
  for (const e of config.eras) eraById[e.id] = e

  return {
    id: config.id,
    title: config.title,
    locales: {
      default: config.locales.default,
      available: [...config.locales.available],
      fallback: config.locales.fallback ?? config.locales.default,
      labels: config.locales.labels ?? {},
      names: config.locales.names ?? {},
    },
    periods,
    eras: config.eras,
    layout,
    loaders: config.loaders,
    assets: { baseUrl: config.assets?.baseUrl ?? '/' },
    i18n: { messages: config.i18n?.messages ?? {} },
    content: { welcome: config.content?.welcome, faq: config.content?.faq ?? [] },
    storage: {
      favorites: config.storage?.favorites ?? `${config.id}:favorites`,
      locale: config.storage?.locale ?? `${config.id}:locale`,
    },
    debug: config.debug ?? !!import.meta.env.DEV,
    byId,
    bySlug,
    eraById,
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k]
  }
  return out
}
