export interface EraLabels {
  /** Suffix for years before the common era, e.g. `'BC'`. */
  bc: string
  /** Suffix for years of the common era, e.g. `'AD'`. */
  ad: string
}

/** `-3954` → `'3954 BC'`, `70` → `'70 AD'`. Year 0 is shown as `'1 AD'` (no historical year zero). */
export function formatYear(year: number, labels: EraLabels): string {
  if (year < 0) return `${Math.abs(year)} ${labels.bc}`
  if (year === 0) return `1 ${labels.ad}`
  return `${year} ${labels.ad}`
}

export interface DateRangeOptions {
  /** Append the span in years, e.g. `'(930)'`. */
  showDuration?: boolean
  /** Separator between the two years. */
  separator?: string
}

/**
 * A human-readable label for an event's span:
 *   `'3954 BC'`, `'3954–3024 BC (930)'`, `'90 BC–3 AD'`, `'35–70 AD'`.
 */
export function formatDateRange(start: number, end: number, labels: EraLabels, opts: DateRangeOptions = {}): string {
  const sep = opts.separator ?? '–'
  if (end <= start) return formatYear(start, labels)
  const sameEra = (start < 0) === (end < 0) && start !== 0 && end !== 0
  const range = sameEra
    ? `${Math.abs(start)}${sep}${Math.abs(end)} ${start < 0 ? labels.bc : labels.ad}`
    : `${formatYear(start, labels)}${sep}${formatYear(end, labels)}`
  return opts.showDuration ? `${range} (${end - start})` : range
}
