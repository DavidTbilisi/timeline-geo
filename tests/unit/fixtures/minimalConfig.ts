import type { TimelineConfig } from '@lib/config/types'

/** A tiny two-era, three-period config for unit tests. Override any field. */
export function minimalConfig(overrides: Partial<TimelineConfig> = {}): TimelineConfig {
  return {
    id: 'test',
    title: { en: 'Test Timeline' },
    locales: { default: 'en', available: ['en'] },
    eras: [
      { id: 1, name: { en: 'Early' }, periods: [1, 2] },
      { id: 2, name: { en: 'Late' }, periods: [3] },
    ],
    periods: [
      { id: 1, slug: 'one', name: { en: 'One' }, color: '#111', era: 1, startYear: -1000, pxPerYear: 1 },
      { id: 2, slug: 'two', name: { en: 'Two' }, color: '#222', era: 1, startYear: 0, pxPerYear: 2 },
      { id: 3, slug: 'three', name: { en: 'Three' }, color: '#333', era: 2, startYear: 500, pxPerYear: 4 },
    ],
    loaders: {
      events: async () => [],
      detail: async () => null,
    },
    ...overrides,
  }
}
