# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A bilingual (EN / Georgian) Vue 3 + Vite + TS + Pinia interactive Bible-history timeline. Single 68 000 px-wide fixed stage that drag-scrolls horizontally and vertically with momentum, segmented into 13 historical periods. The Georgian (`ka`) locale is the default. Reference site lives at `../timeline.biblehistory.com/timeline.biblehistory.com` — its `/css/img` and `/media` assets are proxied through a dev-only Vite middleware so you don't need a local copy.
[Original Live Website](https://timeline.biblehistory.com/period/the-judges). Before any change, compare it to original website.

## Goal

1. Fully copy original 
2. Translate it to Georgian
3. Have options to add other languages


## Commands

| Task | Command |
| --- | --- |
| Dev server (defaults to port 3000 from `vite.config.ts`) | `npm run dev` |
| Dev on Playwright's port | `npm run dev -- --port 5174` |
| Type check | `npm run typecheck` |
| Production build (typecheck + bundle) | `npm run build` |
| Preview built output | `npm run preview` |
| Run E2E (auto-starts dev server on 5174 if not running) | `npm test` |
| Single E2E by name | `npx playwright test -g "<title fragment>"` |
| Headed / UI mode | `npm run test:headed` / `npm run test:ui` |

CI (`.github/workflows/ci.yml`) runs typecheck, production build, and Playwright chromium project on every push/PR. GitHub Pages deploy sets `BASE_PATH=/timeline-geo/` so absolute asset URLs get rewritten by the `rewriteCssBaseUrls` Vite plugin.

## Data pipeline

Event JSON is generated, not authored by hand:

- `scripts/extractEvents.mjs` → parses the reference site's `events.json` into `src/data/events/period-N.json` (bundled, imported dynamically per active period)
- `scripts/fetchDetails.mjs` → fills `public/data/details/<slug>.json` (fetched on-demand when a detail modal opens)
- `scripts/fetchImages.mjs`, `scripts/fetchFonts.mjs` → pull binary assets into `public/`
- `scripts/translateDetails.mjs --export` / `--import` → round-trips Georgian translations

If you change the event schema, run `extractEvents` and regenerate downstream files; don't hand-edit JSON.

## The 68 000 px stage — core mental model

Period offsets in `src/data/periods.ts` are the single source of truth for all year ↔ pixel math:

```
year → px:  period.startPx + (year - period.startYear) * period.pxPerYear
```

The 13 periods have different `pxPerYear` (1.1 to 110), so one canonical pixel ≠ one year — always go through the period the year falls in. `STAGE_WIDTH = 68000`, `STAGE_HEIGHT = 1440` are immutable. **All store math (currentYear, activePeriod detection, scrollToPeriod) happens in canonical scroll space where zoom = 1.** Only the DOM transforms apply the zoom factor.

### Transform pipeline (`useScroller` callback in `TimelineView.vue`)

Each frame, the scroller writes transforms directly to layer elements (bypassing Vue reactivity) for 60fps:

- **Paper, grid, stage**: `scaleX(z) translate3d(${-left/z}px, ${-top}px, 0)`
- **Bottom datebar**: X only — `scaleX(z) translate3d(${-left/z}px, 0, 0)` (it must stay pinned at the viewport bottom; vertical scroll does **not** move it)
- **Grid**: horizontal parallax at 1/3 speed (`-(left/3)/z`) so it feels deeper; vertical 1:1 so row dividers stay aligned with cards

All scrollable layers have `transform-origin: 0 0`. The scroller's `onRender` also calls `tlStore.setScroll(left / z)` — pass canonical, not zoomed.

### Layer z-order

`paper(2) < grid(3) < center-line(5) < stage(6) < datebar(10) < sidebar(20) < mobile-chip(25) < zoom-controls(30)`. The bottom datebar's color overlay (`.tl-datebar-color`, z-index 1 inside the datebar) sits **below** the tick/label elements (z-index 2 in `TimelineDateBar.vue`) so labels stay readable during hover tint.

## Pinia stores

- **`timeline.ts`** — scroll position, active period (derived from scroll via `setScroll`), `currentYear` (computed at viewport center), `viewportWidth`, `hoverRange` (px span of the currently hovered event — drives the bottom datebar's color overlay + dark label/tick highlight), and detail-modal state.
- **`events.ts`** — lazy `byPeriod` cache (dynamic import per period), `details` cache (fetch per slug), `loadPeriod`, `getVisibleEvents(activePeriod)` returns active ± 1, plus a tiered search ranker.
- **`favorites.ts`** — slug list persisted to `localStorage` under `tl-geo-favorites`.

## Composables

- **`useScroller`** — custom momentum scroller (mouse / touch / wheel drag, X + Y, bounce at edges). Renders direct-to-DOM via the callback; do **not** put per-frame state into refs.
- **`useDateTicks`** — pre-computes (and caches) the full tick array for all 13 periods; intervals scale with `pxPerYear`.
- **`useFullLabel`** — for major events tagged `labelStyle: 'full'`, slides the title left as scroll advances so it stays at the viewport's left edge (clears the 220 px sidebar on desktop, 0 on mobile).
- **`useDragScroll`** — for the landing period cards; suppresses click after > 5 px pointer movement.
- **`useKeyboard`** — global shortcuts: arrows scroll, `+`/`-` zoom, `F` fullscreen, `Esc` closes detail.

## Routing quirks

`/event/:slug` is the same component as `/period/:slug` with the detail modal open. `TimelinePage.vue` applies the route synchronously during `setup` (before child components mount) to avoid cascading period fetches and animated scroll resets — see issues #52 and #58 if you're tempted to refactor.

Unknown period slugs and any unmatched path **redirect** (replace navigation, not push) to `/` so the back button doesn't bounce through invalid URLs.

## Asset & path quirks

- `@/` → `src/`
- Always wrap `public/`-relative URLs in `withBase(...)` from `src/utils/assetUrl.ts` so subpath deploys (GitHub Pages at `/timeline-geo/`) resolve correctly.
- Georgian fonts are self-hosted under `/fonts/` via `src/assets/styles/noto-georgian.css`; re-fetch with `npm run fetch:fonts`.
- The dev server proxies `/media/*` and `/css/img/*` from the sibling reference repo when not present in `public/` (`serveOriginalAssets` plugin in `vite.config.ts`). Production builds **only** see what's actually in `public/`.

## Logging

`src/utils/log.ts` exposes a channelled logger (`route`, `store`, `data`, `ui`, `i18n`, `search`, `nav`, `boot`). Channels are off by default in dev; enable from the browser console with `__log.enable('store')`. Tree-shakes to nothing in production — `log.x(...)` calls are free to leave in.
