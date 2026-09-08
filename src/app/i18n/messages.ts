import ka from './ka'

/**
 * Messages the Bible app adds to the engine's: the full Georgian chrome and
 * the keys for its Bible-specific UI (Scriptures tab, Amazing Facts panel).
 */
const bibleEn = {
  detail: {
    tabs: { scriptures: 'Scriptures' },
    noScriptures: 'No scripture references added yet.',
  },
  landing: {
    amazingFactLabel: 'Amazing Fact',
  },
}

const bibleKa = {
  ...ka,
  detail: {
    ...ka.detail,
    tabs: { ...ka.detail.tabs, scriptures: 'წმინდა წერილი' },
    noScriptures: 'სასულიერო მინიშნებები ჯერ დამატებული არ არის.',
  },
  landing: {
    amazingFactLabel: 'საინტერესო ფაქტი',
  },
}

export const bibleMessages = { en: bibleEn, ka: bibleKa }
