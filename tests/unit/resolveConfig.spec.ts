import { describe, it, expect } from 'vitest'
import { resolveConfig, resolvePeriods } from '@lib/config/resolve'
import { deepMerge, buildMessages } from '@lib/i18n/messages'
import { minimalConfig } from './fixtures/minimalConfig'

describe('resolvePeriods', () => {
  it('derives startPx cumulatively and endPx from the next period', () => {
    const { periods, stageWidth } = resolvePeriods(minimalConfig().periods, {})
    expect(periods.map(p => p.startPx)).toEqual([0, 1000, 2000])
    // endYear defaults to last.startYear + 100 → 2000 + 100*4
    expect(stageWidth).toBe(2400)
    expect(periods.map(p => p.endPx)).toEqual([1000, 2000, 2400])
    expect(periods.map(p => p.index)).toEqual([0, 1, 2])
  })
  it('honours explicit startPx and stageWidth overrides and sorts by startYear', () => {
    const cfg = minimalConfig()
    const shuffled = [cfg.periods[2], { ...cfg.periods[0] }, { ...cfg.periods[1], startPx: 1234 }]
    const { periods, stageWidth } = resolvePeriods(shuffled, { stageWidth: 9000 })
    expect(periods.map(p => p.id)).toEqual([1, 2, 3])
    expect(periods[1].startPx).toBe(1234)
    // period 3 chains off the overridden value: 1234 + 500 * 2
    expect(periods[2].startPx).toBe(2234)
    expect(stageWidth).toBe(9000)
    expect(periods[2].endPx).toBe(9000)
  })
})

describe('resolveConfig', () => {
  it('fills defaults, lookup maps and storage keys', () => {
    const c = resolveConfig(minimalConfig())
    expect(c.locales.fallback).toBe('en')
    expect(c.layout.sidebarWidth).toBe(220)
    expect(c.layout.futureFromYear).toBe(Number.POSITIVE_INFINITY)
    expect(c.bySlug.two.id).toBe(2)
    expect(c.byId[3].slug).toBe('three')
    expect(c.eraById[2].name.en).toBe('Late')
    expect(c.storage).toEqual({ favorites: 'test:favorites', locale: 'test:locale' })
    expect(c.assets.baseUrl).toBe('/')
    expect(c.content.faq).toEqual([])
  })
  it('rejects duplicate ids, unknown eras and a default locale that is not available', () => {
    const dup = minimalConfig()
    dup.periods[1] = { ...dup.periods[1], id: 1 }
    expect(() => resolveConfig(dup)).toThrow(/duplicate period id/)
    const badEra = minimalConfig()
    badEra.periods[0] = { ...badEra.periods[0], era: 9 }
    expect(() => resolveConfig(badEra)).toThrow(/unknown era/)
    expect(() => resolveConfig(minimalConfig({ locales: { default: 'fr', available: ['en'] } }))).toThrow(/locales.default/)
  })
})

describe('messages', () => {
  it('deep-merges consumer messages over the engine chrome without mutating inputs', () => {
    const base = { a: { b: 1, c: 2 }, d: 3 }
    const out = deepMerge(base, { a: { c: 9, e: 8 }, f: 7 })
    expect(out).toEqual({ a: { b: 1, c: 9, e: 8 }, d: 3, f: 7 })
    expect(base).toEqual({ a: { b: 1, c: 2 }, d: 3 })
  })
  it('keeps engine English and adds every consumer locale', () => {
    const c = resolveConfig(minimalConfig({
      locales: { default: 'ka', available: ['ka', 'en'] },
      i18n: { messages: { ka: { nav: { faq: 'კითხვა' } }, en: { detail: { tabs: { extra: 'Extra' } } } } },
    }))
    const m = buildMessages(c)
    expect((m.en as any).nav.faq).toBe('FAQ')
    expect((m.en as any).detail.tabs.article).toBe('Article')
    expect((m.en as any).detail.tabs.extra).toBe('Extra')
    expect((m.ka as any).nav.faq).toBe('კითხვა')
  })
})
