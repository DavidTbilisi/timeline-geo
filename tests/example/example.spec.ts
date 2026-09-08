import { test, expect } from '@playwright/test'

/**
 * The synthetic "Lumen Valley" dataset: 2 eras, 3 periods, 15 events with
 * no authored layout, one dataset-specific detail tab, two locales.
 */
test.describe('example consumer (built package)', () => {
  test('landing renders one card per period and one arch per era, with text era names', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid^="period-card-"]')).toHaveCount(3)
    await expect(page.locator('[data-testid^="era-arch-"]')).toHaveCount(2)
    await expect(page.locator('[data-testid="era-arch-1"] h3')).toHaveText('Founding Age')
    await expect(page).toHaveTitle('Lumen Valley')
    // Stage width follows the period count: 3 × 185 + 2 × 60 = 675
    const width = await page.locator('[data-testid="landing-stage"]').evaluate(el => getComputedStyle(el).width)
    expect(width).toBe('675px')
  })

  test('timeline lays events out from years alone', async ({ page }) => {
    await page.goto('/period/settlement')
    await page.waitForSelector('.tl-event')
    const cards = page.locator('.tl-event')
    expect(await cards.count()).toBeGreaterThanOrEqual(5)
    // A 130-year lifespan in a 3 px/yr period is a 390 px bar.
    const mira = page.locator('.tl-event[data-slug="mira-the-mapmaker"]')
    await expect(mira).toHaveCSS('width', '390px')
    // The packer gave every event a row and a top.
    const rows = await cards.evaluateAll(els => els.map(e => ({ row: e.getAttribute('data-row'), top: (e as HTMLElement).style.top })))
    for (const r of rows) {
      expect(Number(r.row)).toBeGreaterThanOrEqual(1)
      expect(r.top).toMatch(/px$/)
    }
    // No two events share both a row and an x-range.
    const boxes = await cards.evaluateAll(els => els.map(e => ({ row: e.getAttribute('data-row'), left: parseFloat((e as HTMLElement).style.left), w: (e as HTMLElement).getBoundingClientRect().width })))
    for (const a of boxes) for (const b of boxes) {
      if (a === b || a.row !== b.row) continue
      const overlap = a.left < b.left + b.w && a.left + a.w > b.left
      expect(overlap).toBe(false)
    }
  })

  test('detail overlay shows the dataset tab and the built-in ones', async ({ page }) => {
    await page.goto('/event/founders-arrive')
    await expect(page.locator('.detail-overlay h1')).toHaveText('Founders arrive')
    await expect(page.getByTestId('tab-article')).toBeVisible()
    await expect(page.getByTestId('tab-notes')).toBeVisible()
    await expect(page.getByTestId('tab-related')).toBeVisible()
    await expect(page.getByTestId('tab-images')).toHaveCount(0)
    await page.getByTestId('tab-notes').click()
    await expect(page.locator('.detail-overlay li').first()).toContainText('fictional')
  })

  test('locale switcher swaps content and chrome', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('locale-toggle').click()
    await expect(page.locator('[data-testid="era-arch-1"] h3')).toHaveText('Gründungszeit')
    await expect(page).toHaveTitle('Lumen-Tal')
    await expect(page.locator('button:has-text("Favoriten")')).toBeVisible()
  })
})
