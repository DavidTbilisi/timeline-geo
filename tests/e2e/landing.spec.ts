import { test, expect } from './fixtures'
import { PERIODS, ERAS, SITE, l } from './content'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the app title in Georgian', async ({ page }) => {
    // App title is set on document.title via the i18n locale watcher in App.vue
    await expect(page).toHaveTitle(new RegExp(l(SITE.title)))
  })

  test('renders a card for every period', async ({ page }) => {
    const cards = page.locator('[data-testid^="period-card-"]')
    await expect(cards).toHaveCount(PERIODS.length)
  })

  test('period cards show Georgian names', async ({ page }) => {
    // Scope by period card testid so the era arch h3 with the same text doesn't collide
    for (const p of PERIODS.slice(0, 3)) {
      await expect(page.getByTestId(`period-card-${p.id}`).getByRole('heading', { name: l(p.name), exact: true })).toBeVisible()
    }
  })

  test('era labels are shown in Georgian', async ({ page }) => {
    for (const era of ERAS) {
      await expect(page.locator(`text=${l(era.name)}`)).toBeVisible()
    }
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
    await expect(page.locator(`text=${l(PERIODS[0].name, 'en')}`)).toBeVisible()
    await expect(page.locator(`text=${l(PERIODS[1].name, 'en')}`)).toBeVisible()
  })

  test('language toggle switches back to Georgian', async ({ page }) => {
    // Switch to EN first
    await page.locator('button:has-text("EN")').click()
    // Switch back to Georgian
    await page.locator('button:has-text("ქა")').click()
    await expect(page.getByRole('heading', { name: l(PERIODS[0].name), level: 3 })).toBeVisible()
  })
})
