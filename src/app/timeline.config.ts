import { defineTimelineConfig, articleTab, relatedTab, imagesTab, videoTab, type Period, type Era, type DetailTabPlugin } from '@lib/index'
import DetailScriptures from './components/DetailScriptures.vue'
import AmazingFacts from './components/AmazingFacts.vue'
import IntroSplash from './components/IntroSplash.vue'
import periods from '@content/periods.json'
import eras from '@content/eras.json'
import site from '@content/site.json'
import faq from '@content/faq.json'
import { bibleLoaders } from './loaders'
import { bibleMessages } from './i18n/messages'

/** Scripture passages, shown between Article and Related. Always present: an empty tab shows a placeholder. */
const scripturesTab: DetailTabPlugin = {
  id: 'scriptures',
  label: { key: 'detail.tabs.scriptures' },
  component: DetailScriptures,
  order: 20,
}

export const bibleConfig = defineTimelineConfig({
  id: 'timeline-geo',
  title: site.title,
  locales: {
    default: 'ka',
    available: ['ka', 'en'],
    fallback: 'en',
    labels: { en: 'EN', ka: 'ქა' },
    names: { en: 'English', ka: 'ქართული' },
  },
  periods: periods as Period[],
  eras: eras as Era[],
  layout: {
    // The source site's stage is wider than the projection of endYear.
    stageWidth: 68000,
    stageHeight: 1440,
    endYear: 2200,
    futureFromYear: 2030,
    sidebarWidth: 220,
    datebarHeight: 66,
    footerHeight: 75,
  },
  routes: { aliases: ['/home'] },
  loaders: bibleLoaders,
  plugins: {
    detailTabs: [articleTab, scripturesTab, relatedTab, imagesTab, videoTab],
    landingPanels: [
      { id: 'amazing-facts', placement: 'footer', component: AmazingFacts },
      { id: 'intro', placement: 'overlay', component: IntroSplash },
    ],
  },
  assets: {
    baseUrl: import.meta.env.BASE_URL,
    paperBg: 'css/img/paper-bg.jpg',
    gridLines: 'css/img/vert-lines.png',
  },
  theme: {
    fonts: {
      sans: "'Noto Sans Georgian', sans-serif",
      display: "'interstate_compressedregular', 'Arial Narrow', sans-serif",
      // Noto Serif Georgian covers the KA heading; the swash font has no Georgian glyphs. See issue #60.
      script: "'hoeflernew_-swashitalic', 'Noto Serif Georgian', serif",
      serif: 'Georgia, serif',
    },
  },
  i18n: { messages: bibleMessages },
  content: { welcome: site.welcome, faq },
  // Keep the pre-refactor keys so existing visitors keep their favorites and locale.
  storage: { favorites: 'tl-geo-favorites', locale: 'timeline-locale' },
})
