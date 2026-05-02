/**
 * landing-drag.spec.ts
 *
 * Tests for drag/momentum scrolling on the landing-stage element.
 * The stage is a wide div (2525px at zoom-2) inside an overflow:hidden
 * container; dragging translates it via CSS transform translateX.
 */
import { test, expect } from './fixtures'

test.describe('Landing drag scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for period cards to be visible before interacting
    await page.waitForSelector('[data-testid="landing-stage"]', { state: 'visible' })
  })

  /**
   * Test 1: dragging the stage scrolls its content.
   *
   * We grab the stage bounding box, drag ~200px to the left (simulating
   * scrolling right), then verify the CSS transform's translateX has a
   * non-zero negative X value — i.e. the stage moved.
   */
  test('mouse drag on landing-stage scrolls the content', async ({ page }) => {
    const stage = page.locator('[data-testid="landing-stage"]')
    const box = await stage.boundingBox()
    if (!box) throw new Error('landing-stage not found')

    // Record transform before drag
    const transformBefore = await stage.evaluate(
      (el) => (el as HTMLElement).style.transform
    )

    // Perform a slow drag leftward (200 px) so pointermove fires multiple times
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Move in small increments to trigger multiple pointermove events
    for (let dx = 0; dx <= 200; dx += 20) {
      await page.mouse.move(startX - dx, startY)
    }
    await page.mouse.up()

    // Read the transform after drag
    const transformAfter = await stage.evaluate(
      (el) => (el as HTMLElement).style.transform
    )

    // The transform should now include a non-zero translateX
    expect(transformAfter).toMatch(/translateX\(-?\d+(\.\d+)?px\)/)
    // And it should be different from the initial state (which is '' or translateX(0px))
    expect(transformAfter).not.toBe(transformBefore)

    // Extract the translateX value and confirm it represents rightward scrolling
    const match = transformAfter.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)
    if (match) {
      const offsetPx = parseFloat(match[1])
      // Dragged left → stage shifted left → offset is negative
      expect(offsetPx).toBeLessThan(0)
    }
  })

  /**
   * Test 2: a quick flick produces momentum — the stage keeps moving after
   * pointerup.
   *
   * We perform a fast drag (move many pixels quickly) then sample the
   * transform immediately after pointerup and again ~100ms later; the
   * position should still be changing (momentum continuing to decay).
   */
  test('quick flick produces momentum after pointer release', async ({ page }) => {
    const stage = page.locator('[data-testid="landing-stage"]')
    const box = await stage.boundingBox()
    if (!box) throw new Error('landing-stage not found')

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    // Perform a fast drag — large distance, fewer steps → high velocity
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX - 300, startY, { steps: 3 })
    await page.mouse.up()

    // Read position immediately after release
    const transformAt0 = await stage.evaluate(
      (el) => (el as HTMLElement).style.transform
    )

    // Wait a short time for momentum frames to fire
    await page.waitForTimeout(120)

    // Read position after momentum has had time to continue
    const transformAt120 = await stage.evaluate(
      (el) => (el as HTMLElement).style.transform
    )

    // Both should have a translateX value
    expect(transformAt0).toMatch(/translateX\(-?\d+(\.\d+)?px\)/)
    expect(transformAt120).toMatch(/translateX\(-?\d+(\.\d+)?px\)/)

    // Extract numeric values
    const extract = (t: string) => {
      const m = t.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)
      return m ? parseFloat(m[1]) : 0
    }

    const pos0   = extract(transformAt0)
    const pos120 = extract(transformAt120)

    // Position must have changed (momentum still decaying), meaning the
    // scroll did not instantly stop at pointerup.
    expect(pos120).not.toBe(pos0)
    // Both should represent scrolling to the right (negative translateX)
    expect(pos120).toBeLessThan(0)
  })
})
