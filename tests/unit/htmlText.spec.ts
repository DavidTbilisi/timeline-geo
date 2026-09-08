import { describe, it, expect } from 'vitest'
import { htmlToPlainText } from '@lib/utils/htmlText'

describe('htmlToPlainText', () => {
  it('strips tags and decodes named + numeric entities', () => {
    expect(htmlToPlainText('3954&ndash;3024 <span>BC</span>')).toBe('3954–3024 BC')
    expect(htmlToPlainText('A &amp; B &#33; &lt;x&gt;')).toBe('A & B ! <x>')
  })

  it('returns an empty string for empty / nullish input', () => {
    expect(htmlToPlainText('')).toBe('')
  })
})
