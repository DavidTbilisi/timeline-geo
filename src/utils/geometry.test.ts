import { describe, expect, it } from 'vitest'
import { PERIODS } from '@/data/periods'
import {
  STAGE_WIDTH,
  ROW_GAP,
  ROW_TOP,
  EVENT_DEFAULT_WIDTH,
  EVENT_HEIGHTS,
  yearToPx,
  pxToYear,
  eventTop,
  eventHeight,
} from './geometry'

const EPS = 1e-6

describe('yearToPx / pxToYear', () => {
  it('round-trips a year through px for every period', () => {
    for (const p of PERIODS) {
      // Sample five interior years spread across the period (we don't know
      // the end year, so step at 4 px multiples which all periods support).
      for (let k = 0; k < 5; k++) {
        const year = p.startYear + k
        const px = yearToPx(year, p)
        const back = pxToYear(px, p)
        expect(Math.abs(back - year)).toBeLessThan(EPS)
      }
    }
  })

  it('puts a period start-year at its declared startPx', () => {
    for (const p of PERIODS) {
      expect(yearToPx(p.startYear, p)).toBe(p.startPx)
    }
  })
})

describe('period sequence', () => {
  it('startPx increases monotonically and stays inside the stage', () => {
    for (let i = 1; i < PERIODS.length; i++) {
      expect(PERIODS[i].startPx).toBeGreaterThan(PERIODS[i - 1].startPx)
    }
    const last = PERIODS[PERIODS.length - 1]
    expect(last.startPx).toBeLessThan(STAGE_WIDTH)
  })

  it('startYear is non-decreasing across periods', () => {
    for (let i = 1; i < PERIODS.length; i++) {
      expect(PERIODS[i].startYear).toBeGreaterThanOrEqual(PERIODS[i - 1].startYear)
    }
  })
})

describe('eventTop', () => {
  it('matches ROW_TOP + (row - 1) * ROW_GAP + offset', () => {
    expect(eventTop(1, 0)).toBe(ROW_TOP)
    expect(eventTop(2, 0)).toBe(ROW_TOP + ROW_GAP)
    expect(eventTop(3, 0)).toBe(ROW_TOP + 2 * ROW_GAP)
    expect(eventTop(1, 25)).toBe(ROW_TOP + 25)
    expect(eventTop(4, -15)).toBe(ROW_TOP + 3 * ROW_GAP - 15)
  })

  it('defaults offset to 0', () => {
    expect(eventTop(5)).toBe(ROW_TOP + 4 * ROW_GAP)
  })
})

describe('eventHeight', () => {
  it('returns minor height for minor events regardless of size', () => {
    expect(eventHeight('minor')).toBe(EVENT_HEIGHTS.minor)
    expect(eventHeight('minor', 'small')).toBe(EVENT_HEIGHTS.minor)
  })

  it('returns major heights for major events', () => {
    expect(eventHeight('major')).toBe(EVENT_HEIGHTS.major)
    expect(eventHeight('major', 'small')).toBe(EVENT_HEIGHTS.majorSmall)
  })
})

describe('constants', () => {
  it('EVENT_DEFAULT_WIDTH matches the CSS .tl-event.major fallback', () => {
    expect(EVENT_DEFAULT_WIDTH).toBe(260)
  })

  it('EVENT_HEIGHTS matches the CSS heights', () => {
    expect(EVENT_HEIGHTS.minor).toBe(30)
    expect(EVENT_HEIGHTS.majorSmall).toBe(50)
    expect(EVENT_HEIGHTS.major).toBe(80)
  })
})
