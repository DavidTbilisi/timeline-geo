import type { Component } from 'vue'
import type { LocalizedString } from '../types/locale'
import type { EventDetail } from '../types/detail'

/** Props every detail-tab component receives. */
export interface DetailTabProps {
  detail: EventDetail
  periodColor: string
}

/** A tab in the event overlay. The engine ships article/related/images/video; datasets add their own. */
export interface DetailTabPlugin {
  /** Stable id; also the `tab-<id>` test id. */
  id: string
  /** Tab caption: a localized string, or a vue-i18n message key. */
  label: LocalizedString | { key: string }
  /** Rendered with `DetailTabProps`. */
  component: Component
  /** Hide the tab when it would be empty. Defaults to always shown. */
  hasContent?: (detail: EventDetail) => boolean
  /** Sort key; built-ins use 10, 30, 40, 50. */
  order?: number
  /** Render edge to edge (no padding), e.g. for media. */
  flush?: boolean
}

export type LandingPanelPlacement = 'footer' | 'overlay' | 'stage-before' | 'stage-after'

/** A component mounted into a slot of the landing page. */
export interface LandingPanelPlugin {
  id: string
  component: Component
  /**
   * `footer`: inside the footer strip next to the welcome panel; may emit
   * `expand(boolean)` to open/close the footer. `overlay`: on top of the
   * page (e.g. an intro splash). `stage-before` / `stage-after`: inside the
   * scrollable area around the period cards.
   */
  placement: LandingPanelPlacement
  order?: number
  props?: Record<string, unknown>
}
