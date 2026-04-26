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
}

export interface PeriodData {
  id: number
  slug: string
  nameEn: string
  nameKa: string | null
  descriptionEn: string
  descriptionKa: string | null
  color: string
  era: 1 | 2 | 3           // 1=Patriarchs, 2=Israel, 3=Christ
  startPx: number
  startYear: number
  pxPerYear: number
  sidebarImage: string
  landingImage: string
}
