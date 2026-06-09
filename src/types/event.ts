export interface TimelineEvent {
  id: number
  slug: string
  period: number
  start: number        // year (negative = BC)
  end: number          // year
  left: number         // px position on stage
  width: number        // px width (0 = point event)
  hoverWidth: number   // data-hover value
  row: number          // 1–24
  type: 'major' | 'minor'
  size: 'normal' | 'small'
  labelStyle: 'full' | 'default'
  titleEn: string
  datesEn: string
  imagePath: string | null
  titleKa: string | null
  datesKa: string | null
  /**
   * Optional vertical shift (px) from the natural row position, set by
   * `scripts/computeEventLayout.mjs` when the natural placement would
   * collide with an x-overlapping neighbour. Positive = down, negative
   * = up. Omitted when the event sits cleanly at its row.
   */
  topOffset?: number
}

export interface PeriodData {
  id: number
  slug: string
  // Display name + description live in src/i18n/locales/<code>.ts under
  // `periods.<slug>.{name,description}`. Look them up via
  // `usePeriodCopy()` so locale and fallback chain are handled centrally.
  color: string
  era: 1 | 2 | 3           // 1=Patriarchs, 2=Israel, 3=Christ
  startPx: number
  startYear: number
  /**
   * Optional viewport landing year. When the user navigates to this period,
   * the viewport is centered on this year instead of `startYear`. Used for
   * periods where events cluster well after the period's start (e.g. Life
   * of Christ has `startYear: -100` but the Christ events are at ~25 AD).
   * Defaults to `startYear` when omitted. See issue #53.
   */
  landingYear?: number
  pxPerYear: number
  sidebarImage: string
  landingImage: string
}
