import { test, expect } from './fixtures'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the app title in Georgian', async ({ page }) => {
    // App title is set on document.title via the i18n locale watcher in App.vue
    await expect(page).toHaveTitle(/ბიბლიური ქრონოლოგია/)
  })

  test('renders all 13 period cards', async ({ page }) => {
    const cards = page.locator('[data-testid^="period-card-"]')
    await expect(cards).toHaveCount(13)
  })

  test('period cards show Georgian names', async ({ page }) => {
    // Scope by period card testid so the era arch h3 with the same text doesn't collide
    await expect(page.getByTestId('period-card-1').getByRole('heading', { name: 'პირველი თაობა' })).toBeVisible()
    await expect(page.getByTestId('period-card-2').getByRole('heading', { name: 'ნოე და წარღვნა' })).toBeVisible()
    await expect(page.getByTestId('period-card-3').getByRole('heading', { name: 'პატრიარქები' })).toBeVisible()
  })

  test('era labels are shown in Georgian', async ({ page }) => {
    await expect(page.locator('text=პატრიარქების ეპოქა')).toBeVisible()
    await expect(page.locator('text=ისრაელის ეპოქა')).toBeVisible()
    await expect(page.locator('text=ქრისტეს ეპოქა')).toBeVisible()
  })

  test('clicking a period card navigates to timeline', async ({ page }) => {
    await page.getByTestId('period-card-1').click()
    await expect(page).toHaveURL(/\/period\/first-generation/)
  })

  test('period card expands description on hover', async ({ page }) => {
    const card = page.getByTestId('period-card-1')
    const initialHeight = await card.evaluate(el => el.getBoundingClientRect().height)
    await card.hover()
    await page.waitForTimeout(350) // transition duration
    const hoveredHeight = await card.evaluate(el => el.getBoundingClientRect().height)
    expect(hoveredHeight).toBeGreaterThan(initialHeight)
  })

  test('language toggle switches to English', async ({ page }) => {
    await page.locator('button:has-text("EN")').click()
    await expect(page.locator('text=First Generation')).toBeVisible()
    await expect(page.locator('text=Noah & the Flood')).toBeVisible()
  })

  test('language toggle switches back to Georgian', async ({ page }) => {
    // Switch to EN first
    await page.locator('button:has-text("EN")').click()
    // Switch back to Georgian
    await page.locator('button:has-text("ქა")').click()
    await expect(page.getByRole('heading', { name: 'პირველი თაობა', level: 3 })).toBeVisible()
  })
})
