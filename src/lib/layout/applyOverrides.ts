import type { TimelineEventInput, LaidOutEvent } from '../types/event'

/**
 * Resolve event layout. Until the layout engine lands this only copies the
 * authored `layout` overrides; the engine will compute defaults from
 * `start`/`end` and the period scale for anything left out.
 */
export function applyLayout(events: TimelineEventInput[]): LaidOutEvent[] {
  return events.map((e) => ({
    ...e,
    left: e.layout?.left ?? 0,
    width: e.layout?.width ?? 0,
    hoverWidth: e.layout?.hoverWidth ?? 0,
    row: e.layout?.row ?? 1,
    bar: e.layout?.bar ?? false,
  }))
}
