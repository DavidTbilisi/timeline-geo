/**
 * Merge helpers for locale-keyed content: a fresh scrape must never clobber
 * translations that only exist locally.
 */

const LOCALIZED_FIELDS = ['title', 'dates', 'description', 'article']

/** `{ ...next, ...(prev entries whose locale is in keep) }` — returns undefined when both are empty. */
export function mergeLocalized(prev, next, keep) {
  const out = { ...(next ?? {}) }
  for (const loc of keep) if (prev?.[loc]) out[loc] = prev[loc]
  return Object.keys(out).length ? out : undefined
}

/**
 * Merge a freshly mapped detail over an existing one, keeping the `keep`
 * locales of every localized field (including `related[].title`) and any
 * `extensions` keys the fresh record does not provide.
 */
export function mergeDetail(existing, fresh, { keep }) {
  if (!existing) return fresh
  const out = { ...fresh }
  for (const f of LOCALIZED_FIELDS) {
    const merged = mergeLocalized(existing[f], fresh[f], keep)
    if (merged) out[f] = merged
    else delete out[f]
  }
  const prevRelated = new Map((existing.related ?? []).map((r) => [r.slug, r.title]))
  out.related = (fresh.related ?? []).map((r) => ({ ...r, title: mergeLocalized(prevRelated.get(r.slug), r.title, keep) ?? {} }))
  if (existing.extensions) out.extensions = { ...existing.extensions, ...(fresh.extensions ?? {}) }
  return out
}
