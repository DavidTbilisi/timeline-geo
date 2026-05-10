/**
 * fetchImages.mjs
 * Downloads referenced images from timeline.biblehistory.com to public/media so
 * the local app stops 404'ing against the live CDN.
 *
 * Sources:
 *   - Event card thumbnails: src/data/events/period-N.json → ev.imagePath  (e.g. "media/images/t/{file}")
 *   - Detail panel images:   public/data/details/{slug}.json → images[].file  (saved under "media/images/original/{file}")
 *
 * Usage:
 *   node scripts/fetchImages.mjs                # download everything missing
 *   node scripts/fetchImages.mjs --limit 20     # only first 20 missing
 *   node scripts/fetchImages.mjs --concurrency 3
 *   node scripts/fetchImages.mjs --delay 100
 *   node scripts/fetchImages.mjs --redo         # re-download even if present
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, posix } from 'path'
import { fileURLToPath } from 'url'
import { mkLog } from './_log.mjs'

const log = mkLog('fetchImages')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EVENTS_DIR = resolve(ROOT, 'src/data/events')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const PUBLIC_DIR = resolve(ROOT, 'public')
const ORIGIN = 'https://timeline.biblehistory.com'

const args = process.argv.slice(2)
const argVal = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }
const argFlag = (n) => args.includes(n)

const LIMIT = parseInt(argVal('--limit') ?? '0', 10) || 0
const CONCURRENCY = Math.max(1, parseInt(argVal('--concurrency') ?? '3', 10))
const DELAY_MS = parseInt(argVal('--delay') ?? '120', 10)
const REDO = argFlag('--redo')

// ── Collect image references ─────────────────────────────────────────────────

function collectRefs() {
  /** @type {{rel: string}[]} */
  const refs = []
  const seen = new Set()
  const add = (rel) => {
    if (!rel) return
    const norm = rel.replace(/^\/+/, '').replace(/\\/g, '/')
    if (seen.has(norm)) return
    seen.add(norm)
    refs.push({ rel: norm })
  }

  // Thumbnails from extracted events
  for (let p = 1; p <= 13; p++) {
    const file = resolve(EVENTS_DIR, `period-${p}.json`)
    if (!existsSync(file)) continue
    const events = JSON.parse(readFileSync(file, 'utf8'))
    for (const ev of events) if (ev.imagePath) add(ev.imagePath)
  }

  // Detail panel images
  if (existsSync(DETAILS_DIR)) {
    for (const f of readdirSync(DETAILS_DIR)) {
      if (!f.endsWith('.json')) continue
      try {
        const d = JSON.parse(readFileSync(resolve(DETAILS_DIR, f), 'utf8'))
        for (const img of d.images ?? []) {
          if (!img.file) continue
          // template: media/images/original/{file}
          add(`media/images/original/${img.file}`)
        }
      } catch { /* skip malformed */ }
    }
  }

  return refs
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function urlFor(rel) {
  // Encode each path segment, preserve slashes
  const segs = rel.split('/').map((s) => encodeURIComponent(s))
  return `${ORIGIN}/${segs.join('/')}`
}

async function downloadOne(rel, { tries = 3 } = {}) {
  const url = urlFor(rel)
  const outPath = resolve(PUBLIC_DIR, rel)
  mkdirSync(dirname(outPath), { recursive: true })
  let lastErr
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 30000)
      const t0 = Date.now()
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'timeline-geo-clone/0.1 (local dev mirror)' },
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0) throw new Error('empty body')
      writeFileSync(outPath, buf)
      log.debug('downloaded', { rel, bytes: buf.length, ms: Date.now() - t0, attempt })
      return { rel, bytes: buf.length, status: 'ok' }
    } catch (err) {
      lastErr = err
      log.warn('download attempt failed', { rel, attempt, error: err.message })
      if (attempt < tries) await sleep(800 * attempt)
    }
  }
  return { rel, status: 'fail', error: lastErr.message }
}

// ── Concurrency-limited driver ────────────────────────────────────────────────

async function runPool(items, worker) {
  const results = []
  let next = 0
  let active = 0
  let resolveDone
  const done = new Promise((r) => (resolveDone = r))

  const startNext = () => {
    if (next >= items.length) {
      if (active === 0) resolveDone()
      return
    }
    const i = next++
    active++
    Promise.resolve(worker(items[i], i))
      .then((r) => results.push(r))
      .catch((e) => results.push({ error: e.message }))
      .finally(() => {
        active--
        // small inter-request gap to be polite
        setTimeout(() => {
          startNext()
        }, DELAY_MS)
      })
    if (active < CONCURRENCY) startNext()
  }
  startNext()
  await done
  return results
}

// ── Main ─────────────────────────────────────────────────────────────────────

const allRefs = collectRefs()
log.info('collected refs', { count: allRefs.length })

const todo = REDO
  ? allRefs
  : allRefs.filter(({ rel }) => {
      const p = resolve(PUBLIC_DIR, rel)
      if (!existsSync(p)) return true
      try { return statSync(p).size === 0 } catch { return true }
    })

let work = todo
if (LIMIT > 0) work = work.slice(0, LIMIT)

if (work.length === 0) {
  log.info('nothing to do — all images present locally')
  process.exit(0)
}

log.info('downloading', { work: work.length, todo: todo.length, concurrency: CONCURRENCY, delayMs: DELAY_MS })

let okCount = 0, failCount = 0, totalBytes = 0
const failures = []
let i = 0

const start = Date.now()
const results = await runPool(work, async (item) => {
  const r = await downloadOne(item.rel)
  i++
  if (r.status === 'ok') {
    okCount++
    totalBytes += r.bytes
  } else {
    failCount++
    failures.push(r)
    log.error('download failed', { rel: r.rel, error: r.error })
  }
  const pct = ((i / work.length) * 100).toFixed(1)
  log.progress(`${i}/${work.length} (${pct}%)  ok=${okCount} fail=${failCount}  ${(totalBytes/1024/1024).toFixed(1)}MB`)
  return r
})
log.progressDone()

const dt = ((Date.now() - start) / 1000).toFixed(1)
log.info('done', { seconds: dt, ok: okCount, fail: failCount, mb: (totalBytes/1024/1024).toFixed(1) })

if (failures.length) {
  const failPath = resolve(__dirname, 'cache/_image_failures.json')
  mkdirSync(dirname(failPath), { recursive: true })
  writeFileSync(failPath, JSON.stringify(failures, null, 2), 'utf8')
  log.warn('failures recorded', { file: posix.relative(ROOT.replace(/\\/g, '/'), failPath.replace(/\\/g, '/')) })
}
