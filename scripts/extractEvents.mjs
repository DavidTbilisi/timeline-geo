/**
 * extractEvents.mjs
 * Parses the original events.json HTML strings into structured JSON files.
 *
 * Usage:
 *   node scripts/extractEvents.mjs
 *
 * Reads:  ../timeline.biblehistory.com/timeline.biblehistory.com/js/events.json
 * Writes: src/data/events/period-N.json  (one per period, 1–13)
 *         public/data/details/{slug}.json (placeholder detail files)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC_EVENTS = resolve(__dirname, '../../timeline.biblehistory.com/timeline.biblehistory.com/js/events.json')

// ── Helpers ──────────────────────────────────────────────────────────────────

function attr(html, name) {
  const m = html.match(new RegExp(`\\bdata-${name}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}

function decodeEntities(str) {
  return str
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').trim()
}

function parseEvent(html) {
  // Outer div attributes
  const id = parseInt(attr(html, 'id')) || 0
  const slug = attr(html, 'slug')
  const period = parseInt(attr(html, 'period')) || 1
  const start = parseFloat(attr(html, 'start')) || 0
  const end = parseFloat(attr(html, 'end')) || 0
  const hoverWidth = parseFloat(attr(html, 'hover')) || 0

  // Class list
  const classMatch = html.match(/^<div class="([^"]+)"/)
  const classes = classMatch ? classMatch[1].split(/\s+/) : []
  const type = classes.includes('minor') ? 'minor' : 'major'
  const size = classes.includes('small') ? 'small' : 'normal'
  const rowClass = classes.find(c => /^row-\d+$/.test(c))
  const row = rowClass ? parseInt(rowClass.split('-')[1]) : 1

  // Style: left and width
  const styleMatch = html.match(/style="([^"]*)"/)
  const styleStr = styleMatch ? styleMatch[1] : ''
  const leftMatch = styleStr.match(/left:\s*([\d.]+)px/)
  const widthMatch = styleStr.match(/width:\s*([\d.]+)px/)
  const left = leftMatch ? parseFloat(leftMatch[1]) : 0
  const width = widthMatch ? parseFloat(widthMatch[1]) : 0

  // Label style (full or default)
  const labelStyle = html.includes('class="info full"') ? 'full' : 'default'

  // Title and dates
  let titleEn = ''
  let datesEn = ''

  if (type === 'major') {
    const h3Match = html.match(/<h3>([^<]+)<\/h3>/)
    const h4Match = html.match(/<h4>(.*?)<\/h4>/s)
    titleEn = h3Match ? decodeEntities(h3Match[1].trim()) : ''
    datesEn = h4Match ? decodeEntities(stripTags(h4Match[1])).trim() : ''
  } else {
    // Minor event: h3 and h4 at top level
    const h3Match = html.match(/<h3>([^<]+)<\/h3>/)
    const h4Match = html.match(/<h4>(.*?)<\/h4>/s)
    titleEn = h3Match ? decodeEntities(h3Match[1].trim()) : ''
    datesEn = h4Match ? decodeEntities(stripTags(h4Match[1])).trim() : ''
  }

  // Image path: strip the ".html" archive artifact suffix
  const imgMatch = html.match(/background-image:url\('([^']+)'\)/)
  let imagePath = imgMatch ? imgMatch[1].replace(/\.html$/, '') : null
  // Also decode %XX in the path for readability
  if (imagePath) {
    try { imagePath = decodeURIComponent(imagePath) } catch { /* keep as-is */ }
  }

  return {
    id,
    slug,
    period,
    start,
    end,
    left,
    width,
    hoverWidth,
    row,
    type,
    size,
    labelStyle,
    titleEn,
    datesEn,
    imagePath,
    titleKa: null,
    datesKa: null,
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const raw = JSON.parse(readFileSync(SRC_EVENTS, 'utf8'))

// Ensure output directories exist
mkdirSync(resolve(ROOT, 'src/data/events'), { recursive: true })
mkdirSync(resolve(ROOT, 'public/data/details'), { recursive: true })

let totalEvents = 0
let totalSlugs = 0

for (let period = 1; period <= 13; period++) {
  const htmlList = raw[String(period)] ?? []
  const events = htmlList.map(parseEvent).filter(e => e.slug)

  totalEvents += events.length
  console.log(`Period ${period}: ${events.length} events`)

  // Write structured period JSON
  const outPath = resolve(ROOT, `src/data/events/period-${period}.json`)
  writeFileSync(outPath, JSON.stringify(events, null, 2), 'utf8')

  // Write placeholder detail files
  for (const ev of events) {
    totalSlugs++
    const detailPath = resolve(ROOT, `public/data/details/${ev.slug}.json`)
    const detail = {
      slug: ev.slug,
      id: ev.id,
      period: ev.period,
      titleEn: ev.titleEn,
      titleKa: null,
      datesEn: ev.datesEn,
      datesKa: null,
      descriptionEn: null,
      descriptionKa: null,
      articleEn: null,
      articleKa: null,
      scriptures: [],
      related: [],
      images: ev.imagePath ? [{ file: ev.imagePath, caption: '' }] : [],
    }
    // Only write if file doesn't already exist (don't overwrite translated content)
    try {
      const existing = readFileSync(detailPath, 'utf8')
      const parsed = JSON.parse(existing)
      // Merge: keep existing translated fields, update English fields
      const merged = { ...parsed, titleEn: ev.titleEn, datesEn: ev.datesEn }
      writeFileSync(detailPath, JSON.stringify(merged, null, 2), 'utf8')
    } catch {
      // File doesn't exist — create it
      writeFileSync(detailPath, JSON.stringify(detail, null, 2), 'utf8')
    }
  }
}

console.log(`\n✓ Extracted ${totalEvents} events across 13 periods`)
console.log(`✓ Created/updated ${totalSlugs} detail placeholder files`)
console.log('\nNext steps:')
console.log('  1. cd timeline-geo && npm install')
console.log('  2. npm run dev')
console.log('  3. Fill in titleKa / articleKa fields in public/data/details/*.json')
