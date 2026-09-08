import { test, expect } from './fixtures'
import { PERIODS, hexToRgb } from './content'

/**
 * The engine stylesheet takes colours and sizes from CSS custom properties
 * emitted by applyThemeVars(); hover fills use --period-color set inline
 * per element. Screenshots don't cover hover, so pin it here.
 */
test.describe('theme variables', () => {
  test('root carries the period palette and layout sizes', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid^="period-card-"]')
    const vars = await page.evaluate(() => {
      const s = document.documentElement.style
      return {
        count: s.getPropertyValue('--tl-period-count'),
        first: s.getPropertyValue('--period-1'),
        cardWidth: s.getPropertyValue('--tl-card-width'),
        paper: s.getPropertyValue('--tl-paper-bg'),
        sans: s.getPropertyValue('--tl-font-sans'),
      }
    })
    expect(vars.count).toBe(String(PERIODS.length))
    expect(vars.first).toBe(PERIODS[0].color)
    expect(vars.cardWidth).toBe('260px')
    expect(vars.paper).toContain('paper-bg.jpg')
    expect(vars.sans).toContain('Noto Sans Georgian')
  })

  test('landing card hover fills with the period colour', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId(`period-card-${PERIODS[2].id}`)
    await card.hover()
    await page.waitForTimeout(300)
    const bg = await card.locator('.info').evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe(hexToRgb(PERIODS[2].color))
  })

  test('event card hover fills with its period colour', async ({ page }) => {
    await page.goto(`/period/${PERIODS[0].slug}`)
    await page.waitForSelector('.tl-event.major')
    const card = page.locator('.tl-event.major').first()
    await card.hover()
    await page.waitForTimeout(200)
    const bg = await card.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe(hexToRgb(PERIODS[0].color))
  })
})
