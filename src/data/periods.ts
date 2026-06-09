import type { PeriodData } from '@/types/event'

// period_offsets[N] = [startPx, _unused, startYear, pxPerYear]
// Extracted from original index.html line 973
//
// Translatable copy (period name + description) lives in
// src/i18n/locales/<code>.ts under `periods.<slug>.{name,description}`.
// Use `usePeriodCopy()` from @/composables/usePeriodCopy at the render
// site rather than reading anything off PeriodData here.
//
// Image paths (`sidebarImage`, `landingImage`) are stored as bare
// public-folder paths (no leading slash). Render sites MUST wrap them
// in `withBase(...)` from src/utils/assetUrl.ts so subpath deploys
// (GitHub Pages at /timeline-geo/) resolve correctly.
export const PERIODS: PeriodData[] = [
  {
    id: 1,
    slug: 'first-generation',
    color: '#ad1f26',
    era: 1,
    startPx: 0,
    startYear: -4100,
    pxPerYear: 1.1,
    sidebarImage: 'css/img/sidebars_01.jpg',
    landingImage: 'css/img/period_1.jpg',
  },
  {
    id: 2,
    slug: 'noah-and-the-flood',
    color: '#db2f2c',
    era: 1,
    startPx: 1320,
    startYear: -2900,
    pxPerYear: 4.4,
    sidebarImage: 'css/img/sidebars_02.jpg',
    landingImage: 'css/img/period_2.jpg',
  },
  {
    id: 3,
    slug: 'the-patriarchs',
    color: '#bb3380',
    era: 1,
    startPx: 5500,
    startYear: -1950,
    pxPerYear: 11,
    sidebarImage: 'css/img/sidebars_03.jpg',
    landingImage: 'css/img/period_3.jpg',
  },
  {
    id: 4,
    slug: 'egypt-to-canaan',
    color: '#903a95',
    era: 2,
    startPx: 8800,
    startYear: -1650,
    pxPerYear: 4.4,
    sidebarImage: 'css/img/sidebars_04.jpg',
    landingImage: 'css/img/period_4.jpg',
  },
  {
    id: 5,
    slug: 'the-judges',
    color: '#63479b',
    era: 2,
    startPx: 9680,
    startYear: -1450,
    pxPerYear: 4.4,
    sidebarImage: 'css/img/sidebars_05.jpg',
    landingImage: 'css/img/period_5.jpg',
  },
  {
    id: 6,
    slug: 'united-kingdom',
    color: '#3b6eb5',
    era: 2,
    startPx: 11220,
    startYear: -1100,
    pxPerYear: 22,
    sidebarImage: 'css/img/sidebars_06.jpg',
    landingImage: 'css/img/period_6.jpg',
  },
  {
    id: 7,
    slug: 'divided-kingdom',
    color: '#23a6c5',
    era: 2,
    startPx: 14960,
    startYear: -930,
    pxPerYear: 22,
    sidebarImage: 'css/img/sidebars_07.jpg',
    landingImage: 'css/img/period_7.jpg',
  },
  {
    id: 8,
    slug: 'the-exile',
    color: '#33bdbb',
    era: 2,
    startPx: 21780,
    startYear: -620,
    pxPerYear: 11,
    sidebarImage: 'css/img/sidebars_08.jpg',
    landingImage: 'css/img/period_8.jpg',
  },
  {
    id: 9,
    slug: 'life-of-christ',
    color: '#52b148',
    era: 3,
    startPx: 27500,
    startYear: -100,
    // Period spans 100 BC – 30 AD but events cluster around Christ's
    // ministry (~25 AD). Without this, users land in 95 BC empty space.
    landingYear: 25,
    pxPerYear: 110,
    sidebarImage: 'css/img/sidebars_09.jpg',
    landingImage: 'css/img/period_9.jpg',
  },
  {
    id: 10,
    slug: 'early-church',
    color: '#b6bf34',
    era: 3,
    startPx: 42240,
    startYear: 35,
    pxPerYear: 22,
    sidebarImage: 'css/img/sidebars_10.jpg',
    landingImage: 'css/img/period_10.jpg',
  },
  {
    id: 11,
    slug: 'middle-ages',
    color: '#eec826',
    era: 3,
    startPx: 49170,
    startYear: 350,
    pxPerYear: 4.4,
    sidebarImage: 'css/img/sidebars_11.jpg',
    landingImage: 'css/img/period_11.jpg',
  },
  {
    id: 12,
    slug: 'reformation',
    color: '#e9a327',
    era: 3,
    startPx: 54340,
    startYear: 1520,
    pxPerYear: 22,
    sidebarImage: 'css/img/sidebars_12.jpg',
    landingImage: 'css/img/period_12.jpg',
  },
  {
    id: 13,
    slug: 'revelation-prophecies',
    color: '#ed7c2c',
    era: 3,
    startPx: 61380,
    startYear: 1840,
    pxPerYear: 4.4,
    sidebarImage: 'css/img/sidebars_13.jpg',
    landingImage: 'css/img/period_13.jpg',
  },
]

export const PERIOD_BY_SLUG = Object.fromEntries(PERIODS.map(p => [p.slug, p]))
export const PERIOD_BY_ID = Object.fromEntries(PERIODS.map(p => [p.id, p]))

// ERAS' nameEn/nameKa are still used by AppMenu and a few other surfaces
// that haven't yet been migrated to t(`eras.${id}`). The locale-aware
// names ARE already available in src/i18n/locales/<code>.ts under
// `eras.<id>` — a follow-up can drop these inline strings.
export const ERAS = [
  { id: 1 as const, nameEn: 'Age of Patriarchs', nameKa: 'პატრიარქების ეპოქა', periods: [1, 2, 3] },
  { id: 2 as const, nameEn: 'Age of Israel',     nameKa: 'ისრაელის ეპოქა',     periods: [4, 5, 6, 7, 8] },
  { id: 3 as const, nameEn: 'Age of Christ',      nameKa: 'ქრისტეს ეპოქა',      periods: [9, 10, 11, 12, 13] },
]

// Stage / chrome dimensions live in src/utils/geometry.mjs so the Node
// layout script and the runtime share one source of truth. Re-exported
// here so existing imports keep working.
export {
  STAGE_WIDTH,
  STAGE_HEIGHT,
  SIDEBAR_WIDTH,
  DATEBAR_HEIGHT,
  FOOTER_HEIGHT,
  EVENT_DEFAULT_WIDTH,
} from '@/utils/geometry'
