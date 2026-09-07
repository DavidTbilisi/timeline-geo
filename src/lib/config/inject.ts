import { inject, hasInjectionContext, type InjectionKey } from 'vue'
import type { ResolvedTimelineConfig } from './types'

export const TIMELINE_CONFIG_KEY: InjectionKey<ResolvedTimelineConfig> = Symbol('timeline-config')

let active: ResolvedTimelineConfig | null = null

/** Remember the config installed last; used outside component context (router guards, stores). */
export function setActiveConfig(config: ResolvedTimelineConfig) {
  active = config
}

export function getActiveConfig(): ResolvedTimelineConfig {
  if (!active) {
    throw new Error('[timeline] no timeline config installed — call app.use(createTimeline(config)) first')
  }
  return active
}

/**
 * The resolved timeline config. Uses `inject()` inside component / store
 * setup and falls back to the most recently installed config elsewhere.
 */
export function useTimelineConfig(): ResolvedTimelineConfig {
  const injected = hasInjectionContext() ? inject(TIMELINE_CONFIG_KEY, null) : null
  return injected ?? getActiveConfig()
}
