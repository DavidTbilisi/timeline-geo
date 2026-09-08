import { describe, it, expect } from 'vitest'
import { resolveConfig } from '@lib/config/resolve'
import { resolveAsset } from '@lib/theme/assetUrl'
import { applyThemeVars } from '@lib/theme/applyThemeVars'
import { minimalConfig } from './fixtures/minimalConfig'

describe('resolveAsset', () => {
  it('joins the base URL and the path with exactly one slash', () => {
    const cfg = { assets: { baseUrl: '/tl/' } }
    expect(resolveAsset(cfg, '/css/img/a.jpg')).toBe('/tl/css/img/a.jpg')
    expect(resolveAsset(cfg, 'css/img/a.jpg')).toBe('/tl/css/img/a.jpg')
    expect(resolveAsset({ assets: { baseUrl: '/' } }, 'x.png')).toBe('/x.png')
  })
  it('leaves absolute and data URLs alone', () => {
    const cfg = { assets: { baseUrl: '/tl/' } }
    expect(resolveAsset(cfg, 'https://cdn.example/a.jpg')).toBe('https://cdn.example/a.jpg')
    expect(resolveAsset(cfg, '//cdn.example/a.jpg')).toBe('//cdn.example/a.jpg')
    expect(resolveAsset(cfg, 'data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
  })
})

describe('applyThemeVars', () => {
  it('emits period colours, layout sizes, fonts, textures and extra vars', () => {
    const cfg = resolveConfig(minimalConfig({
      assets: { baseUrl: '/tl/', paperBg: 'css/img/paper.jpg' },
      theme: { fonts: { sans: 'Foo, sans-serif' }, cssVars: { '--custom': '1' } },
      layout: { landingCardWidth: 100, landingCardGap: 10 },
    }))
    const el = document.createElement('div')
    applyThemeVars(cfg, el)
    const v = (n: string) => el.style.getPropertyValue(n)
    expect(v('--period-1')).toBe('#111')
    expect(v('--period-3')).toBe('#333')
    expect(v('--tl-period-count')).toBe('3')
    expect(v('--tl-card-width')).toBe('260px')
    expect(v('--tl-landing-card-pitch')).toBe('110px')
    expect(v('--tl-font-sans')).toBe('Foo, sans-serif')
    expect(v('--tl-font-display')).toBe('')
    expect(v('--tl-paper-bg')).toBe('url("/tl/css/img/paper.jpg")')
    expect(v('--tl-grid-lines')).toBe('')
    expect(v('--custom')).toBe('1')
  })
  it('clears variables that a re-applied config no longer sets', () => {
    const el = document.createElement('div')
    applyThemeVars(resolveConfig(minimalConfig({ theme: { fonts: { serif: 'Georgia' } } })), el)
    expect(el.style.getPropertyValue('--tl-font-serif')).toBe('Georgia')
    applyThemeVars(resolveConfig(minimalConfig()), el)
    expect(el.style.getPropertyValue('--tl-font-serif')).toBe('')
  })
})
