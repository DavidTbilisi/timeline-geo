import { test, expect } from './fixtures'

/**
 * Non-conflict rule: when one event's time-range is contained inside
 * another's (event A spans years 1–6, event B spans 2–4 → B lives
 * entirely inside A's span), the layout must keep both cards fully
 * visible by placing them in different rows so their bounding rects
 * do NOT intersect.
 *
 * Picture two cards on a strip: the smaller-span card sits above (or
 * below) the larger one with a clear gap between them. Stacking them on
 * top of each other — even with the smaller in front — hides part of
 * the larger card under the smaller and is treated as a conflict here.
 *
 * The periods below cover all 13 period JSONs at least once
 * (TimelineStage loads the active period ± 1 neighbour).
 */
const PERIOD_SLUGS = [
  'noah-and-the-flood',          // covers 1, 2, 3
  'egypt-to-canaan',             // covers 3, 4, 5
  'united-kingdom',              // covers 5, 6, 7
  'life-of-christ',              // covers 8, 9, 10
  'reformation',                 // covers 11, 12, 13
]

test.describe('Timeline events: contained-span events do not conflict', () => {
  for (const slug of PERIOD_SLUGS) {
    test(`/period/${slug}: rects don't intersect when one span contains another`, async ({ page }) => {
      await page.goto(`/period/${slug}`)
      await page.waitForSelector('.tl-event', { timeout: 10000 })
      // Allow neighbour-period JSONs to load and the stage to re-render
      await page.waitForLoadState('networkidle')

      const conflicts = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('.tl-event')) as HTMLElement[]
        type Info = {
          slug: string
          left: number; right: number; top: number; bottom: number
          width: number; height: number
        }
        const infos: Info[] = els.map((el, i) => {
          const r = el.getBoundingClientRect()
          return {
            slug: el.dataset.slug ?? `idx-${i}`,
            left: r.left, right: r.right, top: r.top, bottom: r.bottom,
            width: r.width, height: r.height,
          }
        })

        // Strict x-containment with non-zero width difference. Equal x-ranges
        // (data duplicates) aren't a smaller-vs-larger case.
        const xContains = (outer: Info, inner: Info) =>
          outer.left <= inner.left &&
          outer.right >= inner.right &&
          outer.width > inner.width

        // Allow ~1px of sub-pixel rendering slop on each axis.
        const EPS = 1
        const rectsIntersect = (a: Info, b: Info) =>
          a.left + EPS < b.right  && a.right > b.left + EPS &&
          a.top  + EPS < b.bottom && a.bottom > b.top  + EPS

        const out: Array<{
          smaller: string
          larger: string
          smallerRect: { left: number; top: number; width: number; height: number }
          largerRect: { left: number; top: number; width: number; height: number }
        }> = []
        for (let i = 0; i < infos.length; i++) {
          for (let j = 0; j < infos.length; j++) {
            if (i === j) continue
            const larger = infos[i], smaller = infos[j]
            if (!xContains(larger, smaller)) continue
            if (!rectsIntersect(larger, smaller)) continue
            out.push({
              smaller: smaller.slug,
              larger: larger.slug,
              smallerRect: {
                left: Math.round(smaller.left),
                top: Math.round(smaller.top),
                width: Math.round(smaller.width),
                height: Math.round(smaller.height),
              },
              largerRect: {
                left: Math.round(larger.left),
                top: Math.round(larger.top),
                width: Math.round(larger.width),
                height: Math.round(larger.height),
              },
            })
          }
        }
        return out
      })

      expect(
        conflicts,
        `Smaller-span events whose rects intersect the containing event ` +
          `in /period/${slug} — both should be in different rows so each is ` +
          `fully visible:\n` +
          JSON.stringify(conflicts, null, 2),
      ).toEqual([])
    })
  }

  /**
   * Sanity-check the detector itself on a synthetic case: a small card
   * whose x-range sits inside a larger one's, both at overlapping y.
   * The detector must flag this as a conflict — otherwise the real-data
   * tests are meaningless.
   */
  test('detector flags an intentional rect-intersection (self-check)', async ({ page }) => {
    await page.goto('/period/first-generation')
    await page.waitForSelector('.tl-event', { timeout: 10000 })

    const flagged = await page.evaluate(() => {
      const stage = document.querySelector('.tl-stage') as HTMLElement | null
      if (!stage) return null

      // Smaller's x-range (110–150) sits inside larger's (80–200).
      // Their y-ranges (100–120 vs 80–160) overlap → conflict.
      const smaller = document.createElement('div')
      smaller.className = 'tl-event'
      smaller.dataset.slug = '__test_small__'
      smaller.setAttribute('style',
        'position:absolute;left:110px;top:100px;width:40px;height:20px;background:red;')

      const larger = document.createElement('div')
      larger.className = 'tl-event'
      larger.dataset.slug = '__test_large__'
      larger.setAttribute('style',
        'position:absolute;left:80px;top:80px;width:120px;height:80px;background:blue;')

      stage.appendChild(smaller)
      stage.appendChild(larger)

      const s = smaller.getBoundingClientRect()
      const l = larger.getBoundingClientRect()
      const xContains = l.left <= s.left && l.right >= s.right && l.width > s.width
      const EPS = 1
      const intersects =
        l.left + EPS < s.right  && l.right > s.left + EPS &&
        l.top  + EPS < s.bottom && l.bottom > s.top  + EPS

      smaller.remove()
      larger.remove()

      return { xContains, intersects }
    })

    expect(flagged?.xContains, 'self-check: larger should x-contain smaller').toBe(true)
    expect(flagged?.intersects, 'self-check: rects should intersect').toBe(true)
  })
})
