import { describe, it, expect, vi } from 'vitest'
import { staticJsonLoaders } from '@lib/loaders/staticJson'

function fakeFetch(routes: Record<string, unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url in routes) return new Response(JSON.stringify(routes[url]), { status: 200 })
    return new Response('nope', { status: 404 })
  }) as unknown as typeof fetch
}

describe('staticJsonLoaders', () => {
  it('fetches events and details under baseUrl, normalising slashes', async () => {
    const fetch = fakeFetch({
      '/tl/data/events/period-2.json': [{ id: 1 }],
      '/tl/data/details/a%20b.json': { slug: 'a b' },
    })
    const loaders = staticJsonLoaders({ baseUrl: '/tl/data/', fetch })
    expect(await loaders.events(2)).toEqual([{ id: 1 }])
    expect(await loaders.detail('a b')).toEqual({ slug: 'a b' })
  })
  it('returns [] / null for missing files', async () => {
    const loaders = staticJsonLoaders({ baseUrl: '/x', fetch: fakeFetch({}) })
    expect(await loaders.events(1)).toEqual([])
    expect(await loaders.detail('missing')).toBeNull()
  })
  it('accepts custom path builders', async () => {
    const fetch = fakeFetch({ '/api/p/7': [], '/api/e/z': { slug: 'z' } })
    const loaders = staticJsonLoaders({
      baseUrl: '/api',
      fetch,
      eventsPath: id => `p/${id}`,
      detailPath: slug => `e/${slug}`,
    })
    expect(await loaders.detail('z')).toEqual({ slug: 'z' })
  })
})
