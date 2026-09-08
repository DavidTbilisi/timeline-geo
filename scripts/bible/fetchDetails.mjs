/**
 * fetchDetails.mjs (Bible dataset, one-off source)
 * Fetches per-event detail JSON from the live biblehistory.com PHP endpoint,
 * caches raw responses, and writes mapped detail files into public/data/details.
 *
 * Phases:
 *   1. fetch  — pull raw JSON for each slug into scripts/cache/details/{slug}.json
 *   2. map    — cached raw → public/data/details/{slug}.json, keeping every
 *               locale other than `en` (translations only exist locally)
 *
 * Usage:
 *   node scripts/bible/fetchDetails.mjs                 # fetch missing + map all
 *   node scripts/bible/fetchDetails.mjs --limit 5       # only first 5 slugs
 *   node scripts/bible/fetchDetails.mjs --slug adam     # single slug
 *   node scripts/bible/fetchDetails.mjs --map-only      # skip fetch, re-map from cache
 *   node scripts/bible/fetchDetails.mjs --refetch       # re-fetch even if cached
 *   node scripts/bible/fetchDetails.mjs --delay 400     # ms between requests (default 250)
 */
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from '../lib/cli.mjs'
import { ROOT, readJSON, writeJSON, listJSON, readEventsByPeriod } from '../lib/fs.mjs'
import { fetchWithRetry, sleep } from '../lib/http.mjs'
import { mergeDetail } from '../lib/merge.mjs'
import { mkLog } from '../lib/log.mjs'

const log = mkLog('fetchDetails')
const CACHE_DIR = resolve(ROOT, 'scripts/cache/details')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const ENDPOINT = 'https://timeline.biblehistory.com/php/event_detail.php'
const SOURCE_LOCALE = 'en'

const args = parseArgs(process.argv.slice(2), { booleans: ['--map-only', '--refetch'] })
const LIMIT = args.int('--limit', 0)
const SINGLE_SLUG = args.value('--slug', null)
const MAP_ONLY = args.flag('--map-only')
const REFETCH = args.flag('--refetch')
const DELAY_MS = args.int('--delay', 250)

mkdirSync(CACHE_DIR, { recursive: true })
mkdirSync(DETAILS_DIR, { recursive: true })

const eventsByPeriod = readEventsByPeriod()
const eventBySlug = new Map()
for (const events of eventsByPeriod.values()) for (const ev of events) eventBySlug.set(ev.slug, ev)

// ── Fetch phase ──────────────────────────────────────────────────────────────

async function runFetch(slugs) {
  const todo = REFETCH ? slugs : slugs.filter((s) => !existsSync(resolve(CACHE_DIR, `${s}.json`)))
  if (todo.length === 0) {
    log.info('all slugs already cached (use --refetch to redo)')
    return { ok: 0, fail: 0, skipped: slugs.length }
  }
  log.info('starting fetch', { todo: todo.length, total: slugs.length, delayMs: DELAY_MS })
  let ok = 0
  let fail = 0
  const failures = []
  for (let i = 0; i < todo.length; i++) {
    const slug = todo[i]
    try {
      const data = await fetchWithRetry(`${ENDPOINT}?slug=${encodeURIComponent(slug)}`, {
        as: 'json',
        headers: { 'User-Agent': 'timeline-geo-clone/0.1 (local dev mirror)', Accept: 'application/json' },
        onRetry: ({ attempt, error }) => log.warn('fetch attempt failed', { slug, attempt, error: error.message }),
      })
      writeJSON(resolve(CACHE_DIR, `${slug}.json`), data)
      ok++
      log.progress(`${i + 1}/${todo.length} (${(((i + 1) / todo.length) * 100).toFixed(1)}%)  ok=${ok} fail=${fail}  last=${slug}`)
    } catch (err) {
      fail++
      failures.push({ slug, error: err.message })
      log.progressDone()
      log.error('fetch failed', { slug, error: err.message })
    }
    if (i < todo.length - 1) await sleep(DELAY_MS)
  }
  log.progressDone()
  if (failures.length) {
    writeJSON(resolve(CACHE_DIR, '_failures.json'), failures)
    log.warn('failures recorded', { count: failures.length, file: 'scripts/cache/details/_failures.json' })
  }
  return { ok, fail, skipped: slugs.length - todo.length }
}

// ── Map phase ────────────────────────────────────────────────────────────────

const text = (v) => { const s = v == null ? '' : String(v).trim(); return s.length ? s : undefined }
const loc = (v) => { const s = text(v); return s ? { [SOURCE_LOCALE]: s } : undefined }

function mapRawToDetail(slug, raw, fallback) {
  const out = {
    slug,
    id: typeof raw.id === 'number' ? raw.id : parseInt(raw.id, 10) || fallback?.id || 0,
    period: typeof raw.period === 'number' ? raw.period : parseInt(raw.period, 10) || fallback?.period || 1,
    title: loc(raw.title) ?? fallback?.title ?? {},
  }
  const dates = loc(raw.dates) ?? fallback?.dates; if (dates) out.dates = dates
  const description = loc(raw.description); if (description) out.description = description
  const article = loc(raw.article); if (article) out.article = article
  out.related = Array.isArray(raw.related) ? raw.related.map((r) => ({ slug: String(r.slug ?? ''), title: loc(r.title) ?? {} })) : []
  out.images = Array.isArray(raw.images) ? raw.images.map((img) => ({ file: String(img.file ?? ''), caption: String(img.caption ?? '') })) : []
  out.videos = Array.isArray(raw.videos) ? raw.videos.map((v) => ({ title: String(v.title ?? ''), caption: String(v.caption ?? ''), filename: String(v.filename ?? '') })) : []
  if (Array.isArray(raw.scriptures) && raw.scriptures.length) {
    out.extensions = {
      scriptures: raw.scriptures.map((s) => ({
        reference: String(s.reference ?? ''),
        verses: Array.isArray(s.verses)
          ? s.verses.map((v) => ({ number: typeof v.number === 'number' ? v.number : parseInt(v.number, 10) || 0, line: String(v.line ?? '') }))
          : [],
      })),
    }
  }
  return out
}

function runMap(slugs) {
  log.info('starting map', { slugs: slugs.length })
  let written = 0
  let missing = 0
  for (const slug of slugs) {
    const cachePath = resolve(CACHE_DIR, `${slug}.json`)
    if (!existsSync(cachePath)) { missing++; continue }
    const fresh = mapRawToDetail(slug, readJSON(cachePath), eventBySlug.get(slug))
    const outPath = resolve(DETAILS_DIR, `${slug}.json`)
    const existing = existsSync(outPath) ? readJSON(outPath) : null
    const keep = existing ? [...new Set(['title', 'dates', 'description', 'article'].flatMap((f) => Object.keys(existing[f] ?? {})))].filter((l) => l !== SOURCE_LOCALE) : []
    writeJSON(outPath, mergeDetail(existing, fresh, { keep }))
    written++
  }
  log.info('map done', { written, missing })
}

// ── Main ─────────────────────────────────────────────────────────────────────

let slugs = SINGLE_SLUG ? [SINGLE_SLUG] : [...eventBySlug.keys()]
if (LIMIT > 0) slugs = slugs.slice(0, LIMIT)
log.info('config', { slugs: slugs.length, flags: { limit: LIMIT, singleSlug: SINGLE_SLUG, mapOnly: MAP_ONLY, refetch: REFETCH, delayMs: DELAY_MS } })
if (!MAP_ONLY) {
  const stats = await runFetch(slugs)
  log.info('fetch summary', stats)
}
runMap(slugs)
log.info('done', { cached: listJSON(CACHE_DIR).length })
