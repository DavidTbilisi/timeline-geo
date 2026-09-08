# Getting started

The engine renders a horizontally scrolling timeline: a landing page of period cards grouped into eras, a stage where events are laid out by year on per-period scales, and an overlay with tabs for each event. You supply the content and a config; the engine supplies the UI.

## Install

```bash
npm install timeline-geo vue pinia vue-router vue-i18n
```

`vue`, `pinia`, `vue-router` and `vue-i18n` are peer dependencies: the engine plugs into instances you create, so it never fights your app over them.

## Wire it up

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { createTimeline, defineTimelineConfig, staticJsonLoaders } from 'timeline-geo'
import 'timeline-geo/style.css'
import App from './App.vue'
import periods from './content/periods.json'
import eras from './content/eras.json'

const config = defineTimelineConfig({
  id: 'my-timeline',
  title: { en: 'My Timeline' },
  locales: { default: 'en', available: ['en'] },
  periods,
  eras,
  loaders: staticJsonLoaders({ baseUrl: '/content' }),
})

const timeline = createTimeline(config)
const router = createRouter({ history: createWebHistory(), routes: timeline.routes })
const i18n = createI18n({ legacy: false, locale: timeline.initialLocale(), messages: timeline.messages })

createApp(App).use(timeline).use(createPinia()).use(router).use(i18n).mount('#app')
```

`App.vue` only needs a `<RouterView />`. Install the timeline plugin **before** the router: route guards and stores read the config it provides.

## Content

Put your data where the loaders can find it. With `staticJsonLoaders({ baseUrl: '/content' })`:

```
public/content/events/period-1.json   ← events of period 1
public/content/events/period-2.json
public/content/details/<slug>.json    ← one per event, fetched on demand
```

Periods and eras are small and are usually imported as modules. The shapes are in [content-schema.md](./content-schema.md). Events need only `start`/`end` years; the engine computes positions and rows ([layout.md](./layout.md)).

## Example

`examples/minimal` in this repository is a complete consumer: two eras, three periods, fifteen events with no authored layout, two locales and a dataset-specific detail tab. Run it with `npm run dev:example`.

## Where to next

- [config.md](./config.md): every option of `TimelineConfig`.
- [plugins.md](./plugins.md): add detail tabs and landing panels.
- [theming.md](./theming.md): fonts, colours, textures, overriding the stylesheet.
- [routing.md](./routing.md): route prefixes, navigation helpers.
