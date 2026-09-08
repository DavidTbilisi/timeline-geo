export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * fetch() with retries, linear back-off and a per-attempt timeout.
 *
 *   await fetchWithRetry(url, { as: 'json' })
 *   await fetchWithRetry(url, { as: 'buffer', tries: 3, timeoutMs: 30000, backoffMs: 800 })
 *
 * `onRetry({ attempt, error })` is called before each retry.
 */
export async function fetchWithRetry(url, {
  tries = 3,
  timeoutMs = 20000,
  backoffMs = 1000,
  headers = {},
  as = 'text',
  onRetry,
  fetchImpl = globalThis.fetch,
} = {}) {
  let lastErr
  for (let attempt = 1; attempt <= tries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetchImpl(url, { signal: ctrl.signal, headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (as === 'json') return await res.json()
      if (as === 'buffer') {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length === 0) throw new Error('empty body')
        return buf
      }
      return await res.text()
    } catch (err) {
      lastErr = err
      if (attempt < tries) {
        onRetry?.({ attempt, error: err })
        await sleep(backoffMs * attempt)
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr
}
