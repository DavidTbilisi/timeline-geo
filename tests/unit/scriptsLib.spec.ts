import { describe, it, expect, vi } from 'vitest'
// The scripts are plain ESM; Vitest runs them under Node.
// @ts-expect-error untyped .mjs
import { parseArgs } from '../../scripts/lib/cli.mjs'
// @ts-expect-error untyped .mjs
import { csvRow, parseCsv } from '../../scripts/lib/csv.mjs'
// @ts-expect-error untyped .mjs
import { mergeLocalized, mergeDetail } from '../../scripts/lib/merge.mjs'
// @ts-expect-error untyped .mjs
import { runPool } from '../../scripts/lib/pool.mjs'
// @ts-expect-error untyped .mjs
import { fetchWithRetry } from '../../scripts/lib/http.mjs'

describe('parseArgs', () => {
  it('separates flags, values, repeated values and positionals', () => {
    const a = parseArgs(['content', '--limit', '5', '--redo', '--field', 'title', '--field', 'dates', 'details', '--last'], { booleans: ['--redo'] })
    expect(a.positional).toEqual(['content', 'details'])
    expect(a.flag('--redo')).toBe(true)
    expect(a.flag('--last')).toBe(true)
    expect(a.value('--limit')).toBe('5')
    expect(a.int('--limit', 0)).toBe(5)
    expect(a.int('--missing', 7)).toBe(7)
    expect(a.values('--field')).toEqual(['title', 'dates'])
    expect(a.value('--nope', 'x')).toBe('x')
  })
})

describe('csv', () => {
  it('round-trips quotes, commas and newlines', () => {
    const rows = [['slug', 'field', 'source', 'target'], ['adam', 'title', 'He said "hi", twice', 'line1\nline2'], ['eve', 'dates', '', 'ok']]
    const text = rows.map(csvRow).join('\n') + '\n'
    expect(parseCsv(text)).toEqual(rows)
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('merge', () => {
  it('keeps protected locales from the previous value', () => {
    expect(mergeLocalized({ en: 'old', ka: 'ძველი' }, { en: 'new' }, ['ka'])).toEqual({ en: 'new', ka: 'ძველი' })
    expect(mergeLocalized({ ka: 'x' }, undefined, ['ka'])).toEqual({ ka: 'x' })
    expect(mergeLocalized(undefined, undefined, ['ka'])).toBeUndefined()
  })
  it('merges details field by field, related titles by slug, and extensions', () => {
    const existing = { slug: 'a', title: { en: 'A', ka: 'ა' }, description: { ka: 'აღწერა' }, related: [{ slug: 'b', title: { en: 'B', ka: 'ბ' } }], extensions: { notes: ['n'] } }
    const fresh = { slug: 'a', title: { en: 'A2' }, related: [{ slug: 'b', title: { en: 'B2' } }, { slug: 'c', title: { en: 'C' } }], extensions: { scriptures: [] } }
    const out = mergeDetail(existing, fresh, { keep: ['ka'] })
    expect(out.title).toEqual({ en: 'A2', ka: 'ა' })
    expect(out.description).toEqual({ ka: 'აღწერა' })
    expect(out.related).toEqual([{ slug: 'b', title: { en: 'B2', ka: 'ბ' } }, { slug: 'c', title: { en: 'C' } }])
    expect(out.extensions).toEqual({ notes: ['n'], scriptures: [] })
    expect(mergeDetail(null, fresh, { keep: ['ka'] })).toBe(fresh)
  })
})

describe('runPool', () => {
  it('keeps result order, bounds concurrency and captures worker errors', async () => {
    let active = 0
    let peak = 0
    const results = await runPool([1, 2, 3, 4, 5], async (n: number) => {
      active++
      peak = Math.max(peak, active)
      await new Promise(r => setTimeout(r, 5))
      active--
      if (n === 3) throw new Error('boom')
      return n * 10
    }, { concurrency: 2 })
    expect(results).toEqual([10, 20, { error: 'boom' }, 40, 50])
    expect(peak).toBeLessThanOrEqual(2)
  })
})

describe('fetchWithRetry', () => {
  it('retries failed attempts and returns parsed json', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: 1 }), { status: 200 }))
    const onRetry = vi.fn()
    const data = await fetchWithRetry('http://x', { as: 'json', backoffMs: 1, fetchImpl, onRetry })
    expect(data).toEqual({ ok: 1 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1 }))
  })
  it('gives up after the configured tries', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 404 }))
    await expect(fetchWithRetry('http://x', { tries: 2, backoffMs: 1, fetchImpl })).rejects.toThrow('HTTP 404')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
  it('rejects empty buffers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(new Uint8Array(0), { status: 200 }))
    await expect(fetchWithRetry('http://x', { as: 'buffer', tries: 1, fetchImpl })).rejects.toThrow('empty body')
  })
})
