import type { App } from 'vue'
import type { LocaleCode, LocalizedString, MessageTree } from '../types/locale'
import type { Period, ResolvedPeriod, Era } from '../types/period'
import type { TimelineEventInput } from '../types/event'
import type { EventDetail } from '../types/detail'

export interface LayoutOptions {
  /** Total stage width in px. Defaults to the projection of `endYear`. */
  stageWidth?: number
  /** Stage height in px. */
  stageHeight?: number
  /** Last year covered by the date bar / stage. Defaults to the last period's start + 100. */
  endYear?: number
  /** Years at or after this render the "future" label instead of AD. Defaults to never. */
  futureFromYear?: number
  sidebarWidth?: number
  datebarHeight?: number
  footerHeight?: number
}
export type ResolvedLayoutOptions = Required<LayoutOptions>

export interface TimelineLoaders {
  /** Events of one period. */
  events(periodId: number): Promise<TimelineEventInput[]>
  /** The detail record for one event, or `null` when it does not exist. */
  detail(slug: string): Promise<EventDetail | null>
}

export interface LocaleOptions {
  default: LocaleCode
  available: LocaleCode[]
  /** Locale consulted after the active one. Defaults to `default`. */
  fallback?: LocaleCode
  /** Short labels for the locale switcher, e.g. `{ en: 'EN', ka: 'ქა' }`. */
  labels?: Record<LocaleCode, string>
  /** Native names, e.g. `{ en: 'English', ka: 'ქართული' }`. */
  names?: Record<LocaleCode, string>
}

export interface FaqEntry {
  q: LocalizedString
  a: LocalizedString
}

export interface ContentOptions {
  welcome?: { heading: LocalizedString; body: LocalizedString }
  faq?: FaqEntry[]
}

export interface TimelineConfig {
  /** Stable identifier; namespaces browser storage keys. */
  id: string
  title: LocalizedString
  locales: LocaleOptions
  periods: Period[]
  eras: Era[]
  layout?: LayoutOptions
  loaders: TimelineLoaders
  assets?: {
    /** URL prefix for public assets (e.g. Vite's `import.meta.env.BASE_URL`). Defaults to `'/'`. */
    baseUrl?: string
  }
  i18n?: {
    /** Extra / overriding vue-i18n messages per locale, deep-merged over the engine's English chrome. */
    messages?: Record<LocaleCode, MessageTree>
  }
  content?: ContentOptions
  storage?: {
    /** localStorage key for favorites. Defaults to `${id}:favorites`. */
    favorites?: string
    /** localStorage key for the chosen locale. Defaults to `${id}:locale`. */
    locale?: string
  }
  /** Enable runtime logging (defaults to Vite's `import.meta.env.DEV`). */
  debug?: boolean
}

export interface ResolvedTimelineConfig {
  id: string
  title: LocalizedString
  locales: Required<Omit<LocaleOptions, 'labels' | 'names'>> & {
    labels: Record<LocaleCode, string>
    names: Record<LocaleCode, string>
  }
  /** Periods sorted chronologically with geometry filled in. */
  periods: ResolvedPeriod[]
  eras: Era[]
  layout: ResolvedLayoutOptions
  loaders: TimelineLoaders
  assets: { baseUrl: string }
  i18n: { messages: Record<LocaleCode, MessageTree> }
  content: { welcome?: ContentOptions['welcome']; faq: FaqEntry[] }
  storage: { favorites: string; locale: string }
  debug: boolean
  byId: Record<number, ResolvedPeriod>
  bySlug: Record<string, ResolvedPeriod>
  eraById: Record<number, Era>
}

export interface TimelineInstance {
  config: ResolvedTimelineConfig
  /** vue-i18n messages: engine chrome (en) merged with `config.i18n.messages`. */
  messages: Record<LocaleCode, MessageTree>
  /** The stored locale if valid, else `locales.default`. */
  initialLocale(): LocaleCode
  /** Vue plugin hook: provides the config to the component tree. */
  install(app: App): void
}
