import { describe, it, expect } from 'vitest'
import { formatYear, formatDateRange } from '@lib/layout/dates'

const L = { bc: 'BC', ad: 'AD' }

describe('formatYear', () => {
  it('labels BC, AD and the missing year zero', () => {
    expect(formatYear(-3954, L)).toBe('3954 BC')
    expect(formatYear(70, L)).toBe('70 AD')
    expect(formatYear(0, L)).toBe('1 AD')
    expect(formatYear(-1, { bc: 'ძვ.წ.', ad: 'ახ.წ.' })).toBe('1 ძვ.წ.')
  })
})

describe('formatDateRange', () => {
  it('matches the authored label styles', () => {
    expect(formatDateRange(-3954, -3024, L, { showDuration: true })).toBe('3954–3024 BC (930)')
    expect(formatDateRange(-3954, -3024, L)).toBe('3954–3024 BC')
    expect(formatDateRange(-90, 3, L)).toBe('90 BC–3 AD')
    expect(formatDateRange(35, 70, L)).toBe('35–70 AD')
    expect(formatDateRange(5, 5, L)).toBe('5 AD')
    expect(formatDateRange(-4, 30, L, { showDuration: true })).toBe('4 BC–30 AD (34)')
  })
  it('treats a reversed range as a point', () => {
    expect(formatDateRange(10, 5, L)).toBe('10 AD')
  })
})
