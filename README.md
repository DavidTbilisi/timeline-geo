# timeline-geo

An interactive, horizontally scrolling historical timeline built with Vue 3, TypeScript and Vite.
The first dataset is a Bible timeline with English and Georgian (ქართული) UI, deployed to GitHub Pages.

The project is being turned into a **reusable timeline engine**: a config-driven core under `src/lib/`
that will be published to npm, with the Bible site kept in this repo as its first consumer.
See `docs/` (added as the migration progresses) for the public API and content schema.

## Quick start

```bash
npm ci
npm run dev          # http://127.0.0.1:3000
npm run build        # type-check + production build into dist/
npm run typecheck    # vue-tsc --noEmit
```

Node 20+ is required (CI uses Node 20).

## Tests

```bash
npm run test:unit    # Vitest (tests/unit, src/**/*.spec.ts)
npm run test:e2e     # Playwright (tests/e2e); starts the dev server on :5174
npx playwright test --project=chromium
```

`tests/e2e/visual.spec.ts` holds screenshot baselines (chromium, Linux) that guard the refactor.
Regenerate them deliberately with `npx playwright test visual --project=chromium --update-snapshots`.

## Content pipeline

Bible content was scraped once from timeline.biblehistory.com and is committed under
`src/data/events/period-N.json` (timeline cards) and `public/data/details/<slug>.json` (detail articles).
Images under `public/media/` are gitignored and re-fetched in CI.

```bash
npm run fetch:details      # scripts/fetchDetails.mjs  — re-fetch detail JSON (needs network)
npm run fetch:images       # scripts/fetchImages.mjs   — mirror images into public/media
npm run fetch:fonts        # scripts/fetchFonts.mjs    — self-host Noto Georgian
npm run translate:export   # scripts/translateDetails.mjs --export  → CSV for translators
npm run translate:import   # scripts/translateDetails.mjs --import  ← translated CSV
```

`npm run extract` reads an archived site dump that is not part of this repo; its output is already committed.

## Deployment

Pushes to `main` build with `BASE_PATH=/timeline-geo/` and deploy to GitHub Pages
(`.github/workflows/deploy-pages.yml`). CI (`ci.yml`) runs type-check, unit tests, build and chromium e2e.

## Layout

```
src/
  components/   timeline/ (stage, date bar, sidebar…), detail/ (event overlay tabs), landing/, layout/
  composables/  useScroller (momentum physics), useDragScroll, useDateTicks, useFullLabel, useKeyboard
  stores/       Pinia: timeline (scroll/active period), events (loading + search), favorites
  data/         periods.ts (period scales, eras, stage constants), events/period-N.json
  i18n/         vue-i18n messages (en, ka)
scripts/        Node content tooling (see above)
tests/          e2e/ (Playwright), unit/ (Vitest)
public/         runtime-served assets: data/details, css/img, fonts, media (gitignored)
```
