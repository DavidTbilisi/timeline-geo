import type { Component } from 'vue'
import type { RouteRecordRaw, Router } from 'vue-router'
import type { ResolvedTimelineConfig } from '../config/types'
import { log } from '../utils/log'

export const ROUTE_NAMES = {
  home: 'timeline-home',
  period: 'timeline-period',
  event: 'timeline-event',
} as const

export interface TimelineViews {
  /** Component for the home route. Defaults to the engine's LandingPage. */
  landing?: Component
  /** Component for period and event routes. Defaults to the engine's TimelinePage. */
  timeline?: Component
}

/**
 * Route records for the timeline: home (+ aliases), `<periodPrefix>/:slug`
 * (validated against the config; unknown slugs go home) and
 * `<eventPrefix>/:slug`, plus an optional catch-all redirect. Mount them in
 * your own vue-router instance.
 */
export function createTimelineRoutes(config: ResolvedTimelineConfig, views: TimelineViews = {}): RouteRecordRaw[] {
  const landing = views.landing ?? (() => import('../views/LandingPage.vue'))
  const timeline = views.timeline ?? (() => import('../views/TimelinePage.vue'))
  const r = config.routes
  const routes: RouteRecordRaw[] = [
    {
      path: r.home,
      name: ROUTE_NAMES.home,
      component: landing,
      ...(r.aliases.length ? { alias: r.aliases } : {}),
    },
    {
      path: `${r.periodPrefix}/:slug`,
      name: ROUTE_NAMES.period,
      component: timeline,
      props: true,
      // A bogus slug used to silently fall back to the first period.
      // Redirect home instead, replacing the URL so back doesn't bounce
      // through the bad path.
      beforeEnter: (to) => {
        const slug = to.params.slug as string
        if (!config.bySlug[slug]) {
          log.route('unknown period slug, redirecting home', { slug })
          return { name: ROUTE_NAMES.home, replace: true }
        }
      },
    },
    {
      path: `${r.eventPrefix}/:slug`,
      name: ROUTE_NAMES.event,
      component: timeline,
      props: true,
    },
  ]
  if (r.catchAll) {
    // `redirect` uses replace navigation, so the bogus URL doesn't land in history.
    routes.push({
      path: '/:pathMatch(.*)*',
      redirect: (to) => {
        log.route('catch-all redirect home', { from: to.fullPath })
        return { name: ROUTE_NAMES.home }
      },
    })
  }
  return routes
}

/** Optional: log navigations and router errors through the engine logger. */
export function installRouterLogging(router: Router): void {
  router.beforeEach((to, from) => {
    log.route('nav', { from: from.fullPath, to: to.fullPath, params: to.params })
  })
  router.afterEach((to, from, failure) => {
    if (failure) log.warn('route nav failed', { from: from.fullPath, to: to.fullPath, failure })
    else log.route('nav done', { to: to.fullPath })
  })
  router.onError((err) => log.error('router error', err))
}
