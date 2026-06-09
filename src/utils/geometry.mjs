/**
 * Shared timeline geometry — single source of truth for the year↔pixel
 * arithmetic and the row/event height constants used by:
 *
 *   - Runtime: components, stores, composables (import via geometry.ts)
 *   - Build:   scripts/computeEventLayout.mjs  (imports this file directly)
 *
 * Kept as plain .mjs so the Node-ESM layout script can import it without
 * a TypeScript loader. The companion geometry.ts re-exports these symbols
 * with TS types for app code.
 */

// ── Stage / chrome dimensions ──────────────────────────────────────────────
/** Total px width of the entire timeline stage. */
export const STAGE_WIDTH = 68000
/** Fixed content height (px). */
export const STAGE_HEIGHT = 1440
/** Sidebar width on desktop (px). */
export const SIDEBAR_WIDTH = 220
/** Date bar height (px). */
export const DATEBAR_HEIGHT = 66
/** Period footer height (px). */
export const FOOTER_HEIGHT = 75

// ── Event row layout ──────────────────────────────────────────────────────
/** Vertical gap between row centers (px). Matches `.tl-event.row-N { top }`. */
export const ROW_GAP = 50
/** Top offset of row 1 (px). Matches `.tl-event.row-1 { top: 20px }`. */
export const ROW_TOP = 20
/** Fallback width for events whose source HTML omits an inline style.
 *  Matches `.tl-event.major { width: 260px }` in style.css. */
export const EVENT_DEFAULT_WIDTH = 260
/** Rendered heights by event variant. Matches style.css. */
export const EVENT_HEIGHTS = Object.freeze({
  minor: 30,
  majorSmall: 50,
  major: 80,
})

// ── Year ↔ pixel math (period-relative) ───────────────────────────────────
// A period is anything with { startPx, startYear, pxPerYear }. We don't
// constrain the shape here so both PeriodData (runtime) and the script's
// JSON-loaded periods can pass through identically.

/** Convert a year to its canonical px position inside `period`. */
export function yearToPx(year, period) {
  return period.startPx + (year - period.startYear) * period.pxPerYear
}

/** Convert a canonical px position inside `period` back to a year. */
export function pxToYear(px, period) {
  return period.startYear + (px - period.startPx) / period.pxPerYear
}

/** Top offset (px) of an event card in a given row, optionally shifted by
 *  a band-overlap `offset` (e.g. precomputed by computeEventLayout.mjs). */
export function eventTop(row, offset = 0) {
  return ROW_TOP + (row - 1) * ROW_GAP + offset
}

/** Rendered height (px) of an event card, dispatched on `type` and `size`. */
export function eventHeight(type, size) {
  if (type === 'minor') return EVENT_HEIGHTS.minor
  return size === 'small' ? EVENT_HEIGHTS.majorSmall : EVENT_HEIGHTS.major
}
