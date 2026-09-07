import type { ResolvedPeriod } from '../types/period'
import type { TimelineEventInput, LaidOutEvent } from '../types/event'
import type { ResolvedLayoutOptions } from '../config/types'
import { projectYear } from './projection'

const round1 = (n: number) => Math.round(n * 10) / 10

/** Top edge (px) of a row. Row 0 is a legacy quirk that renders at the stage top. */
export function rowTop(row: number, opts: Pick<ResolvedLayoutOptions, 'rowOffset' | 'rowPitch'>): number {
  return row <= 0 ? 0 : opts.rowOffset + (row - 1) * opts.rowPitch
}

/** Horizontal space an event occupies: its bar, or the default card width. */
export function footprint(e: Pick<LaidOutEvent, 'width'>, opts: Pick<ResolvedLayoutOptions, 'cardWidth'>): number {
  return e.width > 0 ? e.width : opts.cardWidth
}

/** Rendered height of an event, from its type and size. */
export function eventHeight(
  e: Pick<TimelineEventInput, 'type' | 'size'>,
  opts: Pick<ResolvedLayoutOptions, 'majorHeight' | 'smallHeight' | 'minorHeight'>,
): number {
  if (e.type === 'minor') return opts.minorHeight
  return e.size === 'small' ? opts.smallHeight : opts.majorHeight
}

type Interval = [start: number, end: number]

function overlaps(list: Interval[], a: number, b: number): boolean {
  for (const [s, e] of list) if (s < b && e > a) return true
  return false
}

function overlapLength(list: Interval[], a: number, b: number): number {
  let total = 0
  for (const [s, e] of list) total += Math.max(0, Math.min(e, b) - Math.max(s, a))
  return total
}

/**
 * Resolve every event's geometry from its years and the period scales.
 *
 * - `left`  = projection of `start` + `eventOffsetX`
 * - `bar`   = major events whose projected span is at least `barMinPx`
 * - `width` = the projected span for bars, else 0 (a fixed-width card)
 * - `hoverWidth` = the projected span (date-bar highlight on hover)
 * - `row`   = greedy packing into the lowest row whose x-range is free,
 *             treating events with an authored row as fixed obstacles
 *
 * Any value present in `event.layout` wins over the computed one, so a
 * hand-tuned dataset renders exactly as authored. Input order is preserved.
 */
export interface LayoutDiagnostics {
  /** Slugs the packer could not place without an x-overlap (rows exhausted). */
  overflow: string[]
}

export function layoutEvents(
  events: readonly TimelineEventInput[],
  periods: readonly ResolvedPeriod[],
  opts: ResolvedLayoutOptions,
  diag?: LayoutDiagnostics,
): LaidOutEvent[] {
  const out: LaidOutEvent[] = events.map((e) => {
    const x0 = projectYear(periods, e.start)
    const x1 = projectYear(periods, e.end)
    const span = Math.max(0, x1 - x0)
    const o = e.layout ?? {}
    const bar = o.bar ?? (e.type === 'major' && span >= opts.barMinPx)
    const width = o.width ?? (bar ? round1(span) : 0)
    return {
      ...e,
      left: o.left ?? round1(x0 + opts.eventOffsetX),
      width,
      hoverWidth: o.hoverWidth ?? round1(span),
      bar,
      row: o.row ?? -1, // placeholder until packed
      top: 0,
      auto: {
        left: o.left == null,
        width: o.width == null,
        hoverWidth: o.hoverWidth == null,
        row: o.row == null,
        bar: o.bar == null,
      },
    }
  })

  // Occupied x-intervals per row. Events taller than one row pitch reserve
  // the rows they spill into as well.
  const occupied = new Map<number, Interval[]>()
  const reserve = (row: number, span: number, a: number, b: number) => {
    for (let r = row; r < row + span; r++) {
      if (!occupied.has(r)) occupied.set(r, [])
      occupied.get(r)!.push([a, b])
    }
  }
  const rowSpan = (e: LaidOutEvent) => Math.max(1, Math.ceil(eventHeight(e, opts) / opts.rowPitch))

  for (const e of out) {
    if (!e.auto.row) reserve(e.row, rowSpan(e), e.left, e.left + footprint(e, opts))
  }

  const pending = out
    .filter((e) => e.auto.row)
    .sort((a, b) => a.left - b.left || footprint(b, opts) - footprint(a, opts))

  for (const e of pending) {
    const span = rowSpan(e)
    const a = e.left - opts.packGap
    const b = e.left + footprint(e, opts) + opts.packGap
    let chosen = -1
    for (let r = 1; r + span - 1 <= opts.maxRows; r++) {
      let free = true
      for (let k = r; k < r + span; k++) {
        if (overlaps(occupied.get(k) ?? [], a, b)) { free = false; break }
      }
      if (free) { chosen = r; break }
    }
    if (chosen === -1) {
      // No free row: take the least crowded one.
      let best = Infinity
      for (let r = 1; r + span - 1 <= opts.maxRows; r++) {
        let len = 0
        for (let k = r; k < r + span; k++) len += overlapLength(occupied.get(k) ?? [], a, b)
        if (len < best) { best = len; chosen = r }
      }
      if (chosen === -1) chosen = 1
      diag?.overflow.push(e.slug)
    }
    e.row = chosen
    reserve(chosen, span, e.left, e.left + footprint(e, opts))
  }

  for (const e of out) e.top = rowTop(e.row, opts)
  return out
}
