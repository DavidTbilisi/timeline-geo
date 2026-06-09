/**
 * computeEventLayout.mjs
 * Precomputes a vertical `topOffset` (px) for each event whose natural
 * position would visually conflict with another x-overlapping event.
 *
 * Runtime layout in TimelineStage used to compute this every render via a
 * Vue `computed` (BAND_HEIGHT=18, only DOWN-shifted minors). That budget
 * forced shortcuts: 18px doesn't actually clear an 80px major, so minor
 * cards lived inside majors. The data is static, so we can move this
 * offline and use a thorough 2D packer with no per-frame constraint:
 *
 *   1. Place every event at its natural y first.
 *   2. Pass over minors (the only height that fits into adjacent space):
 *      for each one whose rect intersects any earlier placement that
 *      x-overlaps it, search outward from offset 0 in 5px steps for the
 *      smallest absolute offset whose y-band is x-free against ALL other
 *      placements.
 *   3. Write the chosen offset back to src/data/events/period-N.json as
 *      `topOffset`; events with offset 0 don't get the field.
 *
 * Usage:
 *   node scripts/computeEventLayout.mjs
 *
 * Reads/writes: src/data/events/period-1.json … period-13.json
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkLog } from './_log.mjs'
import {
  STAGE_HEIGHT,
  EVENT_DEFAULT_WIDTH,
  eventTop,
  eventHeight,
} from '../src/utils/geometry.mjs'

const log = mkLog('computeEventLayout')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const EVENTS_DIR = resolve(ROOT, 'src/data/events')

const SEARCH_STEP = 5
const SEARCH_MAX = 200             // ±200 px from natural; beyond this the
                                   // event is "too far from its row" to be
                                   // meaningful — leave it overlapping.

const xRangeOf = (e) => ({
  start: e.left,
  end: e.left + (e.width > 0 ? e.width : EVENT_DEFAULT_WIDTH),
})

const xOverlaps = (a, b) => a.start < b.end && a.end > b.start

const yAt = (e, offset) => {
  const top = eventTop(e.row, offset)
  return { top, bot: top + eventHeight(e.type, e.size) }
}

const yOverlaps = (a, b) => a.top < b.bot && a.bot > b.top

// ── Load all events ─────────────────────────────────────────────────────────
const periods = []
for (let p = 1; p <= 13; p++) {
  const file = resolve(EVENTS_DIR, `period-${p}.json`)
  const events = JSON.parse(readFileSync(file, 'utf8'))
  periods.push({ file, events })
}
const all = periods.flatMap(p => p.events)
log.info('loaded events', { periods: 13, total: all.length })

// ── Pass 1: place all events at offset 0 ────────────────────────────────────
const placed = all.map(e => ({
  ev: e,
  xR: xRangeOf(e),
  yR: yAt(e, 0),
  offset: 0,
}))

// Build a map for O(1) updates
const byId = new Map(placed.map(p => [p.ev.id, p]))

// ── Pass 2: shift conflicting minors to the nearest clean slot ──────────────
function findConflicts(target) {
  const out = []
  for (const p of placed) {
    if (p.ev.id === target.ev.id) continue
    if (!xOverlaps(p.xR, target.xR)) continue
    if (!yOverlaps(p.yR, target.yR)) continue
    out.push(p)
  }
  return out
}

function findFreeOffset(target) {
  const xR = target.xR
  // Candidate offsets in increasing absolute order: 0, +5, -5, +10, -10, ...
  for (let mag = 0; mag <= SEARCH_MAX; mag += SEARCH_STEP) {
    for (const sign of mag === 0 ? [1] : [1, -1]) {
      const offset = mag * sign
      const yR = yAt(target.ev, offset)
      if (yR.top < 0 || yR.bot > STAGE_HEIGHT) continue
      let clean = true
      for (const p of placed) {
        if (p.ev.id === target.ev.id) continue
        if (!xOverlaps(p.xR, xR)) continue
        if (yOverlaps(p.yR, yR)) { clean = false; break }
      }
      if (clean) return offset
    }
  }
  return null
}

// Only shift minors (30px); majors and small-majors stay put because
// shifting an 80px or 50px card across rows distorts the visual structure
// far more than the overlap it avoids.
//
// Process most-constrained minors first (those with the most x-overlapping
// neighbours). Greedy placement is order-sensitive: a tightly-boxed minor
// has fewer escape routes, so it should claim a slot before a freer minor
// snaps up a place it could have used.
const minors = placed.filter(p => p.ev.type === 'minor')
const xConflictCount = (target) => {
  let n = 0
  for (const p of placed) {
    if (p.ev.id === target.ev.id) continue
    if (xOverlaps(p.xR, target.xR)) n++
  }
  return n
}
const order = [...minors].sort((a, b) => xConflictCount(b) - xConflictCount(a))

let shiftedCount = 0
let unresolvedCount = 0

for (const p of order) {
  if (findConflicts(p).length === 0) continue   // nothing to resolve
  const offset = findFreeOffset(p)
  if (offset === null) {
    unresolvedCount++
    log.warn('no free slot — keeping overlap', { slug: p.ev.slug, row: p.ev.row })
    continue
  }
  if (offset !== 0) {
    p.offset = offset
    p.yR = yAt(p.ev, offset)
    shiftedCount++
  }
}

log.info('placement complete', {
  total: all.length,
  shifted: shiftedCount,
  unresolved: unresolvedCount,
})

// ── Write topOffset back into each period JSON ─────────────────────────────
let writes = 0
for (const { file, events } of periods) {
  for (const e of events) {
    const p = byId.get(e.id)
    if (p && p.offset !== 0) {
      e.topOffset = p.offset
    } else if ('topOffset' in e) {
      delete e.topOffset
    }
  }
  writeFileSync(file, JSON.stringify(events, null, 2) + '\n')
  writes++
}

log.info('wrote period files', { count: writes })
