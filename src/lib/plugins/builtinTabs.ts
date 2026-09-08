import DetailArticle from '../components/detail/DetailArticle.vue'
import DetailRelated from '../components/detail/DetailRelated.vue'
import DetailImages from '../components/detail/DetailImages.vue'
import DetailVideos from '../components/detail/DetailVideos.vue'
import type { DetailTabPlugin } from './types'

export const articleTab: DetailTabPlugin = { id: 'article', label: { key: 'detail.tabs.article' }, component: DetailArticle, order: 10 }
export const relatedTab: DetailTabPlugin = { id: 'related', label: { key: 'detail.tabs.related' }, component: DetailRelated, order: 30 }
export const imagesTab: DetailTabPlugin = { id: 'images', label: { key: 'detail.tabs.images' }, component: DetailImages, order: 40, flush: true }
export const videoTab: DetailTabPlugin = {
  id: 'video',
  label: { key: 'detail.tabs.video' },
  component: DetailVideos,
  order: 50,
  flush: true,
  hasContent: (d) => d.videos.length > 0,
}

/** The default tab set when `config.plugins.detailTabs` is not given. */
export const builtinDetailTabs: DetailTabPlugin[] = [articleTab, relatedTab, imagesTab, videoTab]
