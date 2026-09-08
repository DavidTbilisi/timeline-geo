import type { App } from 'vue'
import type { TimelineConfig, TimelineInstance } from './types'
import { resolveConfig } from './resolve'
import { TIMELINE_CONFIG_KEY, setActiveConfig } from './inject'
import { buildMessages } from '../i18n/messages'
import { loadStoredLocale } from '../i18n/locale-storage'
import { applyThemeVars } from '../theme/applyThemeVars'
import { createTimelineRoutes } from '../router/createTimelineRoutes'
import { configureLog } from '../utils/log'

/** Identity helper that gives consumers type inference and completion for their config. */
export function defineTimelineConfig(config: TimelineConfig): TimelineConfig {
  return config
}

/**
 * Resolve a config into a timeline instance. The instance is a Vue plugin
 * (`app.use(timeline)`) and also exposes the resolved config, the merged
 * i18n messages and the initial locale so the consumer can create Pinia,
 * vue-router and vue-i18n itself.
 */
export function createTimeline(input: TimelineConfig): TimelineInstance {
  const config = resolveConfig(input)
  const messages = buildMessages(config)
  configureLog({ enabled: config.debug })
  return {
    config,
    routes: createTimelineRoutes(config),
    messages,
    initialLocale: () => loadStoredLocale(config) ?? config.locales.default,
    install(app: App) {
      app.provide(TIMELINE_CONFIG_KEY, config)
      setActiveConfig(config)
      if (typeof document !== 'undefined') applyThemeVars(config)
    },
  }
}
