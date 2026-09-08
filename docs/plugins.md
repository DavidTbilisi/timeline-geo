# Plugins

## Detail tabs

The event overlay renders `config.plugins.detailTabs`, sorted by `order`. The default set is `builtinDetailTabs` = `[articleTab, relatedTab, imagesTab, videoTab]` (orders 10, 30, 40, 50).

```ts
interface DetailTabPlugin {
  id: string                                     // also the `tab-<id>` test id
  label: LocalizedString | { key: string }       // inline text or an i18n key
  component: Component                           // receives { detail, periodColor }
  hasContent?: (detail: EventDetail) => boolean  // hide when empty (default: always shown)
  order?: number
  flush?: boolean                                // no padding, e.g. media
}
```

Add, drop or reorder:

```ts
import { articleTab, relatedTab, imagesTab, type DetailTabPlugin } from '@davidtbilisi/timeline-engine'
import NotesTab from './NotesTab.vue'

const notesTab: DetailTabPlugin = {
  id: 'notes',
  label: { en: 'Notes' },
  component: NotesTab,
  order: 20,
  hasContent: d => Array.isArray(d.extensions?.notes),
}

plugins: { detailTabs: [articleTab, notesTab, relatedTab, imagesTab] }
```

A tab component:

```vue
<script setup lang="ts">
import type { EventDetail } from '@davidtbilisi/timeline-engine'
const props = defineProps<{ detail: EventDetail; periodColor: string }>()
</script>
```

Spell the props out (Vue's SFC compiler resolves prop types locally).

## Landing panels

```ts
interface LandingPanelPlugin {
  id: string
  component: Component
  placement: 'footer' | 'overlay' | 'stage-before' | 'stage-after'
  order?: number
  props?: Record<string, unknown>
}
```

- `footer`: rendered next to the welcome panel inside `.landing-footer`. Emit `expand(boolean)` to open or close the footer (the engine toggles `.landing-footer.active`).
- `overlay`: rendered above the whole landing page, e.g. an intro splash that hides itself.
- `stage-before` / `stage-after`: inside the scrollable area, before or after the era arches and period cards.

## Typed extensions

Detail records carry dataset data under `extensions`. Augment the interface once and every `detail.extensions.<key>` is typed:

```ts
declare module '@davidtbilisi/timeline-engine' {
  interface DetailExtensions { scriptures: Scripture[] }
}
```
