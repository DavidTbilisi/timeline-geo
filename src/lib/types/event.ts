import type { LocalizedString } from './locale'

/**
 * Hand-tuned layout values. Everything here is optional: the layout engine
 * derives positions from `start`/`end` and the period scale and honours any
 * value that is present.
 */
export interface EventLayoutOverride {
  /** Vertical row (0-based rows are a legacy quirk; 1..maxRows normally). */
  row?: number
  /** Stage x in px. */
  left?: number
  /** Rendered bar width in px (0 = card without a duration bar). */
  width?: number
  /** Width of the date-bar highlight on hover, in px. */
  hoverWidth?: number
  /** Render the title as a floating full-width label that follows the viewport. */
  bar?: boolean
}

/** An event as supplied by a content loader. */
export interface TimelineEventInput {
  id: number
  slug: string
  /** Id of the containing period. */
  period: number
  /** Start year (negative = BC). */
  start: number
  /** End year; equal to `start` for point events. */
  end: number
  type: 'major' | 'minor'
  /** `'small'` renders a compact major card. Defaults to `'normal'`. */
  size?: 'normal' | 'small'
  title: LocalizedString
  /** Pre-rendered date label. Derived from `start`/`end` when absent. */
  dates?: LocalizedString
  /** Public path of the card thumbnail. */
  image?: string | null
  layout?: EventLayoutOverride
}

/** An event with its layout resolved, ready to render. */
export interface LaidOutEvent extends TimelineEventInput {
  left: number
  width: number
  hoverWidth: number
  row: number
  bar: boolean
}
