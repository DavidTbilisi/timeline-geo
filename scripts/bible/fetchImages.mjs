/**
 * fetchImages.mjs (Bible dataset, one-off source)
 * Downloads referenced images from timeline.biblehistory.com to public/media so
 * the local app stops 404'ing against the live CDN.
 *
 * Sources:
 *   - Event card thumbnails: content/events/period-N.json → event.image      (e.g. "media/images/t/{file}")
 *   - Detail panel images:   public/data/details/{slug}.json → images[].file (saved under "media/images/original/{file}")
 *
 * Usage:
 *   node scripts/bible/fetchImages.mjs                # download everything missing
 *   node scripts/bible/fetchImages.mjs --limit 20     # only first 20 missing
 *   node scripts/bible/fetchImages.mjs --concurrency 3
 *   node scripts/bible/fetchImages.mjs --delay 100
 *   node scripts/bible/fetchImages.mjs --redo         # re-download even if present
 *   node scripts/bible/fetchImages.mjs --strict       # exit non-zero if any image fails
 *
 * The images are decoration: the app hides a thumbnail whose request fails, so
 * a partial mirror is not an error. The script therefore exits 0 by default
 * (use --strict to change that), and gives up early when the first `--probe`
 * downloads all fail, which means the origin is unreachable from here rather
 * than that individual files are missing.
 */
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { parseArgs } from '../lib/cli.mjs'
import { ROOT, readJSON, writeJSON, listJSON, readEventsByPeriod } from '../lib/fs.mjs'
import { fetchWithRetry } from '../lib/http.mjs'
import { runPool } from '../lib/pool.mjs'
import { mkLog } from '../lib/log.mjs'

const log = mkLog('fetchImages')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const PUBLIC_DIR = resolve(ROOT, 'public')
const DEFAULT_ORIGIN = 'https://timeline.biblehistory.com'
const DETAIL_IMAGE_BASE = 'media/images/original/'

const args = parseArgs(process.argv.slice(2), { booleans: ['--redo', '--strict'] })
const LIMIT = args.int('--limit', 0)
const CONCURRENCY = Math.max(1, args.int('--concurrency', 3))
const DELAY_MS = args.int('--delay', 120)
const REDO = args.flag('--redo')
const STRICT = args.flag('--strict')
/** Give up once this many downloads have failed with none succeeding. */
const PROBE = args.int('--probe', 10)
/** Where to mirror from; overridable so the failure path can be exercised. */
const ORIGIN = args.value('--origin', DEFAULT_ORIGIN)

function collectRefs() {
  const refs = []
  const seen = new Set()
  const add = (rel) => {
    if (!rel) return
    const norm = rel.replace(/^\/+/, '').replace(/\\/g, '/')
    if (!seen.has(norm)) { seen.add(norm); refs.push(norm) }
  }
  for (const events of readEventsByPeriod().values()) for (const ev of events) add(ev.image)
  for (const slug of listJSON(DETAILS_DIR)) {
    for (const img of readJSON(resolve(DETAILS_DIR, slug + '.json')).images ?? []) if (img.file) add(DETAIL_IMAGE_BASE + img.file)
  }
  return refs
}

const urlFor = (rel) => `${ORIGIN}/${rel.split('/').map(encodeURIComponent).join('/')}`

let unreachable = false

async function downloadOne(rel) {
  if (unreachable) return { rel, status: 'skip' }
  const outPath = resolve(PUBLIC_DIR, rel)
  mkdirSync(dirname(outPath), { recursive: true })
  try {
    const buf = await fetchWithRetry(urlFor(rel), {
      as: 'buffer',
      timeoutMs: 30000,
      backoffMs: 800,
      headers: { 'User-Agent': 'timeline-geo-clone/0.1 (local dev mirror)' },
      onRetry: ({ attempt, error }) => log.warn('download attempt failed', { rel, attempt, error: error.message }),
    })
    writeFileSync(outPath, buf)
    return { rel, bytes: buf.length, status: 'ok' }
  } catch (err) {
    return { rel, status: 'fail', error: err.message }
  }
}

const allRefs = collectRefs()
log.info('collected refs', { count: allRefs.length })
const todo = REDO ? allRefs : allRefs.filter((rel) => {
  const p = resolve(PUBLIC_DIR, rel)
  if (!existsSync(p)) return true
  try { return statSync(p).size === 0 } catch { return true }
})
const work = LIMIT > 0 ? todo.slice(0, LIMIT) : todo
if (work.length === 0) {
  log.info('nothing to do — all images present locally')
  process.exit(0)
}
log.info('downloading', { work: work.length, todo: todo.length, concurrency: CONCURRENCY, delayMs: DELAY_MS })

let okCount = 0, failCount = 0, skipCount = 0, totalBytes = 0, done = 0
const failures = []
const start = Date.now()
await runPool(work, async (rel) => {
  const r = await downloadOne(rel)
  done++
  if (r.status === 'ok') { okCount++; totalBytes += r.bytes }
  else if (r.status === 'skip') { skipCount++ }
  else {
    failCount++
    failures.push(r)
    log.error('download failed', { rel: r.rel, error: r.error })
    // Every attempt so far has failed: the origin is unreachable from this
    // machine (blocked, offline, DNS). Retrying the rest would cost hours.
    if (okCount === 0 && failCount >= PROBE && !unreachable) {
      unreachable = true
      log.progressDone()
      log.warn('origin unreachable, skipping the rest', { origin: ORIGIN, failedProbes: failCount })
    }
  }
  log.progress(`${done}/${work.length} (${((done / work.length) * 100).toFixed(1)}%)  ok=${okCount} fail=${failCount} skip=${skipCount}  ${(totalBytes / 1024 / 1024).toFixed(1)}MB`)
  return r
}, { concurrency: CONCURRENCY, delayMs: DELAY_MS })
log.progressDone()
log.info('done', { seconds: ((Date.now() - start) / 1000).toFixed(1), ok: okCount, fail: failCount, skip: skipCount, mb: (totalBytes / 1024 / 1024).toFixed(1) })
if (failures.length) {
  writeJSON(resolve(ROOT, 'scripts/cache/_image_failures.json'), failures)
  log.warn('failures recorded', { count: failures.length, file: 'scripts/cache/_image_failures.json' })
}
// Missing images degrade gracefully in the app, so a partial mirror is not a
// build failure unless the caller asks for that.
if (STRICT && (failCount || skipCount)) process.exitCode = 2
