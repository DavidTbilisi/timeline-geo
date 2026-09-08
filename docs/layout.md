# Layout engine

`layoutEvents(events, periods, layoutOptions)` turns years into geometry. Everything it computes can be overridden per event through `event.layout`.

## Projection

`projectYear(periods, year)` maps a year to a stage x: find the period whose `startYear` is the last one at or before the year, then `startPx + (year − startYear) × pxPerYear`. `yearAtPx` inverts it. Years before the first period or after the last extrapolate with that period's scale.

## Per event

| value | rule |
|---|---|
| `left` | `projectYear(start) + eventOffsetX` |
| `bar` | `type === 'major'` and the projected span is at least `barMinPx` |
| `width` | the projected span for bars, else `0` (renders at `cardWidth`) |
| `hoverWidth` | the projected span (highlight on the date bar while hovering) |
| `row` | greedy packing, see below |
| `top` | `rowOffset + (row − 1) × rowPitch`; row 0 renders at the stage top |

Values are rounded to one decimal.

## Row packing

Events with an authored `layout.row` are placed first as fixed obstacles. The rest are sorted by `left` (then wider first) and each takes the lowest row in `1..maxRows` whose x-range is free, keeping `packGap` between neighbours. A card taller than one `rowPitch` (majors are 80 px on a 50 px pitch) reserves the rows it spills into. When no row is free the least crowded one is used and the slug is reported through the optional `LayoutDiagnostics` argument.

Packing runs over whatever array you pass; the events store passes one period at a time, so rows near a period boundary may overlap across periods. Author `layout.row` where that matters.

## Active period

While scrolling, the active period is the one under a probe placed `viewportWidth / 2 + activePeriodOffset` px from the left edge, clamped to just under the narrowest period's width. The clamp lets a period narrower than half the viewport still become active when you scroll to its start; with wide periods (the Bible dataset) the probe is simply the centre.

## Date labels

`formatDateRange(start, end, { bc, ad }, { showDuration })` produces `3954 BC`, `3954–3024 BC (930)`, `90 BC–3 AD`, `35–70 AD`. The event card uses it when an event has no `dates`, with the active locale's era labels.

## Banding

`computeBandOffsets(events, options)` handles a hand-authored pattern: a long bar and a shorter event that happened during it share a row and overlap in x. The minor is dropped `bandOffset` px into a sub-band, unless that would collide with the next row.

## Fidelity

`tests/unit/layout-fidelity.spec.ts` strips the authored layout from the Bible dataset (591 events) and compares the engine's output with the source site's pixel positions: 589 of 591 `left` values match within a pixel (the two exceptions are hand-moved), 59 of 92 bar widths match (the rest were hand-stretched), 418 of 499 hover widths match. Rows were hand-authored in the source, so that dataset keeps them as overrides; new datasets get the packer.
