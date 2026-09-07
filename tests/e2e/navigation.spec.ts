import { test, expect } from './fixtures'
import { PERIODS, SITE, l } from './content'

test.describe('Navigation & Routing', () => {
  test('root path redirects to or renders the landing page', async ({ page }) => {
    await page.goto('/')
    // Landing rendered when period cards are present
    await expect(page.getByTestId('period-card-1')).toBeVisible({ timeout: 5000 })
  })

  test('unknown route redirects to landing page', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await expect(page).toHaveURL('/')
  })

  test('/period/:slug routes load the correct period', async ({ page }) => {
    // A spread of periods across the timeline: first, second, third, middle, last.
    const picks = [0, 1, 2, Math.floor(PERIODS.length / 2), PERIODS.length - 1]
    const slugs = picks.map(i => [PERIODS[i].slug, l(PERIODS[i].name)] as const)

    for (const [slug, georgianName] of slugs) {
      await page.goto(`/period/${slug}`)
      // Wait for the timeline and sidebar to fully load and settle
      await page.waitForSelector('[data-testid="tl-sidebar-active"]', { timeout: 8000 })
      await expect(page.locator('[data-testid="tl-sidebar-active"]')).toContainText(georgianName, { timeout: 8000 })
    }
  })

  test('app menu logo click navigates to landing', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator(`button:has-text("${l(SITE.title)}")`).click()
    await expect(page).toHaveURL('/')
  })

  test('browser back button works from detail to timeline', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    // Click event — now uses router.push so a new history entry is created
    await page.locator('.tl-event').first().click()
    await expect(page).toHaveURL(/\/event\//, { timeout: 3000 })

    await page.goBack()
    await expect(page).toHaveURL(/\/period\//, { timeout: 3000 })
  })

  test('FAQ panel opens and closes', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("კითხვა-პასუხი")').click()

    // FAQ modal should now be visible
    const modal = page.locator('[data-testid="faq-modal"]')
    await expect(modal).toBeVisible({ timeout: 3000 })

    // Click the backdrop (the modal root) at a position outside the inner dialog to close
    await modal.click({ position: { x: 10, y: 10 } })
    await expect(modal).not.toBeVisible({ timeout: 3000 })
  })

  test('favorites panel opens and shows empty state', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("რჩეულები")').click()

    // No favorites yet — should show empty state message
    await expect(page.locator('text=რჩეულები ცარიელია')).toBeVisible()
  })
})

test.describe('i18n – Language Switch', () => {
  test('switches UI to English and back', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('[data-testid="tl-sidebar-active"]', { timeout: 5000 })

    // Switch to English
    await page.locator('button:has-text("EN")').click()
    await expect(page.locator('[data-testid="tl-sidebar-active"]')).toContainText(l(PERIODS[0].name, 'en'))

    // Switch back to Georgian
    await page.locator('button:has-text("ქა")').click()
    await expect(page.locator('[data-testid="tl-sidebar-active"]')).toContainText(l(PERIODS[0].name))
  })

  test('year bubble uses Georgian BC suffix', async ({ page }) => {
    await page.goto('/period/first-generation')
    await expect(page.locator('.year-bubble')).toContainText('ძვ.წ.')
  })

  test('year bubble switches to English BC on locale change', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.locator('button:has-text("EN")').click()
    await expect(page.locator('.year-bubble')).toContainText('BC')
  })
})
