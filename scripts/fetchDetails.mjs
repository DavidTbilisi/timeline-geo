/**
 * fetchDetails.mjs
 * Fetches per-event detail JSON from the live biblehistory.com PHP endpoint,
 * caches raw responses, and writes mapped EventDetail files into public/data/details.
 *
 * Phases:
 *   1. fetch  — pull raw JSON for each slug into scripts/cache/details/{slug}.json
 *   2. map    — translate cached raw → public/data/details/{slug}.json (merge-preserving Ka fields)
 *
 * Usage:
 *   node scripts/fetchDetails.mjs                 # fetch missing + map all
 *   node scripts/fetchDetails.mjs --limit 5       # only first 5 slugs
 *   node scripts/fetchDetails.mjs --slug adam     # single slug
 *   node scripts/fetchDetails.mjs --map-only      # skip fetch, re-map from cache
 *   node scripts/fetchDetails.mjs --refetch       # re-fetch even if cached
 *   node scripts/fetchDetails.mjs --delay 400     # ms between requests (default 250)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkLog } from './_log.mjs'

const log = mkLog('fetchDetails')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EVENTS_DIR = resolve(ROOT, 'src/data/events')
const CACHE_DIR = resolve(ROOT, 'scripts/cache/details')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const ENDPOINT = 'https://timeline.biblehistory.com/php/event_detail.php'

const args = process.argv.slice(2)
const argVal = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const argFlag = (name) => args.includes(name)

const LIMIT = parseInt(argVal('--limit') ?? '0', 10) || 0
const SINGLE_SLUG = argVal('--slug') ?? null
const MAP_ONLY = argFlag('--map-only')
const REFETCH = argFlag('--refetch')
const DELAY_MS = parseInt(argVal('--delay') ?? '250', 10)

mkdirSync(CACHE_DIR, { recursive: true })
mkdirSync(DETAILS_DIR, { recursive: true })

// ── Collect slugs from extracted period files ─────────────────────────────────

function loadSlugs() {
  const all = []
  for (let p = 1; p <= 13; p++) {
    const file = resolve(EVENTS_DIR, `period-${p}.json`)
    if (!existsSync(file)) continue
    const events = JSON.parse(readFileSync(file, 'utf8'))
    for (const ev of events) if (ev.slug) all.push(ev.slug)
  }
  // dedupe (paranoia)
  return [...new Set(all)]
}

// ── HTTP with retry + backoff ────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchSlug(slug, { tries = 3 } = {}) {
  const url = `${ENDPOINT}?slug=${encodeURIComponent(slug)}`
  let lastErr
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 20000)
      const t0 = Date.now()
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'timeline-geo-clone/0.1 (local dev mirror)',
          Accept: 'application/json',
        },
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      // The endpoint returns JSON with $.getJSON; verify by parsing.
      const data = JSON.parse(text)
      log.debug('fetched', { slug, attempt, ms: Date.now() - t0, bytes: text.length })
      return data
    } catch (err) {
      lastErr = err
      log.warn('fetch attempt failed', { slug, attempt, error: err.message })
      if (attempt < tries) await sleep(1000 * attempt)
    }
  }
  throw lastErr
}

// ── Fetch phase ──────────────────────────────────────────────────────────────

async function runFetch(slugs) {
  const todo = REFETCH
    ? slugs
    : slugs.filter((s) => !existsSync(resolve(CACHE_DIR, `${s}.json`)))

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
      const data = await fetchSlug(slug)
      writeFileSync(resolve(CACHE_DIR, `${slug}.json`), JSON.stringify(data, null, 2), 'utf8')
      ok++
      const pct = (((i + 1) / todo.length) * 100).toFixed(1)
      log.progress(`${i + 1}/${todo.length} (${pct}%)  ok=${ok} fail=${fail}  last=${slug}`)
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
    writeFileSync(
      resolve(CACHE_DIR, '_failures.json'),
      JSON.stringify(failures, null, 2),
      'utf8',
    )
    log.warn('failures recorded', { count: failures.length, file: 'scripts/cache/details/_failures.json' })
  }

  return { ok, fail, skipped: slugs.length - todo.length }
}

// ── Map phase ────────────────────────────────────────────────────────────────

function nullIfEmpty(v) {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function mapRawToDetail(slug, raw, fallback) {
  return {
    slug,
    id: typeof raw.id === 'number' ? raw.id : parseInt(raw.id, 10) || fallback?.id || 0,
    period: typeof raw.period === 'number' ? raw.period : parseInt(raw.period, 10) || fallback?.period || 1,
    titleEn: typeof raw.title === 'string' ? raw.title : fallback?.titleEn || '',
    titleKa: null,
    datesEn: typeof raw.dates === 'string' ? raw.dates : fallback?.datesEn || '',
    datesKa: null,
    descriptionEn: nullIfEmpty(raw.description),
    descriptionKa: null,
    articleEn: nullIfEmpty(raw.article),
    articleKa: null,
    scriptures: Array.isArray(raw.scriptures)
      ? raw.scriptures.map((s) => ({
          reference: String(s.reference ?? ''),
          verses: Array.isArray(s.verses)
            ? s.verses.map((v) => ({
                number: typeof v.number === 'number' ? v.number : parseInt(v.number, 10) || 0,
                line: String(v.line ?? ''),
              }))
            : [],
        }))
      : [],
    related: Array.isArray(raw.related)
      ? raw.related.map((r) => ({
          slug: String(r.slug ?? ''),
          titleEn: String(r.title ?? ''),
          titleKa: null,
        }))
      : [],
    images: Array.isArray(raw.images)
      ? raw.images.map((img) => ({
          file: String(img.file ?? ''),
          caption: String(img.caption ?? ''),
        }))
      : [],
    videos: Array.isArray(raw.videos)
      ? raw.videos.map((v) => ({
          title: String(v.title ?? ''),
          caption: String(v.caption ?? ''),
          filename: String(v.filename ?? ''),
        }))
      : [],
  }
}

function mergePreservingKa(existing, fresh) {
  // Preserve any user-translated Ka fields and any related[].titleKa entries by slug.
  const relatedKaBySlug = new Map(
    (existing?.related ?? []).filter((r) => r.titleKa).map((r) => [r.slug, r.titleKa]),
  )
  return {
    ...fresh,
    titleKa: existing?.titleKa ?? fresh.titleKa,
    datesKa: existing?.datesKa ?? fresh.datesKa,
    descriptionKa: existing?.descriptionKa ?? fresh.descriptionKa,
    articleKa: existing?.articleKa ?? fresh.articleKa,
    related: fresh.related.map((r) => ({
      ...r,
      titleKa: relatedKaBySlug.get(r.slug) ?? r.titleKa,
    })),
  }
}

function runMap(slugs) {
  log.info('starting map', { slugs: slugs.length })
  const periodEvents = new Map()
  for (let p = 1; p <= 13; p++) {
    const file = resolve(EVENTS_DIR, `period-${p}.json`)
    if (!existsSync(file)) continue
    const events = JSON.parse(readFileSync(file, 'utf8'))
    for (const ev of events) periodEvents.set(ev.slug, ev)
  }

  let written = 0
  let missing = 0
  let mergeErrors = 0
  for (const slug of slugs) {
    const cachePath = resolve(CACHE_DIR, `${slug}.json`)
    if (!existsSync(cachePath)) {
      missing++
      log.debug('no cache for slug, skipping', { slug })
      continue
    }
    const raw = JSON.parse(readFileSync(cachePath, 'utf8'))
    const fallback = periodEvents.get(slug)
    const fresh = mapRawToDetail(slug, raw, fallback)
    const outPath = resolve(DETAILS_DIR, `${slug}.json`)
    let merged = fresh
    if (existsSync(outPath)) {
      try {
        const existing = JSON.parse(readFileSync(outPath, 'utf8'))
        merged = mergePreservingKa(existing, fresh)
      } catch (e) {
        mergeErrors++
        log.warn('merge failed, using fresh', { slug, error: e.message })
      }
    }
    writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8')
    written++
  }
  log.info('map done', { written, missing, mergeErrors })
}

// ── Main ─────────────────────────────────────────────────────────────────────

let slugs = SINGLE_SLUG ? [SINGLE_SLUG] : loadSlugs()
if (LIMIT > 0) slugs = slugs.slice(0, LIMIT)

log.info('config', {
  slugs: slugs.length,
  cache: CACHE_DIR,
  out: DETAILS_DIR,
  flags: { limit: LIMIT, singleSlug: SINGLE_SLUG, mapOnly: MAP_ONLY, refetch: REFETCH, delayMs: DELAY_MS },
})

if (!MAP_ONLY) {
  const stats = await runFetch(slugs)
  log.info('fetch summary', { ok: stats.ok, fail: stats.fail, cached: stats.skipped })
}

runMap(slugs)

// Quick summary of what's now in cache
const cachedCount = readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_')).length
log.info('done', { cached: cachedCount })
