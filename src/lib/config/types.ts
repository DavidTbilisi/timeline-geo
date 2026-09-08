import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { LocaleCode, LocalizedString, MessageTree } from '../types/locale'
import type { Period, ResolvedPeriod, Era } from '../types/period'
import type { TimelineEventInput } from '../types/event'
import type { EventDetail } from '../types/detail'
import type { DetailTabPlugin, LandingPanelPlugin } from '../plugins/types'

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
  /** Highest row the packer may use. */
  maxRows?: number
  /** Vertical distance between rows (px). */
  rowPitch?: number
  /** Top edge of row 1 (px). */
  rowOffset?: number
  /** Horizontal offset added to every event's projected start (px). */
  eventOffsetX?: number
  /** Rendered width of a card without a duration bar (px). */
  cardWidth?: number
  majorHeight?: number
  smallHeight?: number
  minorHeight?: number
  /** Sub-band drop for minors that overlap a same-row event (px). */
  bandOffset?: number
  /** Minimum projected span for a major event to render as a bar (px). */
  barMinPx?: number
  /** Horizontal gap the packer keeps between events on a row (px). */
  packGap?: number
  /** Subtracted from the viewport centre when reading the current year (px). */
  centerFudge?: number
  /** Added to the viewport centre when detecting the active period (px). */
  activePeriodOffset?: number
  /** Landing page: card width, gap between cards, stage padding, arch inset (px). */
  landingCardWidth?: number
  landingCardGap?: number
  landingPadding?: number
  landingArchInset?: number
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

export interface RouteOptions {
  /** Path of the landing page. Defaults to `'/'`. */
  home?: string
  /** Extra paths that also show the landing page. */
  aliases?: string[]
  /** Prefix of period routes (`<prefix>/:slug`). Defaults to `'/period'`. */
  periodPrefix?: string
  /** Prefix of event routes (`<prefix>/:slug`). Defaults to `'/event'`. */
  eventPrefix?: string
  /** Redirect unknown paths home. Defaults to true. */
  catchAll?: boolean
}

export interface ThemeOptions {
  fonts?: {
    /** Body/UI stack (`--tl-font-sans`). */
    sans?: string
    /** Card and era titles (`--tl-font-display`). */
    display?: string
    /** Welcome heading (`--tl-font-script`). */
    script?: string
    /** Prose on the landing page (`--tl-font-serif`). */
    serif?: string
  }
  /** Page background behind everything (`--tl-page-bg`). */
  pageBackground?: string
  /** Extra custom properties set on the root element. */
  cssVars?: Record<string, string>
}

export interface TimelineConfig {
  /** Stable identifier; namespaces browser storage keys. */
  id: string
  title: LocalizedString
  locales: LocaleOptions
  periods: Period[]
  eras: Era[]
  layout?: LayoutOptions
  routes?: RouteOptions
  loaders: TimelineLoaders
  plugins?: {
    /** Tabs in the event overlay. Defaults to the built-in article/related/images/video tabs. */
    detailTabs?: DetailTabPlugin[]
    /** Components mounted into the landing page's slots. */
    landingPanels?: LandingPanelPlugin[]
  }
  assets?: {
    /** URL prefix for public assets (e.g. Vite's `import.meta.env.BASE_URL`). Defaults to `'/'`. */
    baseUrl?: string
    /** Paper texture behind the stage and landing (public path). */
    paperBg?: string
    /** Vertical grid-line texture over the paper (public path). */
    gridLines?: string
    /** Public path prefix for detail images; `images[].file` is appended. Defaults to `'media/images/original/'`. */
    detailImageBase?: string
  }
  theme?: ThemeOptions
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
  routes: Required<RouteOptions>
  loaders: TimelineLoaders
  plugins: {
    /** `undefined` means the built-in tabs (resolved lazily to keep component imports out of config). */
    detailTabs?: DetailTabPlugin[]
    landingPanels: LandingPanelPlugin[]
  }
  assets: { baseUrl: string; paperBg?: string; gridLines?: string; detailImageBase: string }
  theme: { fonts: NonNullable<ThemeOptions['fonts']>; pageBackground?: string; cssVars: Record<string, string> }
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
  /** Route records for the consumer's vue-router instance. */
  routes: RouteRecordRaw[]
  /** vue-i18n messages: engine chrome (en) merged with `config.i18n.messages`. */
  messages: Record<LocaleCode, MessageTree>
  /** The stored locale if valid, else `locales.default`. */
  initialLocale(): LocaleCode
  /** Vue plugin hook: provides the config to the component tree. */
  install(app: App): void
}
