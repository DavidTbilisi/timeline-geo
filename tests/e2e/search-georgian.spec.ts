import { test, expect } from './fixtures'

const SEARCH_DROPDOWN = '.bg-stone-900.absolute'

/**
 * Issue #55 — Searching for Georgian text returned zero results because no
 * event ships with `titleKa` populated. The 13 PERIODS however do have
 * `nameKa`, so we can at least surface period-level matches when the
 * locale is KA: any event whose period name (KA or EN) contains the query
 * is returned, even if the event itself has no KA title.
 *
 * Contract: in KA mode, typing the Georgian name of a period (or part of
 * it) yields >= 1 result; the dropdown shows the count header in Georgian
 * and at least one event row.
 */
test.describe('Search — Georgian period-name matching (issue #55)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })
  })

  test('Georgian "პირველი" matches events in the First Generation period', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    // "პირველი" is the start of "პირველი თაობა" (First Generation) in src/data/periods.ts.
    await input.fill('პირველი')
    await page.waitForTimeout(300) // debounce

    const dropdown = page.locator(SEARCH_DROPDOWN)
    await expect(dropdown).toBeVisible({ timeout: 3000 })

    const resultButtons = page.locator(`${SEARCH_DROPDOWN} button`)
    await expect(resultButtons.first()).toBeVisible({ timeout: 3000 })
  })

  test('Georgian "ნოე" matches Noah-period events', async ({ page }) => {
    const input = page.getByPlaceholder('ძებნა...')
    // "ნოე" is the start of "ნოე და წარღვნა" (Noah & the Flood) in src/data/periods.ts.
    await input.fill('ნოე')
    await page.waitForTimeout(300)

    const resultButtons = page.locator(`${SEARCH_DROPDOWN} button`)
    await expect(resultButtons.first()).toBeVisible({ timeout: 3000 })
  })
})
