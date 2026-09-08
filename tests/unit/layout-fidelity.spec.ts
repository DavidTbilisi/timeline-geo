import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveConfig } from '@lib/config/resolve'
import { layoutEvents, type LayoutDiagnostics } from '@lib/layout/layoutEvents'
import type { Period, Era, TimelineEventInput } from '@lib/types'

/**
 * Fidelity guard: the layout engine, given only years, must reproduce the
 * hand-tuned pixel layout scraped from the source site for the Bible data.
 * Known deviations are pinned so a regression in the projection shows up,
 * while the informational table documents what the defaults would change.
 */
const read = <T>(rel: string) => JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8')) as T
const periods = read<Period[]>('content/periods.json')
const eras = read<Era[]>('content/eras.json')
const config = resolveConfig({
  id: 'fidelity',
  title: { en: 'x' },
  locales: { default: 'en', available: ['en'] },
  periods,
  eras,
  layout: { stageWidth: 68000, endYear: 2200 },
  loaders: { events: async () => [], detail: async () => null },
})

type Authored = NonNullable<TimelineEventInput['layout']>
const authored = new Map<string, Required<Authored>>()
const raw: TimelineEventInput[] = []
for (const p of periods) {
  for (const e of read<TimelineEventInput[]>(`content/events/period-${p.id}.json`)) {
    authored.set(e.slug, e.layout as Required<Authored>)
    const { layout: _dropped, ...stripped } = e
    raw.push(stripped)
  }
}

describe('layout fidelity against the authored Bible layout', () => {
  const diag: LayoutDiagnostics = { overflow: [] }
  const byPeriod = new Map<number, TimelineEventInput[]>()
  for (const e of raw) byPeriod.set(e.period, [...(byPeriod.get(e.period) ?? []), e])
  const laid = [...byPeriod.values()].flatMap(list => layoutEvents(list, config.periods, config.layout, diag))

  const near = (a: number, b: number) => Math.abs(a - b) <= 1
  const leftOutliers = laid.filter(e => !near(e.left, authored.get(e.slug)!.left)).map(e => e.slug)
  const bars = laid.filter(e => authored.get(e.slug)!.width > 0)
  const barWidthMatches = bars.filter(e => near(e.width, authored.get(e.slug)!.width) || near(e.hoverWidth, authored.get(e.slug)!.width)).length
  const hoverMatches = laid.filter(e => near(e.hoverWidth, authored.get(e.slug)!.hoverWidth)).length
  const barFlagMatches = laid.filter(e => e.bar === authored.get(e.slug)!.bar).length
  const rowMatches = laid.filter(e => e.row === authored.get(e.slug)!.row).length

  it('covers all 591 events', () => {
    expect(laid).toHaveLength(591)
  })

  it('reproduces every authored x position except the two hand-moved events', () => {
    // haran (period 2) starts after period 3 begins, and the source placed it with
    // period 2's scale rather than the chronological one; deadly-wound-healed was moved 370 px.
    expect(leftOutliers).toEqual(['haran', 'deadly-wound-healed'])
  })

  it('reproduces the projected width of most authored bars (the rest were hand-stretched)', () => {
    // 59 of 92 bars have width == projected span; the others are editorial.
    expect(bars).toHaveLength(92)
    expect(barWidthMatches).toBeGreaterThanOrEqual(58)
  })

  it('packs every event within maxRows', () => {
    expect(laid.every(e => e.row >= 1 && e.row <= config.layout.maxRows)).toBe(true)
  })

  it('reports how far the defaults are from the authored layout (informational)', () => {
    // eslint-disable-next-line no-console
    console.table({
      left: { matches: laid.length - leftOutliers.length, of: laid.length },
      barWidth: { matches: barWidthMatches, of: bars.length },
      hoverWidth: { matches: hoverMatches, of: laid.length },
      barFlag: { matches: barFlagMatches, of: laid.length },
      row: { matches: rowMatches, of: laid.length },
      packOverflow: { matches: diag.overflow.length, of: laid.length },
    })
    expect(hoverMatches).toBeGreaterThanOrEqual(400)
  })
})
