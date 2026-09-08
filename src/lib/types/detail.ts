import type { LocalizedString } from './locale'

export interface EventImage {
  file: string
  caption: string
}

export interface RelatedEvent {
  slug: string
  title: LocalizedString
}

export interface Video {
  title: string
  caption: string
  filename: string
}

/**
 * Extension point for dataset-specific detail data. Plugins augment this
 * interface with their own key:
 *
 *   declare module '@davidtbilisi/timeline-engine' {
 *     interface DetailExtensions { scriptures: Scripture[] }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DetailExtensions {}

/** The full record shown in the event overlay. */
export interface EventDetail {
  slug: string
  id: number
  period: number
  title: LocalizedString
  dates?: LocalizedString
  description?: LocalizedString
  /** Article body as HTML. */
  article?: LocalizedString
  related: RelatedEvent[]
  images: EventImage[]
  videos: Video[]
  extensions?: Partial<DetailExtensions>
}
