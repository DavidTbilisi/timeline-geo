import { test, expect } from './fixtures'

/**
 * Issue #61 — the app used to fetch `Noto Sans Georgian` from
 * fonts.googleapis.com / fonts.gstatic.com at runtime. For an audience
 * that's primarily Georgian-speaking, depending on Google's CDN is a
 * reliability hazard (corporate networks may block it; offline use
 * fails). The fonts are now self-hosted under /fonts/.
 *
 * Contract: across the public surface (landing + a representative period
 * page) the browser must NOT request fonts.googleapis.com or
 * fonts.gstatic.com, and the @font-face stylesheet that declares the
 * self-hosted woff2 files must be wired in (the page font-family resolves
 * to "Noto Sans Georgian").
 */
test.describe('Self-hosted Georgian fonts (issue #61)', () => {
  test('landing page does not contact Google Fonts', async ({ page }) => {
    const googleFontReqs: string[] = []
    page.on('request', (req) => {
      const host = new URL(req.url()).host
      if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
        googleFontReqs.push(req.url())
      }
    })

    await page.goto('/')
    // Wait for fonts to be requested or skipped.
    await page.waitForLoadState('networkidle')
    expect(googleFontReqs).toEqual([])
  })

  test('period page does not contact Google Fonts', async ({ page }) => {
    const googleFontReqs: string[] = []
    page.on('request', (req) => {
      const host = new URL(req.url()).host
      if (host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
        googleFontReqs.push(req.url())
      }
    })

    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    expect(googleFontReqs).toEqual([])
  })

  test('Noto Sans Georgian woff2 is requested from local /fonts/', async ({ page }) => {
    const localFontReqs: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (url.includes('/fonts/noto-sans-georgian') && url.endsWith('.woff2')) {
        localFontReqs.push(url)
      }
    })

    await page.goto('/')
    // Force the browser to actually need a Georgian glyph by waiting for
    // any KA-text element to be visible.
    await page.locator('text=პატრიარქების ეპოქა').first().waitFor({ timeout: 5000 })
    await page.waitForLoadState('networkidle')
    expect(localFontReqs.length).toBeGreaterThanOrEqual(1)
    for (const url of localFontReqs) {
      expect(url).toMatch(/\/fonts\/noto-sans-georgian-(georgian|latin)\.woff2$/)
    }
  })
})
