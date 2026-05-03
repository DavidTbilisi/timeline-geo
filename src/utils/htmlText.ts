/**
 * Strip HTML tags and decode common HTML entities to plain text.
 * Used for rendering JSON-sourced strings inside attribute contexts
 * (title attrs, alt attrs) where browsers do not decode HTML.
 *
 * Handles tags via regex and the named/numeric entities that appear in
 * timeline detail JSONs (extracted from biblehistory.com): &ndash;, &mdash;,
 * &hellip;, &amp;, &lt;, &gt;, &quot;, &apos;, &nbsp;, &#NNN;.
 */

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;':   '&',
  '&lt;':    '<',
  '&gt;':    '>',
  '&quot;':  '"',
  '&apos;':  "'",
  '&nbsp;':  ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
}

export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&[a-z]+;/gi, m => NAMED_ENTITIES[m.toLowerCase()] ?? m)
}
