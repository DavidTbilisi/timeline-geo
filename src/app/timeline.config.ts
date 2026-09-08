import { defineTimelineConfig, type Period, type Era } from '@lib/index'
import periods from '@content/periods.json'
import eras from '@content/eras.json'
import site from '@content/site.json'
import faq from '@content/faq.json'
import { bibleLoaders } from './loaders'
import { bibleMessages } from './i18n/messages'

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
  loaders: bibleLoaders,
  assets: { baseUrl: import.meta.env.BASE_URL },
  i18n: { messages: bibleMessages },
  content: { welcome: site.welcome, faq },
  // Keep the pre-refactor keys so existing visitors keep their favorites and locale.
  storage: { favorites: 'tl-geo-favorites', locale: 'timeline-locale' },
})
