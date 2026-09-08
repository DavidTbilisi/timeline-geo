# Publishing the package

This repository is both the engine (`src/lib`, published) and its first consumer, the Bible timeline (`src/app`, `content/`, `public/`, never published).

## Builds

| command | output |
|---|---|
| `npm run build:lib` | `dist/index.js` (+ code-split views), `dist/style.css`, `dist/types/**` |
| `npm run build:app` | `dist-app/` (the Bible site, deployed to GitHub Pages) |
| `npm run build:example` | `examples/minimal/dist/`; `EXAMPLE_USE_DIST=1` consumes `dist/` instead of the source |

`build:lib` also compiles the `timeline-validate` CLI (`dist/cli/validate.js`, exposed through `bin/`) and writes JSON Schema files for the content types into `schema/` (published under `exports["./schema/*"]`, so editors can validate `periods.json` and friends with a `$schema` reference).

`package.json` exports `.` (ESM + types), `./style.css` and `./schema/*`; `files` whitelists `dist`, `bin`, `schema` and the README, so content and assets cannot leak into the tarball. Vue, Pinia, vue-router and vue-i18n are peer dependencies; `zod` is a runtime dependency of the CLI only (the main entry never imports it).

## Validating content

```bash
npx timeline-validate <contentDir> [detailsDir] [--events <dir>] [--locales en,ka] [--max-rows 24] [--json]
```

Checks every period, era, event and detail against the schemas and the references between them (unique ids and slugs, era membership, `event.period`, `start <= end`, `layout.row` range, `related[].slug`, detail file names) and reports locale keys outside `--locales`. Errors exit 1; warnings never fail the run. In this repository `npm run validate:content` checks the Bible data and `npm run validate:example` the example (both need `npm run build:lib` first); `tests/unit/validateDataset.spec.ts` runs the same validation in CI without a build.

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
