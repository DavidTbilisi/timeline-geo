#!/usr/bin/env node
/**
 * translate.mjs — CSV round trip for translating content.
 *
 * Export:
 *   node scripts/translate.mjs --export out.csv --source en --target ka
 *   node scripts/translate.mjs --export titles.csv --target ka --field title --field dates
 *   node scripts/translate.mjs --export missing.csv --target ka --missing-only
 *
 * One row per (slug, field) with the source text and any existing target
 * translation, so iterative passes never lose work. Fields: title, dates,
 * description, article (from public/data/details); title and dates are
 * also mirrored into content/events so cards and search see them.
 *
 * Import:
 *   node scripts/translate.mjs --import out.csv --target ka
 *
 * Writes the `target` column into `<field>.<target>` of each detail (and of
 * the matching event for title/dates). Empty cells are skipped.
 *
 * Columns: slug,field,source,target
 */
import { resolve } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parseArgs } from './lib/cli.mjs'
import { ROOT, readJSON, writeJSON, listJSON, readEventsByPeriod } from './lib/fs.mjs'
import { csvRow, parseCsv } from './lib/csv.mjs'
import { mkLog } from './lib/log.mjs'

const log = mkLog('translate')
const DETAILS_DIR = resolve(ROOT, 'public/data/details')
const EVENTS_DIR = resolve(ROOT, 'content/events')
const FIELDS = ['title', 'dates', 'description', 'article']
const FIELDS_IN_EVENTS = new Set(['title', 'dates'])
const HEADER = ['slug', 'field', 'source', 'target']

const args = parseArgs(process.argv.slice(2), { booleans: ['--missing-only'] })
const exportPath = args.value('--export')
const importPath = args.value('--import')
const source = args.value('--source', 'en')
const target = args.value('--target')
const missingOnly = args.flag('--missing-only')
const fieldSet = new Set(args.values('--field').filter((f) => FIELDS.includes(f)))
if (fieldSet.size === 0) for (const f of FIELDS) fieldSet.add(f)

if ((!exportPath && !importPath) || (exportPath && importPath) || !target) {
  log.error('usage: --export <file.csv> --target <locale> [--source en] [--field <name>]* [--missing-only]')
  log.error('   or: --import <file.csv> --target <locale>')
  process.exit(1)
}

export function exportRows({ detailsDir = DETAILS_DIR, fields = fieldSet, missing = missingOnly } = {}) {
  const rows = [HEADER]
  for (const slug of listJSON(detailsDir)) {
    const detail = readJSON(resolve(detailsDir, slug + '.json'))
    for (const field of FIELDS) {
      if (!fields.has(field)) continue
      const src = detail[field]?.[source]
      const tgt = detail[field]?.[target] ?? ''
      if (!src || !src.trim()) continue
      if (missing && tgt.trim()) continue
      rows.push([slug, field, src, tgt])
    }
  }
  return rows
}

if (exportPath) {
  const rows = exportRows()
  writeFileSync(exportPath, rows.map(csvRow).join('\n') + '\n', 'utf8')
  log.info('export done', { rows: rows.length - 1, out: exportPath, source, target, fields: [...fieldSet] })
}

if (importPath) {
  const rows = parseCsv(readFileSync(importPath, 'utf8'))
  if (!rows.length || rows[0].join(',') !== HEADER.join(',')) {
    log.error(`expected header row: ${HEADER.join(',')}`)
    process.exit(1)
  }
  const bySlug = new Map()
  let skippedEmpty = 0
  let skippedUnknownField = 0
  for (const [slug, field, , value] of rows.slice(1)) {
    if (!slug || !field) continue
    if (!value || !value.trim()) { skippedEmpty++; continue }
    if (!FIELDS.includes(field)) { skippedUnknownField++; log.warn('unknown field, skipping', { slug, field }); continue }
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    bySlug.get(slug).push({ field, value })
  }

  const eventsByPeriod = readEventsByPeriod()
  const eventBySlug = new Map()
  for (const [periodId, events] of eventsByPeriod) for (const e of events) eventBySlug.set(e.slug, { periodId, event: e })

  let detailWrites = 0
  let missingDetail = 0
  const dirtyPeriods = new Set()
  for (const [slug, translations] of bySlug) {
    const detailPath = resolve(DETAILS_DIR, slug + '.json')
    if (!existsSync(detailPath)) { missingDetail++; log.warn('no detail file for slug, skipping', { slug }); continue }
    const detail = readJSON(detailPath)
    const entry = eventBySlug.get(slug)
    for (const { field, value } of translations) {
      detail[field] = { ...(detail[field] ?? {}), [target]: value }
      if (FIELDS_IN_EVENTS.has(field) && entry) {
        entry.event[field] = { ...(entry.event[field] ?? {}), [target]: value }
        dirtyPeriods.add(entry.periodId)
      }
    }
    writeJSON(detailPath, detail)
    detailWrites++
  }
  for (const periodId of dirtyPeriods) writeJSON(resolve(EVENTS_DIR, `period-${periodId}.json`), eventsByPeriod.get(periodId))
  log.info('import done', { rows: rows.length - 1, detailWrites, periodWrites: dirtyPeriods.size, skippedEmpty, skippedUnknownField, missingDetail, target })
}
