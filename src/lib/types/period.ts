import type { LocalizedString } from './locale'

/** A contiguous span of the timeline with its own horizontal scale. */
export interface Period {
  id: number
  slug: string
  name: LocalizedString
  description?: LocalizedString
  /** CSS colour used for the period's bands, cards and accents. */
  color: string
  /** Id of the era this period belongs to. */
  era: number
  /** First year of the period (negative = BC, astronomical numbering). */
  startYear: number
  /** Horizontal scale inside this period. */
  pxPerYear: number
  /**
   * Stage x-offset where the period starts. Defaults to the cumulative
   * offset from the previous period (`prev.startPx + Δyears × prev.pxPerYear`).
   */
  startPx?: number
  /**
   * Year to centre the viewport on when navigating to this period, for
   * periods whose events cluster well after `startYear`. Defaults to `startYear`.
   */
  landingYear?: number
  /** Public asset path of the sidebar image (resolved through `assets.baseUrl`). */
  sidebarImage?: string
  /** Public asset path of the landing card image. */
  cardImage?: string
}

/** A period after `createTimeline` has filled in derived geometry. */
export interface ResolvedPeriod extends Period {
  startPx: number
  /** Stage x where the next period starts (or the stage ends). */
  endPx: number
  /** Position in the chronologically sorted period list. */
  index: number
}

/** A group of consecutive periods shown as one arch on the landing page. */
export interface Era {
  id: number
  name: LocalizedString
  description?: LocalizedString
  /** Ids of the periods in this era, in order. */
  periods: number[]
  /** Optional logo image; the engine renders the name as text when absent. */
  logo?: string
  /** Landing-page arch geometry override (px). Derived from the period span when absent. */
  arch?: { left: number; width: number }
}
