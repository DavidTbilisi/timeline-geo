# Content schema

Validate a content directory with `npx timeline-validate <contentDir> [detailsDir]` (see [publishing.md](./publishing.md#validating-content)); the same rules are published as JSON Schema under `@davidtbilisi/timeline-engine/schema/*.schema.json`.

All text is a `LocalizedString`: an object keyed by locale code, e.g. `{ "en": "Adam", "ka": "ადამი" }`. Missing locales fall back along the configured chain.

## Period

```jsonc
{
  "id": 1,
  "slug": "settlement",
  "name": { "en": "Settlement" },
  "description": { "en": "…" },
  "color": "#b5543a",
  "era": 1,
  "startYear": -300,        // negative = BC
  "pxPerYear": 3,           // horizontal scale inside this period
  "startPx": 0,             // optional; defaults to the cumulative offset
  "landingYear": -250,      // optional; year to centre on when navigating here
  "sidebarImage": "/img/sidebar-1.jpg",   // optional, public path
  "cardImage": "/img/card-1.jpg"          // optional, public path
}
```

Periods are sorted by `startYear`. Each one is linear; together they form a piecewise scale, so busy centuries can get more pixels than quiet millennia.

## Era

```jsonc
{
  "id": 1,
  "name": { "en": "Founding Age" },
  "description": { "en": "…" },
  "periods": [1, 2],                       // period ids, in order
  "logo": "/img/era-1.png",                // optional; text otherwise
  "arch": { "left": 100, "width": 445 }    // optional landing-page geometry override
}
```

## Event (`events/period-<id>.json`)

```jsonc
{
  "id": 2,
  "slug": "mira-the-mapmaker",
  "period": 1,
  "start": -290,
  "end": -160,                 // same as start for a point event
  "type": "major",             // "major" (card) | "minor" (pill)
  "size": "small",             // optional; compact major card
  "title": { "en": "Mira the Mapmaker" },
  "dates": { "en": "290–160 BC (130)" },   // optional; derived from the years when absent
  "image": "media/thumbs/mira.jpg",        // optional thumbnail, public path
  "layout": {                              // optional, all fields optional
    "row": 11, "left": 271, "width": 1023, "hoverWidth": 1023, "bar": true
  }
}
```

Anything in `layout` overrides the engine's computed value for that field ([layout.md](./layout.md)).

## Detail (`details/<slug>.json`)

```jsonc
{
  "slug": "mira-the-mapmaker",
  "id": 2,
  "period": 1,
  "title": { "en": "Mira the Mapmaker" },
  "dates": { "en": "290–160 BC" },
  "description": { "en": "One-line summary" },
  "article": { "en": "HTML body.<br><br>Paragraphs are split on double line breaks." },
  "related": [{ "slug": "founders-arrive", "title": { "en": "Founders arrive" } }],
  "images": [{ "file": "mira.jpg", "caption": "…" }],    // resolved under assets.detailImageBase
  "videos": [{ "title": "…", "caption": "…", "filename": "https://…/clip.mp4" }],
  "extensions": { "notes": ["…"] }                       // anything a plugin tab needs
}
```

`extensions` is the home for dataset-specific data. Give it a type with module augmentation:

```ts
declare module '@davidtbilisi/timeline-engine' {
  interface DetailExtensions { notes: string[] }
}
```
