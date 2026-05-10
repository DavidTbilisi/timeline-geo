import { test, expect } from './fixtures'

/**
 * Issue #60 — In KA, the welcome heading text is "მოგესალმებით" but the
 * `.welcome h3` rule only specifies `hoeflernew_-swashitalic`, a Latin-only
 * swash italic with no Georgian glyphs. Without a Georgian-friendly fallback
 * the browser drops to the default sans-serif and the EN/KA panels look
 * jarringly different.
 *
 * Contract: the computed font-family stack on the welcome heading must
 * include a Georgian display fallback ("Noto Serif Georgian") so Georgian
 * glyphs render with a stylized serif rather than the system sans-serif.
 */
test.describe('Welcome heading font (issue #60)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('font-family stack includes a Georgian serif fallback', async ({ page }) => {
    const heading = page.locator('[data-testid="welcome-heading"]')
    await expect(heading).toBeVisible()
    const fontFamily = await heading.evaluate(
      (el) => getComputedStyle(el).fontFamily,
    )
    expect(fontFamily).toMatch(/Noto Serif Georgian/i)
    // The Latin swash font must still come first so EN renders ornate.
    expect(fontFamily).toMatch(/^['"]?hoeflernew_-swashitalic['"]?\s*,/i)
  })
})
