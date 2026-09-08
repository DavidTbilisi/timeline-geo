# Bible dataset tooling

These scripts belong to the first consumer of the engine, not to the package. They talk to one source site and exist to refresh or migrate the committed content; a new dataset needs its own ingest, not these.

| script | what it does |
|---|---|
| `fetchDetails.mjs` | pulls event detail JSON from `timeline.biblehistory.com`, caches the raw responses under `scripts/cache/details/`, and maps them into `public/data/details/<slug>.json` without touching locally authored translations |
| `fetchImages.mjs` | mirrors card thumbnails (`content/events/*.json → image`) and detail images (`images[].file`) into `public/media/` (gitignored; CI runs it on deploy). Best-effort: the app hides thumbnails whose request fails, so the script exits 0 on partial mirrors (`--strict` to change that) and gives up after `--probe` (10) failures with no successes, which means the origin is unreachable. The origin blocks GitHub's runners, so deploys currently ship without mirrored images; `--origin` points it elsewhere. |
| `fetchFonts.mjs` | self-hosts Noto Sans/Serif Georgian and rewrites `src/app/styles/noto-georgian.css` |
| `migrateContent.mjs` | the one-off that converted the original `titleEn`/`titleKa` schema into locale-keyed JSON (kept as documentation of the change) |

The original scrape of the event cards (pixel positions from an archived copy of the site) is not reproducible from this repository; its output is the committed `content/events/*.json`.

Generic helpers live in `scripts/lib/`; the translation round trip is `scripts/translate.mjs`.
