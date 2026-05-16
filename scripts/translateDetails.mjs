#!/usr/bin/env node
/**
 * translateDetails.mjs — round-trip translation tooling for timeline-geo.
 *
 * Export:
 *   node scripts/translateDetails.mjs --export translations.csv
 *   node scripts/translateDetails.mjs --export titles.csv --field title
 *   node scripts/translateDetails.mjs --export missing.csv --missing-only
 *
 * Walks every detail JSON in `public/data/details/`, emits one CSV row per
 * translatable field, and includes any existing KA translation so iterative
 * passes don't lose work.
 *
 * Import:
 *   node scripts/translateDetails.mjs --import translations.csv
 *
 * Reads the CSV back, looks up each (slug, field) pair, and writes the KA
 * value into the matching detail JSON. For `title` and `dates` the value is
 * mirrored into the events JSON (`src/data/events/period-N.json`) so search
 * and timeline cards see the same translation.
 *
 * Empty `ka` cells are skipped — they don't clobber existing translations.
 *
 * Field names map to JSON keys as follows:
 *   title       → titleEn / titleKa            (events + details)
 *   dates       → datesEn / datesKa            (events + details)
 *   description → descriptionEn / descriptionKa (details only)
 *   article     → articleEn / articleKa         (details only)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkLog } from './_log.mjs'

const log = mkLog('translateDetails')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const EVENTS_DIR = resolve(ROOT, 'src/data/events')

const FIELDS = /** @type {const} */ (['title', 'dates', 'description', 'article'])
const FIELDS_IN_EVENTS = new Set(['title', 'dates'])

// ── CLI parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
function flag(name) { return args.includes(name) }
function val(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
function vals(name) {
  const out = []
  for (let i = 0; i < args.length; i++) if (args[i] === name && args[i + 1]) out.push(args[i + 1])
  return out
}

const exportPath = val('--export')
const importPath = val('--import')
const missingOnly = flag('--missing-only')
const requestedFields = vals('--field')

if ((!exportPath && !importPath) || (exportPath && importPath)) {
  log.error('usage: --export <file.csv>  OR  --import <file.csv>')
  log.error('optional: --field <name> (repeatable), --missing-only')
  process.exit(1)
}

const fieldSet = requestedFields.length
  ? new Set(requestedFields.filter((f) => /** @type {readonly string[]} */(FIELDS).includes(f)))
  : new Set(FIELDS)

// ── CSV helpers (RFC 4180-ish) ───────────────────────────────────────────────

function csvEscape(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells) {
  return cells.map(csvEscape).join(',')
}

/** Parse a CSV string into rows (arrays of cells). Supports quoted fields. */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { cell += c }
    } else {
      if (c === '"' && cell === '') { inQuotes = true }
      else if (c === ',') { row.push(cell); cell = '' }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
      else { cell += c }
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// ── JSON helpers ─────────────────────────────────────────────────────────────

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJSON(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function detailFieldName(field, lang) {
  return field + (lang === 'en' ? 'En' : 'Ka')
}

// ── Export ───────────────────────────────────────────────────────────────────

if (exportPath) {
  log.info('export starting', { out: exportPath, fields: [...fieldSet], missingOnly })
  const rows = [['slug', 'field', 'en', 'ka']]
  const slugs = readdirSync(DETAILS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()

  let totalRows = 0
  for (const slug of slugs) {
    const detail = readJSON(resolve(DETAILS_DIR, slug + '.json'))
    for (const field of FIELDS) {
      if (!fieldSet.has(field)) continue
      const en = detail[detailFieldName(field, 'en')]
      const ka = detail[detailFieldName(field, 'ka')]
      if (en == null || (typeof en === 'string' && !en.trim())) continue
      if (missingOnly && ka != null && (typeof ka !== 'string' || ka.trim())) continue
      rows.push([slug, field, en, ka ?? ''])
      totalRows++
    }
  }

  writeFileSync(exportPath, rows.map(csvRow).join('\n') + '\n', 'utf8')
  log.info('export done', { rows: totalRows, events: slugs.length, out: exportPath })
}

// ── Import ───────────────────────────────────────────────────────────────────

if (importPath) {
  log.info('import starting', { in: importPath })
  const text = readFileSync(importPath, 'utf8')
  const rows = parseCsv(text)
  if (rows.length === 0 || rows[0].join(',') !== 'slug,field,en,ka') {
    log.error('expected header row: slug,field,en,ka')
    process.exit(1)
  }

  // Group translations by slug. We mutate JSON files once per slug to avoid
  // repeated read/write cycles.
  const bySlug = new Map()
  let skippedEmpty = 0
  let skippedUnknownField = 0
  for (let i = 1; i < rows.length; i++) {
    const [slug, field, , ka] = rows[i]
    if (!slug || !field) continue
    if (!ka || !ka.trim()) { skippedEmpty++; continue }
    if (!FIELDS.includes(field)) {
      skippedUnknownField++
      log.warn('unknown field, skipping', { slug, field })
      continue
    }
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    bySlug.get(slug).push({ field, ka })
  }

  // Build a lookup for events JSONs so we only load each period once.
  const periodFiles = readdirSync(EVENTS_DIR).filter((f) => f.endsWith('.json'))
  const eventsByPeriod = new Map()
  for (const f of periodFiles) {
    const periodId = parseInt(f.match(/period-(\d+)/)?.[1] ?? '0', 10)
    eventsByPeriod.set(periodId, readJSON(resolve(EVENTS_DIR, f)))
  }
  const eventBySlug = new Map()
  for (const [periodId, events] of eventsByPeriod) {
    for (const e of events) eventBySlug.set(e.slug, { periodId, event: e })
  }

  let detailWrites = 0
  let missingDetail = 0
  for (const [slug, translations] of bySlug) {
    const detailPath = resolve(DETAILS_DIR, slug + '.json')
    let detail
    try { detail = readJSON(detailPath) }
    catch {
      missingDetail++
      log.warn('no detail file for slug, skipping', { slug })
      continue
    }

    let detailDirty = false
    const eventEntry = eventBySlug.get(slug)

    for (const { field, ka } of translations) {
      detail[detailFieldName(field, 'ka')] = ka
      detailDirty = true
      if (FIELDS_IN_EVENTS.has(field) && eventEntry) {
        eventEntry.event[detailFieldName(field, 'ka')] = ka
      }
    }

    if (detailDirty) { writeJSON(detailPath, detail); detailWrites++ }
  }

  // Persist event files (one write per period, not per event)
  const dirtyPeriods = new Set()
  for (const [slug] of bySlug) {
    const e = eventBySlug.get(slug)
    if (e) dirtyPeriods.add(e.periodId)
  }
  for (const periodId of dirtyPeriods) {
    writeJSON(resolve(EVENTS_DIR, `period-${periodId}.json`), eventsByPeriod.get(periodId))
  }

  log.info('import done', {
    rows: rows.length - 1,
    detailWrites,
    periodWrites: dirtyPeriods.size,
    skippedEmpty,
    skippedUnknownField,
    missingDetail,
  })
}
