export interface Scripture {
  reference: string
  verses: { number: number; line: string }[]
}

export interface EventImage {
  file: string
  caption: string
}

export interface RelatedEvent {
  slug: string
  titleEn: string
  titleKa: string | null
}

export interface Video {
  title: string
  caption: string
  filename: string
}

export interface EventDetail {
  slug: string
  id: number
  period: number
  titleEn: string
  titleKa: string | null
  datesEn: string
  datesKa: string | null
  descriptionEn: string | null
  descriptionKa: string | null
  articleEn: string | null
  articleKa: string | null
  scriptures: Scripture[]
  related: RelatedEvent[]
  images: EventImage[]
  videos: Video[]
}
