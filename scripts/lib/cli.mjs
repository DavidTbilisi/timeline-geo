/**
 * Minimal argv parsing shared by the scripts.
 *
 *   const args = parseArgs(process.argv.slice(2), { booleans: ['--redo'] })
 *   args.flag('--redo')          // boolean
 *   args.value('--limit', '0')   // string (last occurrence)
 *   args.values('--field')       // string[] (repeatable)
 *   args.int('--limit', 0)       // integer with fallback
 *   args.positional              // everything that is not an option or an option value
 */
export function parseArgs(argv, { booleans = [] } = {}) {
  const bools = new Set(booleans)
  const values = new Map()
  const flags = new Set()
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { positional.push(a); continue }
    if (bools.has(a) || i === argv.length - 1 || argv[i + 1].startsWith('--')) { flags.add(a); continue }
    if (!values.has(a)) values.set(a, [])
    values.get(a).push(argv[++i])
  }
  return {
    positional,
    flag: (name) => flags.has(name),
    value: (name, def) => { const v = values.get(name); return v ? v[v.length - 1] : def },
    values: (name) => values.get(name) ?? [],
    int(name, def) {
      const n = parseInt(this.value(name, ''), 10)
      return Number.isFinite(n) ? n : def
    },
  }
}
