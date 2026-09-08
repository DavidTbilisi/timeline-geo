/**
 * The engine (src/lib) must not depend on the Bible app or its content:
 * no `@app/`, `@content/`, `@/` specifiers and no relative paths that leave
 * src/lib. Run in CI via `npm run check:boundaries`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const LIB = resolve(ROOT, 'src/lib')

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(ts|vue|css|js)$/.test(name)) yield p
  }
}

const specRe = /(?:from|import|@import)\s*\(?\s*['"]([^'"]+)['"]/g
const problems = []
for (const file of walk(LIB)) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(specRe)) {
    const spec = m[1]
    if (/^(@app\/|@content\/|@\/)/.test(spec)) {
      problems.push(`${relative(ROOT, file)}: ${spec}`)
    } else if (spec.startsWith('.')) {
      const target = resolve(dirname(file), spec)
      if (!target.startsWith(LIB + '/') && target !== LIB) problems.push(`${relative(ROOT, file)}: ${spec} (leaves src/lib)`)
    }
  }
}
if (problems.length) {
  console.error('src/lib must not import from the app, content or the @ alias:')
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log('lib boundaries ok')
