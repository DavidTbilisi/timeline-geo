/**
 * Engine chrome strings (English). Consumers supply other locales — and
 * overrides — through `config.i18n.messages`; they are deep-merged over this.
 */
export const engineMessagesEn = {
  nav: {
    favorites: 'Favorites',
    faq: 'FAQ',
    searchPlaceholder: 'Search...',
    noFavorites: 'No favorites yet',
    searchResults: {
      zero: 'No Results',
      one: '1 Result',
      many: '{count} Results',
    },
  },
  detail: {
    tabs: {
      article: 'Article',
      related: 'Related',
      images: 'Images',
      video: 'Video',
    },
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove Favorite',
    back: 'Back',
    loading: 'Loading...',
    noContent: 'Content not yet available.',
    noRelated: 'No related events added yet.',
    noImages: 'No images available',
    prevImage: 'Previous image',
    nextImage: 'Next image',
    videoUnsupported: 'Your browser does not support HTML5 video.',
  },
  timeline: {
    bc: 'BC',
    ad: 'AD',
    future: 'Future',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    today: 'Today',
  },
  faq: {
    title: 'Frequently Asked Questions',
    close: 'Close',
  },
}

export type EngineMessages = typeof engineMessagesEn
