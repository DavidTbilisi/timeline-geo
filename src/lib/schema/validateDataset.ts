import type { ZodType } from 'zod'
import { periodSchema, eraSchema, eventSchema, detailSchema, siteSchema } from './index'
import type { PeriodInput, EraInput, EventInput, DetailInput } from './index'

export interface Finding {
  level: 'error' | 'warning'
  /** Where the problem is, e.g. `periods[3]`, `events/period-2.json[7]`, `details/adam.json`. */
  where: string
  message: string
}

export interface DatasetInput {
  periods: unknown
  eras: unknown
  site?: unknown
  /** Event arrays keyed by the period id they were loaded for. */
  events?: Record<string, unknown>
  /** Detail records keyed by slug (usually the file name). */
  details?: Record<string, unknown>
  /** When given, localized values with other locale keys are reported. */
  locales?: string[]
  /** Highest row `layout.row` may use. Defaults to 24. */
  maxRows?: number
}

export interface DatasetReport {
  ok: boolean
  errors: Finding[]
  warnings: Finding[]
  stats: { periods: number; eras: number; events: number; details: number }
}

function parseList<T>(schema: ZodType<T>, value: unknown, where: string, out: Finding[]): T[] {
  if (!Array.isArray(value)) {
    out.push({ level: 'error', where, message: 'expected an array' })
    return []
  }
  const items: T[] = []
  value.forEach((item, i) => {
    const r = schema.safeParse(item)
    if (r.success) items.push(r.data)
    else for (const issue of r.error.issues) out.push({ level: 'error', where: `${where}[${i}]`, message: `${issue.path.join('.') || '(root)'}: ${issue.message}` })
  })
  return items
}

function checkLocales(value: unknown, where: string, locales: Set<string>, out: Finding[]) {
  if (!value || typeof value !== 'object') return
  for (const key of Object.keys(value as object)) {
    if (!locales.has(key)) out.push({ level: 'warning', where, message: `locale "${key}" is not in the configured locales` })
  }
}

/** Validate periods, eras, site strings, events and details, plus the references between them. */
export function validateDataset(input: DatasetInput): DatasetReport {
  const errors: Finding[] = []
  const warnings: Finding[] = []
  const locales = input.locales?.length ? new Set(input.locales) : null
  const maxRows = input.maxRows ?? 24

  const periods = parseList<PeriodInput>(periodSchema, input.periods, 'periods', errors)
  const eras = parseList<EraInput>(eraSchema, input.eras, 'eras', errors)
  if (input.site !== undefined) {
    const r = siteSchema.safeParse(input.site)
    if (!r.success) for (const issue of r.error.issues) errors.push({ level: 'error', where: 'site', message: `${issue.path.join('.')}: ${issue.message}` })
    else if (locales) {
      checkLocales(r.data.title, 'site.title', locales, warnings)
      if (r.data.welcome) {
        checkLocales(r.data.welcome.heading, 'site.welcome.heading', locales, warnings)
        checkLocales(r.data.welcome.body, 'site.welcome.body', locales, warnings)
      }
    }
  }

  // ── periods / eras ──
  const periodIds = new Set<number>()
  const periodSlugs = new Set<string>()
  for (const p of periods) {
    if (periodIds.has(p.id)) errors.push({ level: 'error', where: `periods (id ${p.id})`, message: 'duplicate period id' })
    if (periodSlugs.has(p.slug)) errors.push({ level: 'error', where: `periods (slug ${p.slug})`, message: 'duplicate period slug' })
    periodIds.add(p.id)
    periodSlugs.add(p.slug)
    if (locales) {
      checkLocales(p.name, `periods (${p.slug}).name`, locales, warnings)
      checkLocales(p.description, `periods (${p.slug}).description`, locales, warnings)
    }
  }
  const eraIds = new Set<number>()
  const periodEraCount = new Map<number, number>()
  for (const e of eras) {
    if (eraIds.has(e.id)) errors.push({ level: 'error', where: `eras (id ${e.id})`, message: 'duplicate era id' })
    eraIds.add(e.id)
    for (const pid of e.periods) {
      if (!periodIds.has(pid)) errors.push({ level: 'error', where: `eras (id ${e.id}).periods`, message: `unknown period id ${pid}` })
      periodEraCount.set(pid, (periodEraCount.get(pid) ?? 0) + 1)
    }
    if (locales) checkLocales(e.name, `eras (id ${e.id}).name`, locales, warnings)
  }
  for (const p of periods) {
    if (!eraIds.has(p.era)) errors.push({ level: 'error', where: `periods (${p.slug})`, message: `era ${p.era} does not exist` })
    const n = periodEraCount.get(p.id) ?? 0
    if (n !== 1) errors.push({ level: 'error', where: `periods (${p.slug})`, message: n === 0 ? 'not listed in any era' : `listed in ${n} eras` })
    const era = eras.find(e => e.id === p.era)
    if (era && !era.periods.includes(p.id)) errors.push({ level: 'error', where: `periods (${p.slug})`, message: `era ${p.era} does not list this period` })
  }
  const sorted = [...periods].sort((a, b) => a.startYear - b.startYear)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startYear === sorted[i - 1].startYear) warnings.push({ level: 'warning', where: `periods (${sorted[i].slug})`, message: `starts in the same year as ${sorted[i - 1].slug}` })
  }

  // ── events ──
  const eventSlugs = new Map<string, string>()
  const eventIds = new Map<number, string>()
  let eventCount = 0
  for (const [key, list] of Object.entries(input.events ?? {})) {
    const where = `events/period-${key}.json`
    const events = parseList<EventInput>(eventSchema, list, where, errors)
    events.forEach((e, i) => {
      eventCount++
      const at = `${where}[${i}] (${e.slug})`
      if (!periodIds.has(e.period)) errors.push({ level: 'error', where: at, message: `period ${e.period} does not exist` })
      if (String(e.period) !== key) warnings.push({ level: 'warning', where: at, message: `event.period is ${e.period} but the file is for period ${key}` })
      if (eventSlugs.has(e.slug)) errors.push({ level: 'error', where: at, message: `duplicate event slug (also in ${eventSlugs.get(e.slug)})` })
      eventSlugs.set(e.slug, where)
      if (eventIds.has(e.id)) errors.push({ level: 'error', where: at, message: `duplicate event id ${e.id} (also in ${eventIds.get(e.id)})` })
      eventIds.set(e.id, where)
      if (e.end < e.start) errors.push({ level: 'error', where: at, message: `end (${e.end}) is before start (${e.start})` })
      if (e.layout?.row != null && (e.layout.row < 0 || e.layout.row > maxRows)) errors.push({ level: 'error', where: at, message: `layout.row ${e.layout.row} is outside 0..${maxRows}` })
      if (locales) {
        checkLocales(e.title, `${at}.title`, locales, warnings)
        checkLocales(e.dates, `${at}.dates`, locales, warnings)
      }
    })
  }

  // ── details ──
  let detailCount = 0
  for (const [key, value] of Object.entries(input.details ?? {})) {
    const where = `details/${key}.json`
    const r = detailSchema.safeParse(value)
    if (!r.success) {
      for (const issue of r.error.issues) errors.push({ level: 'error', where, message: `${issue.path.join('.') || '(root)'}: ${issue.message}` })
      continue
    }
    detailCount++
    const d: DetailInput = r.data
    if (d.slug !== key) errors.push({ level: 'error', where, message: `slug "${d.slug}" does not match the file name` })
    if (!periodIds.has(d.period)) errors.push({ level: 'error', where, message: `period ${d.period} does not exist` })
    if (eventSlugs.size && !eventSlugs.has(d.slug)) warnings.push({ level: 'warning', where, message: 'no event with this slug' })
    for (const rel of d.related) {
      if (eventSlugs.size && !eventSlugs.has(rel.slug)) warnings.push({ level: 'warning', where: `${where}.related`, message: `related slug "${rel.slug}" is not an event` })
    }
    if (locales) {
      checkLocales(d.title, `${where}.title`, locales, warnings)
      checkLocales(d.description, `${where}.description`, locales, warnings)
      checkLocales(d.article, `${where}.article`, locales, warnings)
    }
  }
  if (eventSlugs.size && input.details) {
    for (const slug of eventSlugs.keys()) {
      if (!(slug in input.details)) warnings.push({ level: 'warning', where: `details/${slug}.json`, message: 'missing detail file for this event' })
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: { periods: periods.length, eras: eras.length, events: eventCount, details: detailCount },
  }
}
