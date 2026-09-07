import { describe, it, expect } from 'vitest'
import { resolveConfig } from '@lib/config/resolve'
import { projectYear, yearAtPx, periodForYear, periodForPx } from '@lib/layout/projection'
import { minimalConfig } from './fixtures/minimalConfig'

// periods: 1 (-1000, 1px/yr, startPx 0), 2 (0, 2px/yr, 1000), 3 (500, 4px/yr, 2000); stage 2400
const { periods } = resolveConfig(minimalConfig())

describe('projection', () => {
  it('projects years piecewise per period', () => {
    expect(projectYear(periods, -1000)).toBe(0)
    expect(projectYear(periods, -500)).toBe(500)
    expect(projectYear(periods, 0)).toBe(1000)
    expect(projectYear(periods, 250)).toBe(1500)
    expect(projectYear(periods, 600)).toBe(2400)
  })
  it('extrapolates before the first and after the last period', () => {
    expect(projectYear(periods, -1100)).toBe(-100)
    expect(projectYear(periods, 1000)).toBe(4000)
  })
  it('yearAtPx inverts projectYear', () => {
    for (const y of [-1000, -333, 0, 1, 499, 500, 777]) {
      expect(yearAtPx(periods, projectYear(periods, y))).toBeCloseTo(y, 9)
    }
  })
  it('finds periods by year and by px', () => {
    expect(periodForYear(periods, -5000).id).toBe(1)
    expect(periodForYear(periods, -1).id).toBe(1)
    expect(periodForYear(periods, 0).id).toBe(2)
    expect(periodForYear(periods, 9999).id).toBe(3)
    expect(periodForPx(periods, 999)?.id).toBe(1)
    expect(periodForPx(periods, 1000)?.id).toBe(2)
    expect(periodForPx(periods, 2399)?.id).toBe(3)
    expect(periodForPx(periods, 2400)).toBeUndefined()
    expect(periodForPx(periods, -1)).toBeUndefined()
  })
})
