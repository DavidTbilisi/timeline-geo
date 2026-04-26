import { PERIODS, STAGE_WIDTH } from '@/data/periods'

export interface DateTick {
  x: number
  year: number
  major: boolean
}

function getMajorInterval(pxPerYear: number): number {
  if (pxPerYear >= 50) return 5
  if (pxPerYear >= 15) return 25
  if (pxPerYear >= 7) return 50
  if (pxPerYear >= 3) return 100
  return 500
}

function getMinorInterval(pxPerYear: number): number {
  if (pxPerYear >= 50) return 1
  if (pxPerYear >= 15) return 5
  if (pxPerYear >= 7) return 10
  if (pxPerYear >= 3) return 25
  return 100
}

let _cache: DateTick[] | null = null

export function getDateTicks(): DateTick[] {
  if (_cache) return _cache

  const ticks: DateTick[] = []
  const seen = new Set<number>()

  for (let pi = 0; pi < PERIODS.length; pi++) {
    const p = PERIODS[pi]
    const endYear = pi < PERIODS.length - 1 ? PERIODS[pi + 1].startYear : 2200

    const minorInterval = getMinorInterval(p.pxPerYear)
    const majorInterval = getMajorInterval(p.pxPerYear)
    const firstTick = Math.ceil(p.startYear / minorInterval) * minorInterval

    for (let year = firstTick; year < endYear; year += minorInterval) {
      if (seen.has(year)) continue
      seen.add(year)

      const x = Math.round(p.startPx + (year - p.startYear) * p.pxPerYear)
      if (x < 0 || x > STAGE_WIDTH) continue

      ticks.push({ x, year, major: year % majorInterval === 0 })
    }
  }

  _cache = ticks.sort((a, b) => a.x - b.x)
  return _cache
}
