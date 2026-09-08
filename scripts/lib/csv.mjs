/** RFC 4180-ish CSV helpers. */

export function csvEscape(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function csvRow(cells) {
  return cells.map(csvEscape).join(',')
}

/** Parse CSV text into rows of cells. Handles quoted fields, doubled quotes and CRLF. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { cell += c }
    } else if (c === '"' && cell === '') { inQuotes = true }
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else { cell += c }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}
