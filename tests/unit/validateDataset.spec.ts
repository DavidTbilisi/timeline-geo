import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateDataset } from '@lib/schema/validateDataset'

const read = (rel: string) => JSON.parse(readFileSync(resolve(process.cwd(), rel), 'utf8'))
function readDir(rel: string, pattern = /^period-(\d+)\.json$/) {
  const out: Record<string, unknown> = {}
  for (const f of readdirSync(resolve(process.cwd(), rel))) {
    const m = pattern.exec(f)
    if (m) out[m[1] ?? f.replace(/\.json$/, '')] = read(`${rel}/${f}`)
  }
  return out
}

const good = {
  periods: [
    { id: 1, slug: 'one', name: { en: 'One' }, color: '#111111', era: 1, startYear: -100, pxPerYear: 2 },
    { id: 2, slug: 'two', name: { en: 'Two' }, color: '#222', era: 1, startYear: 0, pxPerYear: 2 },
  ],
  eras: [{ id: 1, name: { en: 'Era' }, periods: [1, 2] }],
  site: { title: { en: 'T' } },
  events: {
    1: [{ id: 1, slug: 'a', period: 1, start: -50, end: -40, type: 'major', title: { en: 'A' } }],
    2: [{ id: 2, slug: 'b', period: 2, start: 5, end: 5, type: 'minor', title: { en: 'B' }, layout: { row: 3 } }],
  },
  details: {
    a: { slug: 'a', id: 1, period: 1, title: { en: 'A' }, related: [{ slug: 'b', title: { en: 'B' } }], images: [], videos: [] },
  },
}

describe('validateDataset', () => {
  it('accepts a consistent dataset and reports only the missing detail', () => {
    const r = validateDataset({ ...good, locales: ['en'] })
    expect(r.errors).toEqual([])
    expect(r.ok).toBe(true)
    expect(r.stats).toEqual({ periods: 2, eras: 1, events: 2, details: 1 })
    expect(r.warnings.map(w => w.message)).toEqual(['missing detail file for this event'])
  })

  it('reports schema violations with their location', () => {
    const r = validateDataset({ ...good, periods: [{ ...good.periods[0], color: 'red' }, good.periods[1]] })
    expect(r.ok).toBe(false)
    expect(r.errors[0].where).toBe('periods[0]')
    expect(r.errors[0].message).toMatch(/color/)
  })

  it('reports broken references', () => {
    const r = validateDataset({
      periods: [{ ...good.periods[0], era: 9 }, { ...good.periods[1], id: 1 }],
      eras: [{ id: 1, name: { en: 'E' }, periods: [1, 7] }],
      events: { 1: [{ id: 1, slug: 'a', period: 3, start: 10, end: 5, type: 'major', title: { en: 'A' }, layout: { row: 99 } }] },
      details: { z: { slug: 'y', id: 1, period: 1, title: { en: 'Y' } } },
    })
    const msgs = r.errors.map(e => e.message)
    expect(msgs).toEqual(expect.arrayContaining([
      'duplicate period id',
      'unknown period id 7',
      'era 9 does not exist',
      'period 3 does not exist',
      'end (5) is before start (10)',
      'layout.row 99 is outside 0..24',
      'slug "y" does not match the file name',
    ]))
  })

  it('warns about locales outside the configured set', () => {
    const r = validateDataset({ ...good, locales: ['de'] })
    expect(r.ok).toBe(true)
    expect(r.warnings.some(w => w.message.includes('locale "en"'))).toBe(true)
  })

  it('passes the Bible content', () => {
    const r = validateDataset({
      periods: read('content/periods.json'),
      eras: read('content/eras.json'),
      site: read('content/site.json'),
      events: readDir('content/events'),
      details: readDir('public/data/details', /^([^_].*)\.json$/),
      locales: ['ka', 'en'],
    })
    expect(r.errors).toEqual([])
    expect(r.stats.events).toBe(591)
    expect(r.stats.details).toBe(591)
  })

  it('passes the example content', () => {
    const r = validateDataset({
      periods: read('examples/minimal/content/periods.json'),
      eras: read('examples/minimal/content/eras.json'),
      events: readDir('examples/minimal/public/content/events'),
      details: readDir('examples/minimal/public/content/details', /^([^_].*)\.json$/),
      locales: ['en', 'de'],
    })
    expect(r.errors).toEqual([])
    expect(r.stats).toMatchObject({ periods: 3, eras: 2, events: 15, details: 3 })
  })
})
