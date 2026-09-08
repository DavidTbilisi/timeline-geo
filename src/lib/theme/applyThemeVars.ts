import type { ResolvedTimelineConfig } from '../config/types'
import { resolveAsset } from './assetUrl'

/**
 * Emit the CSS custom properties the engine stylesheet reads, from the
 * resolved config: one `--period-<id>` per period, the layout sizes as
 * `--tl-*`, the font stacks, the paper/grid textures and any extra
 * `theme.cssVars`. Idempotent; call again after changing the config.
 */
export function applyThemeVars(config: ResolvedTimelineConfig, root: HTMLElement = document.documentElement): void {
  const s = root.style
  const px = (n: number) => `${n}px`
  const L = config.layout

  for (const p of config.periods) s.setProperty(`--period-${p.id}`, p.color)
  s.setProperty('--tl-period-count', String(config.periods.length))

  s.setProperty('--tl-stage-width', px(L.stageWidth))
  s.setProperty('--tl-stage-height', px(L.stageHeight))
  s.setProperty('--tl-sidebar-width', px(L.sidebarWidth))
  s.setProperty('--tl-datebar-height', px(L.datebarHeight))
  s.setProperty('--tl-footer-height', px(L.footerHeight))
  s.setProperty('--tl-row-pitch', px(L.rowPitch))
  s.setProperty('--tl-row-offset', px(L.rowOffset))
  s.setProperty('--tl-card-width', px(L.cardWidth))
  s.setProperty('--tl-major-height', px(L.majorHeight))
  s.setProperty('--tl-small-height', px(L.smallHeight))
  s.setProperty('--tl-minor-height', px(L.minorHeight))
  s.setProperty('--tl-landing-card-width', px(L.landingCardWidth))
  s.setProperty('--tl-landing-card-gap', px(L.landingCardGap))
  s.setProperty('--tl-landing-card-pitch', px(L.landingCardWidth + L.landingCardGap))
  s.setProperty('--tl-landing-padding', px(L.landingPadding))

  const fonts = config.theme.fonts
  const setOrClear = (name: string, value: string | undefined) =>
    value ? s.setProperty(name, value) : s.removeProperty(name)
  setOrClear('--tl-font-sans', fonts.sans)
  setOrClear('--tl-font-display', fonts.display)
  setOrClear('--tl-font-script', fonts.script)
  setOrClear('--tl-font-serif', fonts.serif)
  setOrClear('--tl-page-bg', config.theme.pageBackground)

  const url = (path: string | undefined) => (path ? `url("${resolveAsset(config, path)}")` : undefined)
  setOrClear('--tl-paper-bg', url(config.assets.paperBg))
  setOrClear('--tl-grid-lines', url(config.assets.gridLines))

  for (const [name, value] of Object.entries(config.theme.cssVars)) s.setProperty(name, value)
}
