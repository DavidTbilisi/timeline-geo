/**
 * One-off migration (framework refactor, Phase 1): moves Bible content out of
 * TypeScript modules and the EN/KA field-pair schema into locale-keyed JSON.
 *
 *   src/data/periods.ts            → content/periods.json, content/eras.json
 *   src/i18n/locales/{en,ka}.ts    → content/site.json, faq.json, amazing-facts.json
 *   src/data/events/period-N.json  → content/events/period-N.json  (title/dates maps, layout block)
 *   public/data/details/*.json     → rewritten in place (localized maps, scriptures → extensions)
 *
 * Kept as documentation of the schema change; it is not part of the build.
 * Run once with `node scripts/bible/migrateContent.mjs` from the repo root.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const r = (...p) => resolve(ROOT, ...p)
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'))
const writeJSON = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')

/** Build a LocalizedString from EN/KA values, omitting empty locales. */
function loc(en, ka) {
  const out = {}
  if (en != null && en !== '') out.en = en
  if (ka != null && ka !== '') out.ka = ka
  return Object.keys(out).length ? out : undefined
}

// ── periods + eras ──────────────────────────────────────────────────────────
const periodsMod = await import(pathToFileURL(r('src/data/periods.ts')).href)
const enMod = (await import(pathToFileURL(r('src/i18n/locales/en.ts')).href)).default
const kaMod = (await import(pathToFileURL(r('src/i18n/locales/ka.ts')).href)).default

const periods = periodsMod.PERIODS.map((p) => {
  const out = {
    id: p.id,
    slug: p.slug,
    name: loc(p.nameEn, p.nameKa),
    description: loc(p.descriptionEn, p.descriptionKa),
    color: p.color,
    era: p.era,
    startYear: p.startYear,
    pxPerYear: p.pxPerYear,
    // Explicit override: the source site's offsets are not all derivable
    // (periods 10 and 12 deviate from the cumulative formula).
    startPx: p.startPx,
    sidebarImage: p.sidebarImage,
    cardImage: p.landingImage,
  }
  if (typeof p.landingYear === 'number') out.landingYear = p.landingYear
  return out
})
writeJSON(r('content/periods.json'), periods)

const eras = periodsMod.ERAS.map((e) => ({
  id: e.id,
  name: loc(e.nameEn, e.nameKa),
  description: loc(enMod.eras.descriptions[e.id], kaMod.eras.descriptions[e.id]),
  periods: e.periods,
}))
writeJSON(r('content/eras.json'), eras)

// ── site strings, FAQ, amazing facts ────────────────────────────────────────
writeJSON(r('content/site.json'), {
  title: loc(enMod.nav.title, kaMod.nav.title),
  welcome: {
    heading: loc(enMod.landing.welcome.heading, kaMod.landing.welcome.heading),
    body: loc(enMod.landing.welcome.body, kaMod.landing.welcome.body),
  },
})
writeJSON(
  r('content/faq.json'),
  enMod.faq.items.map((item, i) => ({
    q: loc(item.q, kaMod.faq.items[i]?.q),
    a: loc(item.a, kaMod.faq.items[i]?.a),
  })),
)
writeJSON(
  r('content/amazing-facts.json'),
  enMod.landing.amazingFacts.map((f, i) => loc(f, kaMod.landing.amazingFacts[i])),
)

// ── events ──────────────────────────────────────────────────────────────────
let eventCount = 0
for (const p of periods) {
  const src = r('src/data/events', `period-${p.id}.json`)
  if (!existsSync(src)) continue
  const events = readJSON(src).map((e) => {
    const out = {
      id: e.id,
      slug: e.slug,
      period: e.period,
      start: e.start,
      end: e.end,
      type: e.type,
    }
    if (e.size && e.size !== 'normal') out.size = e.size
    out.title = loc(e.titleEn, e.titleKa)
    out.dates = loc(e.datesEn, e.datesKa)
    if (e.imagePath) out.image = e.imagePath
    // Hand-tuned pixel layout from the source site. Kept verbatim so the
    // Bible site renders identically; the layout engine fills in whatever a
    // dataset leaves out.
    out.layout = {
      row: e.row,
      left: e.left,
      width: e.width,
      hoverWidth: e.hoverWidth,
      bar: e.labelStyle === 'full',
    }
    eventCount++
    return out
  })
  mkdirSync(r('content/events'), { recursive: true })
  writeJSON(r('content/events', `period-${p.id}.json`), events)
}

// ── details ─────────────────────────────────────────────────────────────────
const detailsDir = r('public/data/details')
let detailCount = 0
for (const file of readdirSync(detailsDir)) {
  if (!file.endsWith('.json')) continue
  const d = readJSON(resolve(detailsDir, file))
  if (!('titleEn' in d)) continue // already migrated
  const out = {
    slug: d.slug,
    id: d.id,
    period: d.period,
    title: loc(d.titleEn, d.titleKa),
  }
  const dates = loc(d.datesEn, d.datesKa); if (dates) out.dates = dates
  const description = loc(d.descriptionEn, d.descriptionKa); if (description) out.description = description
  const article = loc(d.articleEn, d.articleKa); if (article) out.article = article
  out.related = (d.related ?? []).map((x) => ({ slug: x.slug, title: loc(x.titleEn, x.titleKa) ?? {} }))
  out.images = d.images ?? []
  out.videos = d.videos ?? []
  if (Array.isArray(d.scriptures) && d.scriptures.length) {
    out.extensions = { scriptures: d.scriptures }
  }
  writeJSON(resolve(detailsDir, file), out)
  detailCount++
}

console.log(`periods=${periods.length} eras=${eras.length} events=${eventCount} details=${detailCount}`)
