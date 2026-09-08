# Routing

The engine does not create a router; it gives you route records.

```ts
const timeline = createTimeline(config)
const router = createRouter({ history: createWebHistory(), routes: timeline.routes })
```

`timeline.routes` (also `createTimelineRoutes(config, views?)`) contains:

| name | path | notes |
|---|---|---|
| `timeline-home` | `routes.home` (default `/`) + `routes.aliases` | landing page |
| `timeline-period` | `${routes.periodPrefix}/:slug` (default `/period`) | unknown slugs redirect home |
| `timeline-event` | `${routes.eventPrefix}/:slug` (default `/event`) | opens the overlay |
| catch-all | `/:pathMatch(.*)*` | unless `routes.catchAll: false` |

Pass `views: { landing, timeline }` to swap the page components; the defaults are the engine's `LandingPage` and `TimelinePage`.

`installRouterLogging(router)` logs navigations through the engine logger (on when `config.debug`).

## Navigating from your own components

```ts
const nav = useTimelineNav()
nav.toPeriod('settlement')
nav.toEvent('mira-the-mapmaker', { replace: true })
nav.toHome()
nav.isPeriodRoute(route) / nav.isEventRoute(route)
```

Names, not paths, so prefix changes never touch components.
