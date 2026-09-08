import { describe, it, expect } from 'vitest'
import { resolveConfig } from '@lib/config/resolve'
import { createTimelineRoutes, ROUTE_NAMES } from '@lib/router/createTimelineRoutes'
import { minimalConfig } from './fixtures/minimalConfig'

describe('createTimelineRoutes', () => {
  it('builds home, period, event and catch-all routes from the defaults', () => {
    const routes = createTimelineRoutes(resolveConfig(minimalConfig()))
    expect(routes.map(r => r.path)).toEqual(['/', '/period/:slug', '/event/:slug', '/:pathMatch(.*)*'])
    expect(routes.map(r => r.name)).toEqual([ROUTE_NAMES.home, ROUTE_NAMES.period, ROUTE_NAMES.event, undefined])
    expect((routes[0] as { alias?: unknown }).alias).toBeUndefined()
  })
  it('honours prefixes, aliases and catchAll', () => {
    const routes = createTimelineRoutes(resolveConfig(minimalConfig({
      routes: { home: '/start', aliases: ['/home'], periodPrefix: '/era', eventPrefix: '/e', catchAll: false },
    })))
    expect(routes.map(r => r.path)).toEqual(['/start', '/era/:slug', '/e/:slug'])
    expect((routes[0] as { alias?: string[] }).alias).toEqual(['/home'])
  })
  it('redirects unknown period slugs home and lets known ones through', () => {
    const routes = createTimelineRoutes(resolveConfig(minimalConfig()))
    const guard = routes[1].beforeEnter as (to: { params: { slug: string } }) => unknown
    expect(guard({ params: { slug: 'nope' } })).toEqual({ name: ROUTE_NAMES.home, replace: true })
    expect(guard({ params: { slug: 'two' } })).toBeUndefined()
  })
  it('accepts custom view components', () => {
    const Landing = { name: 'L' }
    const routes = createTimelineRoutes(resolveConfig(minimalConfig()), { landing: Landing })
    expect(routes[0].component).toBe(Landing)
  })
})
