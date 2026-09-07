import type { ResolvedTimelineConfig } from '@lib/config'

export interface DateTick {
  x: number
  year: number
  major: boolean
}

function getMajorInterval(pxPerYear: number): number {
  if (pxPerYear >= 50) return 1
  if (pxPerYear >= 15) return 5
  if (pxPerYear >= 7) return 10
  if (pxPerYear >= 3) return 25
  return 100
}

function getMinorInterval(pxPerYear: number): number {
  if (pxPerYear >= 50) return 1
  if (pxPerYear >= 15) return 1
  if (pxPerYear >= 7) return 5
  if (pxPerYear >= 3) return 5
  return 25
}

// Memoised per resolved period list, so a different config gets its own ticks.
const cache = new WeakMap<ResolvedTimelineConfig['periods'], DateTick[]>()

export function getDateTicks(config: ResolvedTimelineConfig): DateTick[] {
  const cached = cache.get(config.periods)
  if (cached) return cached

  const { periods, layout } = config
  const ticks: DateTick[] = []
  const seen = new Set<number>()

  for (let pi = 0; pi < periods.length; pi++) {
    const p = periods[pi]
    const endYear = pi < periods.length - 1 ? periods[pi + 1].startYear : layout.endYear

    const minorInterval = getMinorInterval(p.pxPerYear)
    const majorInterval = getMajorInterval(p.pxPerYear)
    const firstTick = Math.ceil(p.startYear / minorInterval) * minorInterval

    for (let year = firstTick; year < endYear; year += minorInterval) {
      if (seen.has(year)) continue
      seen.add(year)

      const x = Math.round(p.startPx + (year - p.startYear) * p.pxPerYear)
      if (x < 0 || x > layout.stageWidth) continue

      ticks.push({ x, year, major: year % majorInterval === 0 })
    }
  }

  const sorted = ticks.sort((a, b) => a.x - b.x)
  cache.set(config.periods, sorted)
  return sorted
}
