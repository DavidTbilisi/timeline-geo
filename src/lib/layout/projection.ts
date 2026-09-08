import type { ResolvedPeriod } from '../types/period'

/**
 * Year ↔ stage-pixel projection. Each period is linear (`pxPerYear`) and
 * periods are laid end to end, so the projection is piecewise linear.
 * `periods` must be the chronologically sorted list from the resolved config.
 */

/** The period that contains `year`: the last one starting at or before it (the first for earlier years). */
export function periodForYear(periods: readonly ResolvedPeriod[], year: number): ResolvedPeriod {
  let found = periods[0]
  for (const p of periods) {
    if (p.startYear <= year) found = p
    else break
  }
  return found
}

/** The period whose `[startPx, endPx)` contains `px`, or `undefined` when `px` is off the stage. */
export function periodForPx(periods: readonly ResolvedPeriod[], px: number): ResolvedPeriod | undefined {
  return periods.find((p) => px >= p.startPx && px < p.endPx)
}

/** Stage x of a year (extrapolated with the first/last period's scale beyond the ends). */
export function projectYear(periods: readonly ResolvedPeriod[], year: number): number {
  const p = periodForYear(periods, year)
  return p.startPx + (year - p.startYear) * p.pxPerYear
}

/** Year at a stage x (extrapolated with the first/last period's scale beyond the ends). */
export function yearAtPx(periods: readonly ResolvedPeriod[], px: number): number {
  let p = periods[0]
  for (const q of periods) {
    if (q.startPx <= px) p = q
    else break
  }
  return p.startYear + (px - p.startPx) / p.pxPerYear
}
