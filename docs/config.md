# Configuration

`defineTimelineConfig()` is an identity helper for type inference; `createTimeline(config)` resolves defaults, validates the data, and returns a Vue plugin plus the routes and messages you hand to vue-router and vue-i18n.

```ts
interface TimelineConfig {
  id: string                       // namespaces storage keys (`${id}:favorites`, `${id}:locale`)
  title: LocalizedString           // document/app title
  locales: LocaleOptions
  periods: Period[]
  eras: Era[]
  layout?: LayoutOptions
  routes?: RouteOptions
  loaders: TimelineLoaders
  plugins?: { detailTabs?: DetailTabPlugin[]; landingPanels?: LandingPanelPlugin[] }
  assets?: { baseUrl?: string; paperBg?: string; gridLines?: string; detailImageBase?: string }
  theme?: ThemeOptions
  i18n?: { messages?: Record<LocaleCode, MessageTree> }
  content?: { welcome?: { heading; body }; faq?: { q; a }[] }
  storage?: { favorites?: string; locale?: string }
  debug?: boolean
}
```

## Locales

```ts
locales: {
  default: 'ka',
  available: ['ka', 'en'],
  fallback: 'en',                          // consulted after the active locale (default: `default`)
  labels: { en: 'EN', ka: 'ქა' },          // short labels for the switcher
  names: { en: 'English', ka: 'ქართული' }, // native names (switcher title / mobile button)
}
```

Every piece of content is a `LocalizedString` (`{ en: '…', ka: '…' }`). `useLocalized().l(value)` resolves it along `[active, fallback, default, ...available]`.

## Layout

All values are pixels unless noted. Defaults reproduce the original site.

| option | default | meaning |
|---|---|---|
| `stageWidth` | projection of `endYear` | total stage width |
| `stageHeight` | 1440 | stage height |
| `endYear` | last period start + 100 | last year on the date bar |
| `futureFromYear` | never | years from here on show the "future" label |
| `sidebarWidth`, `datebarHeight`, `footerHeight` | 220, 66, 75 | chrome sizes |
| `maxRows`, `rowPitch`, `rowOffset` | 24, 50, 20 | row grid |
| `eventOffsetX` | 110 | added to every event's projected start |
| `cardWidth` | 260 | width of an event card without a bar |
| `majorHeight`, `smallHeight`, `minorHeight` | 80, 50, 30 | card heights |
| `barMinPx` | 360 | a major event at least this long renders as a bar |
| `packGap` | 8 | gap the row packer keeps between neighbours |
| `bandOffset` | 18 | sub-band drop for an overlapping minor |
| `centerFudge`, `activePeriodOffset` | 24, −17 | viewport-centre corrections for the year bubble / active period |
| `landingCardWidth`, `landingCardGap`, `landingPadding`, `landingArchInset` | 170, 15, 60, 20 | landing page geometry |

## Loaders

```ts
interface TimelineLoaders {
  events(periodId: number): Promise<TimelineEventInput[]>
  detail(slug: string): Promise<EventDetail | null>
}
```

`staticJsonLoaders({ baseUrl, eventsPath?, detailPath?, fetch? })` fetches `events/period-<id>.json` and `details/<slug>.json`. Anything that returns the same shapes works: bundled modules (`import.meta.glob`), a CMS client, an API.

## Assets and theme

`assets.baseUrl` prefixes every public path (`import.meta.env.BASE_URL` in a Vite app). `paperBg` / `gridLines` are the stage textures; `detailImageBase` is where `images[].file` lives. `theme.fonts` sets the four font stacks, `theme.pageBackground` the page colour, `theme.cssVars` any extra custom properties. See [theming.md](./theming.md).

## Storage and debugging

Favorites and the chosen locale persist in `localStorage` under `storage.favorites` / `storage.locale`. `debug: true` turns on the namespaced console logger (`__log.enable('route', 'data')` in the console).

## What `createTimeline` returns

```ts
interface TimelineInstance {
  config: ResolvedTimelineConfig   // defaults filled; periods sorted with startPx/endPx/index; byId/bySlug/eraById
  routes: RouteRecordRaw[]         // createTimelineRoutes(config)
  messages: Record<LocaleCode, MessageTree>   // engine English chrome merged with i18n.messages
  initialLocale(): LocaleCode      // stored locale if valid, else locales.default
  install(app: App): void          // provides the config, emits theme variables
}
```

Inside components and stores, `useTimelineConfig()` returns the resolved config.
