import { describe, it, expect } from 'vitest'
import { resolveConfig } from '@lib/config/resolve'
import { layoutEvents, rowTop, footprint, type LayoutDiagnostics } from '@lib/layout/layoutEvents'
import { computeBandOffsets } from '@lib/layout/banding'
import type { TimelineEventInput } from '@lib/types/event'
import { minimalConfig } from './fixtures/minimalConfig'

const config = resolveConfig(minimalConfig())
const { periods, layout } = config
let nextId = 1
function ev(partial: Partial<TimelineEventInput> & { start: number; end?: number }): TimelineEventInput {
  const id = nextId++
  return { id, slug: `e${id}`, period: 1, type: 'minor', title: { en: `E${id}` }, end: partial.start, ...partial }
}

describe('rowTop / footprint', () => {
  it('derives row tops from the pitch and keeps the legacy row 0 at the stage top', () => {
    expect(rowTop(1, layout)).toBe(20)
    expect(rowTop(11, layout)).toBe(520)
    expect(rowTop(24, layout)).toBe(1170)
    expect(rowTop(0, layout)).toBe(0)
  })
  it('uses the card width for events without a bar', () => {
    expect(footprint({ width: 0 }, layout)).toBe(260)
    expect(footprint({ width: 1023 }, layout)).toBe(1023)
  })
})

describe('layoutEvents defaults', () => {
  it('projects the start year plus the event offset', () => {
    const [e] = layoutEvents([ev({ start: -500 })], periods, layout)
    expect(e.left).toBe(500 + layout.eventOffsetX)
    expect(e.width).toBe(0)
    expect(e.hoverWidth).toBe(0)
    expect(e.bar).toBe(false)
    expect(e.row).toBe(1)
    expect(e.top).toBe(20)
    expect(e.auto).toEqual({ left: true, width: true, hoverWidth: true, row: true, bar: true })
  })
  it('renders long majors as bars with the projected span', () => {
    // period 1: 1 px/yr → 400 years = 400 px ≥ barMinPx (360)
    const [bar, short] = layoutEvents([
      ev({ type: 'major', start: -900, end: -500 }),
      ev({ type: 'major', start: -900, end: -800 }),
    ], periods, layout)
    expect(bar.bar).toBe(true)
    expect(bar.width).toBe(400)
    expect(bar.hoverWidth).toBe(400)
    expect(short.bar).toBe(false)
    expect(short.width).toBe(0)
    expect(short.hoverWidth).toBe(100)
  })
  it('projects spans across a period boundary', () => {
    // -100 → 900; 100 → 1000 + 200 = 1200 → span 300
    const [e] = layoutEvents([ev({ start: -100, end: 100 })], periods, layout)
    expect(e.hoverWidth).toBe(300)
  })
  it('honours every authored override and reports it', () => {
    const [e] = layoutEvents([ev({ start: -500, layout: { left: 42, width: 7, hoverWidth: 9, row: 5, bar: true } })], periods, layout)
    expect(e).toMatchObject({ left: 42, width: 7, hoverWidth: 9, row: 5, bar: true, top: 220 })
    expect(e.auto).toEqual({ left: false, width: false, hoverWidth: false, row: false, bar: false })
  })
  it('rounds to one decimal like the source data', () => {
    const cfg = resolveConfig(minimalConfig({ periods: [{ ...minimalConfig().periods[0], pxPerYear: 1.1 }, ...minimalConfig().periods.slice(1)] }))
    const [e] = layoutEvents([ev({ start: -999, end: -998 })], cfg.periods, cfg.layout)
    expect(e.left).toBe(111.1)
    expect(e.hoverWidth).toBe(1.1)
  })
})

describe('row packing', () => {
  it('stacks overlapping minors on consecutive rows and reuses rows when free', () => {
    const out = layoutEvents([
      ev({ start: -1000 }),
      ev({ start: -900 }),   // within 260 px of the first → overlaps
      ev({ start: -500 }),   // clear of both → back to row 1
    ], periods, layout)
    expect(out.map(e => e.row)).toEqual([1, 2, 1])
  })
  it('reserves two rows for majors (80 px tall on a 50 px pitch)', () => {
    const out = layoutEvents([
      ev({ type: 'major', start: -1000 }),
      ev({ type: 'major', start: -1000 }),
      ev({ start: -1000 }),
    ], periods, layout)
    expect(out.map(e => e.row)).toEqual([1, 3, 5])
  })
  it('treats authored rows as obstacles', () => {
    const out = layoutEvents([
      ev({ type: 'major', start: -1000, layout: { row: 1 } }),
      ev({ start: -1000 }),
    ], periods, layout)
    expect(out[1].row).toBe(3)
  })
  it('keeps packGap between neighbours', () => {
    // second starts exactly at the first's right edge: still overlapping because of packGap (8)
    const out = layoutEvents([
      ev({ start: -1000 }),
      ev({ start: -1000 + 260 }),
      ev({ start: -1000 + 260 + 8 }),
    ], periods, layout)
    expect(out.map(e => e.row)).toEqual([1, 2, 1])
  })
  it('falls back to the least crowded row and reports overflow when rows run out', () => {
    const cfg = resolveConfig(minimalConfig({ layout: { maxRows: 1 } }))
    const diag: LayoutDiagnostics = { overflow: [] }
    const out = layoutEvents([ev({ start: -1000 }), ev({ start: -1000 }), ev({ start: -1000 })], cfg.periods, cfg.layout, diag)
    expect(out.map(e => e.row)).toEqual([1, 1, 1])
    expect(diag.overflow).toHaveLength(2)
    expect(out.every(e => e.row >= 1 && e.row <= 1)).toBe(true)
  })
  it('preserves input order', () => {
    const out = layoutEvents([ev({ start: -100 }), ev({ start: -900 }), ev({ start: -500 })], periods, layout)
    expect(out.map(e => e.start)).toEqual([-100, -900, -500])
  })
})

describe('computeBandOffsets', () => {
  it('drops a minor that overlaps a same-row bar into the sub-band', () => {
    const out = layoutEvents([
      ev({ type: 'major', start: -1000, end: -500, layout: { row: 4 } }),   // 500 px bar on row 4
      ev({ start: -900, layout: { row: 4 } }),                               // minor inside it
    ], periods, layout)
    const offsets = computeBandOffsets(out, layout)
    expect(offsets.get(out[1].slug)).toBe(layout.bandOffset)
    expect(offsets.has(out[0].slug)).toBe(false)
  })
  it('never shifts majors and skips the shift when the next row is occupied there', () => {
    const out = layoutEvents([
      ev({ type: 'major', start: -1000, end: -500, layout: { row: 4 } }),
      ev({ type: 'major', start: -900, layout: { row: 4 } }),   // major overlapping → not shifted
      ev({ start: -800, layout: { row: 4 } }),                  // minor overlapping...
      ev({ start: -800, layout: { row: 5 } }),                  // ...but row 5 has an event there
    ], periods, layout)
    const offsets = computeBandOffsets(out, layout)
    expect(offsets.size).toBe(0)
  })
})
