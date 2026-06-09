/**
 * Typed wrapper around `geometry.mjs`. App code should import from here so
 * the period-arg arithmetic carries TS types. The script side (Node-ESM)
 * imports `geometry.mjs` directly.
 */
import type { PeriodData, TimelineEvent } from '@/types/event'

export {
  STAGE_WIDTH,
  STAGE_HEIGHT,
  SIDEBAR_WIDTH,
  DATEBAR_HEIGHT,
  FOOTER_HEIGHT,
  ROW_GAP,
  ROW_TOP,
  EVENT_DEFAULT_WIDTH,
  EVENT_HEIGHTS,
} from './geometry.mjs'

import {
  yearToPx as _yearToPx,
  pxToYear as _pxToYear,
  eventTop as _eventTop,
  eventHeight as _eventHeight,
} from './geometry.mjs'

/** A minimal period shape sufficient for year/px math. */
export type PeriodGeometry = Pick<PeriodData, 'startPx' | 'startYear' | 'pxPerYear'>

export function yearToPx(year: number, period: PeriodGeometry): number {
  return _yearToPx(year, period)
}

export function pxToYear(px: number, period: PeriodGeometry): number {
  return _pxToYear(px, period)
}

export function eventTop(row: number, offset = 0): number {
  return _eventTop(row, offset)
}

export function eventHeight(
  type: TimelineEvent['type'],
  size?: TimelineEvent['size'],
): number {
  return _eventHeight(type, size)
}
