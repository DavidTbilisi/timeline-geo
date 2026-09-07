import { describe, it, expect } from 'vitest'
import { pickLocalized, pickLocalizedEntry, localeChain, localizeEraTokens } from '@lib/i18n/localized'
import { resolveConfig } from '@lib/config/resolve'
import { minimalConfig } from './fixtures/minimalConfig'

const config = resolveConfig(minimalConfig({ locales: { default: 'ka', available: ['ka', 'en', 'de'], fallback: 'en' } }))

describe('localeChain', () => {
  it('puts the active locale first, then fallback, default, then the rest, deduplicated', () => {
    expect(localeChain('de', config)).toEqual(['de', 'en', 'ka'])
    expect(localeChain('ka', config)).toEqual(['ka', 'en', 'de'])
  })
})

describe('pickLocalized', () => {
  it('returns the first non-empty translation along the chain', () => {
    expect(pickLocalized({ en: 'Adam', ka: 'ადამი' }, ['ka', 'en'])).toBe('ადამი')
    expect(pickLocalized({ en: 'Adam', ka: '' }, ['ka', 'en'])).toBe('Adam')
    expect(pickLocalized({ en: 'Adam' }, ['de', 'ka', 'en'])).toBe('Adam')
  })
  it('accepts plain strings and reports no source locale for them', () => {
    expect(pickLocalized('plain', ['ka'])).toBe('plain')
    expect(pickLocalizedEntry('plain', ['ka'])).toEqual({ text: 'plain', locale: null })
  })
  it('returns the fallback text for missing values', () => {
    expect(pickLocalized(undefined, ['ka'])).toBe('')
    expect(pickLocalized({}, ['ka'], '—')).toBe('—')
    expect(pickLocalizedEntry({ de: 'x' }, ['ka', 'en'])).toBeNull()
  })
  it('reports which locale the text came from', () => {
    expect(pickLocalizedEntry({ en: 'Adam' }, ['ka', 'en'])).toEqual({ text: 'Adam', locale: 'en' })
  })
})

describe('localizeEraTokens', () => {
  it('replaces whole-word BC/AD tokens only', () => {
    expect(localizeEraTokens('3954–3024 BC (930)', { bc: 'ძვ.წ.', ad: 'ახ.წ.' })).toBe('3954–3024 ძვ.წ. (930)')
    expect(localizeEraTokens('90 BC–3 AD', { bc: 'b', ad: 'a' })).toBe('90 b–3 a')
    expect(localizeEraTokens('ABCD', { bc: 'x', ad: 'y' })).toBe('ABCD')
  })
})
