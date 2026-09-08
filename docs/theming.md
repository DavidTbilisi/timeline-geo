# Theming

Import `timeline-geo/style.css` once. It contains the engine stylesheet (a small reset, the timeline, the landing page, the overlay) plus the Tailwind utilities the engine's own components use, generated without preflight so your base styles are untouched. It references no images and no dataset values; those arrive as CSS custom properties.

## Variables emitted from the config

`createTimeline().install` calls `applyThemeVars(config)`, which sets on `<html>`:

| variable | source |
|---|---|
| `--period-<id>` | each period's `color` |
| `--tl-period-count` | number of periods (drives landing-page widths) |
| `--tl-stage-width/height`, `--tl-sidebar-width`, `--tl-datebar-height`, `--tl-footer-height` | layout |
| `--tl-row-pitch/offset`, `--tl-card-width`, `--tl-major/small/minor-height` | layout |
| `--tl-landing-card-width/gap/pitch`, `--tl-landing-padding` | layout |
| `--tl-font-sans/display/script/serif` | `theme.fonts` |
| `--tl-page-bg` | `theme.pageBackground` |
| `--tl-paper-bg`, `--tl-grid-lines` | `assets.paperBg`, `assets.gridLines` (as `url(...)`) |
| anything in `theme.cssVars` | verbatim |

Cards and events set `--period-color` inline; hover fills read it.

## Fonts

```ts
theme: {
  fonts: {
    sans: "'Noto Sans Georgian', sans-serif",             // body and UI
    display: "'interstate_compressedregular', sans-serif", // card and era titles
    script: "'hoeflernew_-swashitalic', serif",           // welcome heading
    serif: 'Georgia, serif',                               // landing prose
  },
}
```

Declare the `@font-face` rules in your own stylesheet; the engine never loads font files.

## Images

Period images come from `period.sidebarImage` / `period.cardImage`, era logos from `era.logo`, stage textures from `assets`. Public paths are prefixed with `assets.baseUrl`.

## Overriding

Load your stylesheet after `timeline-geo/style.css`; the engine uses low-specificity class selectors (`.landing-period h3`, `.tl-event.major`, `.landing-footer .welcome h3`), so a single class or a `:lang()` prefix wins. The Bible app's `src/app/styles/bible-theme.css` is a worked example: licensed fonts, an era-name sprite instead of text, footer art, and narrower Georgian headings.
