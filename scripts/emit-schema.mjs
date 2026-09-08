/**
 * Write JSON Schema files for the content types (period, era, event, detail,
 * site) into schema/, from the built schema module. Runs as part of
 * `npm run build:lib`; the files are published under `exports["./schema/*"]`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { z } from 'zod'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { schemas } = await import(pathToFileURL(resolve(ROOT, 'dist/cli/schema.js')).href)

const outDir = resolve(ROOT, 'schema')
mkdirSync(outDir, { recursive: true })
for (const [name, schema] of Object.entries(schemas)) {
  const json = z.toJSONSchema(schema, { target: 'draft-2020-12' })
  json.$id = `https://timeline-geo.dev/schema/${name}.schema.json`
  json.title = `Timeline ${name}`
  writeFileSync(resolve(outDir, `${name}.schema.json`), JSON.stringify(json, null, 2) + '\n')
}
console.log(`schema: wrote ${Object.keys(schemas).length} files to schema/`)
