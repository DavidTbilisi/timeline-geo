import { useRouter, type RouteLocationNormalizedLoaded, type RouteLocationRaw } from 'vue-router'
import { ROUTE_NAMES } from './createTimelineRoutes'

export interface NavOptions {
  /** Replace the current history entry instead of pushing. */
  replace?: boolean
}

/** Navigation helpers that use route names, so URL prefixes never appear in components. */
export function useTimelineNav() {
  const router = useRouter()
  const go = (to: RouteLocationRaw, opts?: NavOptions) => (opts?.replace ? router.replace(to) : router.push(to))
  return {
    toHome: (opts?: NavOptions) => go({ name: ROUTE_NAMES.home }, opts),
    toPeriod: (slug: string, opts?: NavOptions) => go({ name: ROUTE_NAMES.period, params: { slug } }, opts),
    toEvent: (slug: string, opts?: NavOptions) => go({ name: ROUTE_NAMES.event, params: { slug } }, opts),
    isPeriodRoute: (route: RouteLocationNormalizedLoaded) => route.name === ROUTE_NAMES.period,
    isEventRoute: (route: RouteLocationNormalizedLoaded) => route.name === ROUTE_NAMES.event,
  }
}
