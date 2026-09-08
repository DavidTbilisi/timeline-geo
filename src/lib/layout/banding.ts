import type { LaidOutEvent } from '../types/event'
import type { ResolvedLayoutOptions } from '../config/types'
import { footprint } from './layoutEvents'

/**
 * Per-event vertical offset (px), keyed by slug, for events that share a
 * row and overlap in x.
 *
 * Hand-authored datasets place long bars and shorter events that occurred
 * during that span on the same row, so their x-ranges literally overlap.
 * Trimming widths would kill the "this lasted X years" signal, so instead
 * the overlapping event drops into a sub-band `bandOffset` px below.
 *
 * Constraints:
 * - Only minors get shifted: they are the only events that fit in the row
 *   gap once shifted. Majors already extend past their row.
 * - Skip the shift if the minor would then collide with a row-(N+1) event
 *   in x, otherwise a same-row overlap is traded for a cross-row one.
 */
export function computeBandOffsets(
  events: readonly LaidOutEvent[],
  opts: Pick<ResolvedLayoutOptions, 'cardWidth' | 'bandOffset'>,
): Map<string, number> {
  const byRow = new Map<number, LaidOutEvent[]>()
  for (const e of events) {
    if (!byRow.has(e.row)) byRow.set(e.row, [])
    byRow.get(e.row)!.push(e)
  }

  const xRange = (e: LaidOutEvent) => ({ start: e.left, end: e.left + footprint(e, opts) })
  const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
    a.start < b.end && a.end > b.start

  const offsets = new Map<string, number>()
  for (const [rowNum, row] of byRow) {
    const sorted = [...row].sort((a, b) => a.left - b.left)
    const occupied: Array<{ start: number; end: number }> = []
    const nextRow = byRow.get(rowNum + 1) ?? []

    for (const e of sorted) {
      const r = xRange(e)
      const collidesSameRow = occupied.some((o) => overlaps(o, r))
      if (!collidesSameRow || e.type !== 'minor') {
        occupied.push(r)
        continue
      }
      const collidesNextRow = nextRow.some((other) => overlaps(xRange(other), r))
      if (collidesNextRow) {
        occupied.push(r)
        continue
      }
      offsets.set(e.slug, opts.bandOffset)
    }
  }
  return offsets
}
