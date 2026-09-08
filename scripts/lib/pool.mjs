import { sleep } from './http.mjs'

/**
 * Run `worker(item, index)` over `items` with at most `concurrency` in flight
 * and `delayMs` between starts on the same slot. Results keep input order;
 * a rejected worker becomes `{ error }` instead of aborting the run.
 */
export async function runPool(items, worker, { concurrency = 3, delayMs = 0 } = {}) {
  const results = new Array(items.length)
  let next = 0
  async function slot() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = await worker(items[i], i)
      } catch (e) {
        results[i] = { error: e instanceof Error ? e.message : String(e) }
      }
      if (delayMs && next < items.length) await sleep(delayMs)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, slot))
  return results
}
