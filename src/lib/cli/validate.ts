/**
 * timeline-validate — check a content directory against the engine's schemas.
 *
 *   timeline-validate <contentDir> [detailsDir] [--events <dir>] [--locales en,ka] [--max-rows 24] [--json] [--quiet]
 *
 * <contentDir> holds periods.json, eras.json and optionally site.json and an
 * events/ folder (period-<id>.json). Details are read from [detailsDir]
 * (one <slug>.json per event). Exit code 1 when there are errors; warnings
 * never fail the run.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { validateDataset, type Finding } from '../schema/validateDataset'

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    throw new Error(`${path}: ${(e as Error).message}`)
  }
}

function parseArgs(argv: string[]) {
  const positional: string[] = []
  const opts: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json' || a === '--quiet' || a === '--help' || a === '-h') opts[a.replace(/^-+/, '')] = true
    else if (a.startsWith('--')) { opts[a.slice(2)] = argv[i + 1] ?? ''; i++ }
    else positional.push(a)
  }
  return { positional, opts }
}

export function main(argv = process.argv.slice(2)): number {
  const { positional, opts } = parseArgs(argv)
  if (opts.help || positional.length === 0) {
    console.log('usage: timeline-validate <contentDir> [detailsDir] [--events <dir>] [--locales en,ka] [--max-rows 24] [--json] [--quiet]')
    return positional.length === 0 && !opts.help ? 1 : 0
  }
  const contentDir = resolve(positional[0])
  const detailsDir = positional[1] ? resolve(positional[1]) : null
  const eventsDir = opts.events ? resolve(String(opts.events)) : join(contentDir, 'events')

  const problems: Finding[] = []
  const load = (path: string, required: boolean): unknown => {
    if (!existsSync(path)) {
      if (required) problems.push({ level: 'error', where: path, message: 'file not found' })
      return undefined
    }
    try { return readJson(path) } catch (e) { problems.push({ level: 'error', where: path, message: (e as Error).message }); return undefined }
  }

  const periods = load(join(contentDir, 'periods.json'), true)
  const eras = load(join(contentDir, 'eras.json'), true)
  const site = load(join(contentDir, 'site.json'), false)

  const events: Record<string, unknown> = {}
  if (existsSync(eventsDir) && statSync(eventsDir).isDirectory()) {
    for (const f of readdirSync(eventsDir)) {
      const m = /^period-(\d+)\.json$/.exec(f)
      if (m) events[m[1]] = load(join(eventsDir, f), true)
    }
  } else {
    problems.push({ level: 'warning', where: eventsDir, message: 'no events directory' })
  }

  let details: Record<string, unknown> | undefined
  if (detailsDir) {
    details = {}
    if (!existsSync(detailsDir)) problems.push({ level: 'error', where: detailsDir, message: 'details directory not found' })
    else for (const f of readdirSync(detailsDir)) {
      if (f.endsWith('.json') && !f.startsWith('_')) details[f.replace(/\.json$/, '')] = load(join(detailsDir, f), true)
    }
  }

  const report = validateDataset({
    periods: periods ?? [],
    eras: eras ?? [],
    site,
    events,
    details,
    locales: opts.locales ? String(opts.locales).split(',').map(s => s.trim()).filter(Boolean) : undefined,
    maxRows: opts['max-rows'] ? Number(opts['max-rows']) : undefined,
  })
  const errors = [...problems.filter(p => p.level === 'error'), ...report.errors]
  const warnings = [...problems.filter(p => p.level === 'warning'), ...report.warnings]

  if (opts.json) {
    console.log(JSON.stringify({ ok: errors.length === 0, stats: report.stats, errors, warnings }, null, 2))
  } else {
    if (!opts.quiet) {
      for (const w of warnings) console.log(`warning  ${w.where}: ${w.message}`)
    }
    for (const e of errors) console.error(`error    ${e.where}: ${e.message}`)
    const s = report.stats
    console.log(`${errors.length === 0 ? 'ok' : 'FAILED'}: ${s.periods} periods, ${s.eras} eras, ${s.events} events, ${s.details} details — ${errors.length} error(s), ${warnings.length} warning(s)`)
  }
  return errors.length === 0 ? 0 : 1
}

process.exitCode = main()
