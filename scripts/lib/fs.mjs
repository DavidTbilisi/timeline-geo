import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Pretty JSON with a trailing newline — the one format every script writes. */
export function writeJSON(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

/** `<slug>` names of the JSON files in a directory (ignoring `_`-prefixed reports). */
export function listJSON(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort()
}

/** Periods from content/periods.json, sorted chronologically. */
export function readPeriods(root = ROOT) {
  return readJSON(resolve(root, 'content/periods.json')).sort((a, b) => a.startYear - b.startYear)
}

/** `Map<periodId, events[]>` from content/events/period-<id>.json for every period. */
export function readEventsByPeriod(root = ROOT) {
  const out = new Map()
  for (const p of readPeriods(root)) {
    const file = resolve(root, 'content/events', `period-${p.id}.json`)
    if (existsSync(file)) out.set(p.id, readJSON(file))
  }
  return out
}
