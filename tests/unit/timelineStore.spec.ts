import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resolveConfig } from '@lib/config/resolve'
import { setActiveConfig } from '@lib/config/inject'
import { useTimelineStore } from '@lib/stores/timeline'
import { minimalConfig } from './fixtures/minimalConfig'

// periods: 1 [0,1000), 2 [1000,2000), 3 [2000,2400)
function setup(overrides = {}) {
  setActivePinia(createPinia())
  setActiveConfig(resolveConfig(minimalConfig(overrides)))
  return useTimelineStore()
}

describe('timeline store: active period detection', () => {
  beforeEach(() => { /* fresh pinia per test via setup() */ })

  it('picks the period under the viewport centre for wide periods', () => {
    const store = setup()
    store.setViewportWidth(600)            // probe = 300 - 17 = 283 (< narrowest period 400)
    store.setScroll(0)
    expect(store.activePeriod).toBe(1)
    store.setScroll(800)                    // 800 + 283 = 1083 → period 2
    expect(store.activePeriod).toBe(2)
  })

  it('clamps the probe to the narrowest period so small periods still activate at their start', () => {
    const store = setup()
    store.setViewportWidth(1280)           // centre probe would be 623 > period 3's 400 px
    store.setScroll(2000)                   // start of period 3
    expect(store.activePeriod).toBe(3)
    store.setScroll(0)
    expect(store.activePeriod).toBe(1)
  })

  it('leaves the active period unchanged for off-stage positions', () => {
    const store = setup()
    store.setViewportWidth(600)
    store.setScroll(2100)
    expect(store.activePeriod).toBe(3)
    store.setScroll(-5000)
    expect(store.activePeriod).toBe(3)
  })

  it('computes the current year with the active period scale and labels eras', () => {
    const store = setup({ layout: { futureFromYear: 600 } })
    store.setViewportWidth(600)
    store.setScroll(0)                      // centre px = 300 - 24 = 276 → year -1000 + 276 = -724
    expect(store.currentYear).toBe(-724)
    expect(store.currentYearLabel).toEqual({ value: 724, era: 'bc' })
    store.setScroll(1100)                   // active 2; centre = 1376 → year 0 + (1376-1000)/2 = 188
    expect(store.currentYearLabel).toEqual({ value: 188, era: 'ad' })
  })

  it('scrolls to a period start, or centres its landingYear', () => {
    const store = setup({ periods: minimalConfig().periods.map(p => p.id === 2 ? { ...p, landingYear: 100 } : p) })
    store.setViewportWidth(400)
    expect(store.scrollToPeriod(3)).toBe(2000)
    // landing px = 1000 + 100 * 2 = 1200; centred → 1200 - 200
    expect(store.scrollToPeriod(2)).toBe(1000)
  })
})
