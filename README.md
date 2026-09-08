# timeline-geo

A config-driven, horizontally scrolling timeline engine for Vue 3, and the site it was extracted from: a Bible timeline with English and Georgian (ქართული) UI.

- **Engine** (`src/lib`, published as the npm package): periods with their own scales laid end to end, events positioned and row-packed from years alone, localized content, pluggable detail tabs and landing panels, a theme driven by CSS variables. See [docs/getting-started.md](docs/getting-started.md).
- **Bible app** (`src/app`, `content/`, `public/`): the first consumer, deployed to GitHub Pages. Never part of the package.
- **Example** (`examples/minimal`): a tiny synthetic dataset showing the engine with no authored layout.

## Using the engine

```bash
npm install timeline-geo vue pinia vue-router vue-i18n
```

```ts
import { createTimeline, defineTimelineConfig, staticJsonLoaders } from 'timeline-geo'
import 'timeline-geo/style.css'

const timeline = createTimeline(defineTimelineConfig({
  id: 'my-timeline',
  title: { en: 'My Timeline' },
  locales: { default: 'en', available: ['en'] },
  periods, eras,
  loaders: staticJsonLoaders({ baseUrl: '/content' }),
}))
// then: createRouter({ routes: timeline.routes }), createI18n({ messages: timeline.messages }), app.use(timeline)
```

Documentation: [getting started](docs/getting-started.md) · [config](docs/config.md) · [content schema](docs/content-schema.md) · [layout engine](docs/layout.md) · [plugins](docs/plugins.md) · [theming](docs/theming.md) · [routing](docs/routing.md) · [publishing](docs/publishing.md).

## Working on this repository

```bash
npm ci
npm run dev             # Bible app on http://127.0.0.1:3000
npm run dev:example     # example consumer on http://localhost:3001 (engine from source)
npm run typecheck       # app, node, lib and example projects
npm run check:boundaries  # src/lib must not import the app or content
npm run test:unit       # Vitest: layout engine, config, i18n, stores, loaders
npm run test:e2e        # Playwright against the Bible app (starts the dev server on :5174)
npm run build:app       # Bible site → dist-app/
npm run build:lib       # package → dist/ (ES module, style.css, types)
npm run build:example   # example → examples/minimal/dist (EXAMPLE_USE_DIST=1 to consume dist/)
npm run test:example    # smoke test of the example against the built package
```

Node 20+ is required. `tests/e2e/visual.spec.ts` holds chromium screenshot baselines (Linux) that guard the Bible site's rendering; regenerate them deliberately with `npx playwright test visual --project=chromium --update-snapshots`.

## Layout

```
src/lib/            engine (published)
  config/           createTimeline, config types, resolution, injection
  layout/           projection, layoutEvents, banding, date labels
  i18n/             engine chrome messages (en), localized-string helpers
  plugins/          detail tab / landing panel types, built-in tabs
  router/           createTimelineRoutes, useTimelineNav
  theme/            applyThemeVars, resolveAsset
  stores/           Pinia: timeline, events, favorites
  components/       timeline/, landing/, detail/, layout/
  views/            LandingPage, TimelinePage
  styles/           engine.css (+ lib.css entry for the package stylesheet)
src/app/            Bible consumer: main, config, loaders, messages, Bible-only components, theme CSS
content/            Bible content: periods, eras, site strings, FAQ, events/period-N.json
public/             Bible runtime assets: data/details, css/img, fonts, media (gitignored)
examples/minimal/   synthetic example consumer
scripts/            content tooling; scripts/bible/ holds the one-off scrapers and the schema migration
tests/              unit/ (Vitest), e2e/ (Playwright, Bible app), example/ (Playwright, example)
```

## Bible content pipeline

Content was scraped once from timeline.biblehistory.com and is committed under `content/` (cards) and `public/data/details/` (articles). Images under `public/media/` are gitignored and re-fetched in CI.

```bash
npm run fetch:details      # scripts/fetchDetails.mjs — re-fetch detail JSON (needs network)
npm run fetch:images       # scripts/fetchImages.mjs  — mirror images into public/media
npm run fetch:fonts        # scripts/fetchFonts.mjs   — self-host Noto Georgian
npm run translate:export   # CSV for translators
npm run translate:import   # translated CSV back into the JSON
```

## Deployment

Pushes to `main` build the Bible site with `BASE_PATH=/timeline-geo/` and deploy `dist-app/` to GitHub Pages (`.github/workflows/deploy-pages.yml`). CI runs type-check, boundary check, unit tests, the app build, chromium e2e, and a package smoke job (library build, example built against it, publint).
