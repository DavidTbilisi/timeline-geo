import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import {
  createTimeline,
  defineTimelineConfig,
  staticJsonLoaders,
  articleTab,
  relatedTab,
  type DetailTabPlugin,
  type Period,
  type Era,
} from 'timeline-geo'
import 'timeline-geo/style.css'
import App from './App.vue'
import NotesTab from './NotesTab.vue'
import periods from '../content/periods.json'
import eras from '../content/eras.json'

// A tab this dataset adds to the event overlay. Built-in tabs can be
// dropped or reordered the same way.
const notesTab: DetailTabPlugin = {
  id: 'notes',
  label: { en: 'Notes', de: 'Notizen' },
  component: NotesTab,
  order: 20,
  hasContent: (d) => Array.isArray((d.extensions as { notes?: unknown })?.notes),
}

const config = defineTimelineConfig({
  id: 'lumen-valley',
  title: { en: 'Lumen Valley', de: 'Lumen-Tal' },
  locales: {
    default: 'en',
    available: ['en', 'de'],
    labels: { en: 'EN', de: 'DE' },
    names: { en: 'English', de: 'Deutsch' },
  },
  periods: periods as Period[],
  eras: eras as Era[],
  layout: { endYear: 200 },
  // Events and details are plain JSON under public/content/.
  loaders: staticJsonLoaders({ baseUrl: import.meta.env.BASE_URL + 'content' }),
  plugins: { detailTabs: [articleTab, notesTab, relatedTab] },
  content: {
    welcome: {
      heading: { en: 'Welcome', de: 'Willkommen' },
      body: {
        en: 'A small, entirely fictional timeline that shows the engine laying out events from years alone.',
        de: 'Eine kleine, frei erfundene Zeitleiste, die zeigt, wie die Engine Ereignisse allein aus Jahreszahlen anordnet.',
      },
    },
    faq: [
      { q: { en: 'Is any of this real?', de: 'Ist das echt?' }, a: { en: 'No. Every person and event here is invented.', de: 'Nein. Alle Personen und Ereignisse sind erfunden.' } },
    ],
  },
  i18n: {
    messages: {
      de: {
        nav: { favorites: 'Favoriten', faq: 'FAQ', searchPlaceholder: 'Suchen…', noFavorites: 'Noch keine Favoriten' },
        detail: { tabs: { article: 'Artikel', related: 'Verwandt' }, back: 'Zurück', loading: 'Lädt…' },
        timeline: { bc: 'v. Chr.', ad: 'n. Chr.', future: 'Zukunft', today: 'Heute' },
      },
    },
  },
})

const timeline = createTimeline(config)
const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes: timeline.routes })
const i18n = createI18n({
  legacy: false,
  locale: timeline.initialLocale(),
  fallbackLocale: timeline.config.locales.fallback,
  messages: timeline.messages,
})

createApp(App).use(timeline).use(createPinia()).use(router).use(i18n).mount('#app')
