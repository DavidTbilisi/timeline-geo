# Publishing the package

This repository is both the engine (`src/lib`, published) and its first consumer, the Bible timeline (`src/app`, `content/`, `public/`, never published).

## Builds

| command | output |
|---|---|
| `npm run build:lib` | `dist/index.js` (+ code-split views), `dist/style.css`, `dist/types/**` |
| `npm run build:app` | `dist-app/` (the Bible site, deployed to GitHub Pages) |
| `npm run build:example` | `examples/minimal/dist/`; `EXAMPLE_USE_DIST=1` consumes `dist/` instead of the source |

`package.json` exports `.` (ESM + types) and `./style.css`; `files` whitelists `dist` and the README, so content and assets cannot leak into the tarball. Vue, Pinia, vue-router and vue-i18n are peer dependencies.

## Checks before a release

```bash
npm run check:boundaries   # src/lib imports nothing from the app or content
npm run typecheck          # app, node, lib and example projects
npm run test:unit
npm run build:lib && npx publint
EXAMPLE_USE_DIST=1 npm run build:example && npm run test:example
```

`prepublishOnly` runs the first four.

## Open decisions

- **Name.** `timeline-geo` reads as "Georgian timeline". A scoped name (`@<owner>/timeline-engine`) avoids collisions; the repository name can stay. The example imports `timeline-geo` through an alias, so renaming touches `package.json`, `examples/minimal/vite.config.ts`, `tsconfig.example.json` and the docs.
- **License.** There is no `LICENSE` file yet; add one and a `license` field before `npm publish`, and drop `private: true`.
- **Content licensing.** The Bible content (issue #17) never ships; the example dataset is synthetic.
