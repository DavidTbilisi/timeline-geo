import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows the app title in Georgian', async ({ page }) => {
    // Use role=heading to avoid matching the logo button that also contains the title
    await expect(page.getByRole('heading', { name: 'ბიბლიური ქრონოლოგია' })).toBeVisible()
  })

  test('renders all 13 period cards', async ({ page }) => {
    const cards = page.locator('.relative.flex-shrink-0.cursor-pointer')
    await expect(cards).toHaveCount(13)
  })

  test('period cards show Georgian names', async ({ page }) => {
    // Use level:3 headings to avoid matching era labels like "პატრიარქების ეპოქა"
    await expect(page.getByRole('heading', { name: 'პირველი თაობა', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ნოე და წარღვნა', level: 3 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'პატრიარქები', level: 3 })).toBeVisible()
  })

  test('era labels are shown in Georgian', async ({ page }) => {
    await expect(page.locator('text=პატრიარქების ეპოქა')).toBeVisible()
    await expect(page.locator('text=ისრაელის ეპოქა')).toBeVisible()
    await expect(page.locator('text=ქრისტეს ეპოქა')).toBeVisible()
  })

  test('clicking a period card navigates to timeline', async ({ page }) => {
    await page.getByRole('heading', { name: 'პირველი თაობა', level: 3 }).click()
    await expect(page).toHaveURL(/\/period\/first-generation/)
  })

  test('period card expands description on hover', async ({ page }) => {
    const card = page.locator('.relative.flex-shrink-0.cursor-pointer').first()
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
