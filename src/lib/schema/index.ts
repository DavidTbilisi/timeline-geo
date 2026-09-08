import { z } from 'zod'

/**
 * Content schemas. Used by the `timeline-validate` CLI and emitted as JSON
 * Schema (`schema/*.schema.json`) for editor support. Kept in a separate
 * entry so the main package never depends on zod at runtime.
 */

export const localizedStringSchema = z.record(z.string().min(1), z.string())

export const periodSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  color: z.string().regex(/^#(?:[0-9a-f]{3}){1,2}$/i, 'expected a hex colour like #ad1f26'),
  era: z.number().int(),
  startYear: z.number(),
  pxPerYear: z.number().positive(),
  startPx: z.number().optional(),
  landingYear: z.number().optional(),
  sidebarImage: z.string().optional(),
  cardImage: z.string().optional(),
})

export const eraSchema = z.object({
  id: z.number().int(),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  periods: z.array(z.number().int()).min(1),
  logo: z.string().optional(),
  arch: z.object({ left: z.number(), width: z.number() }).optional(),
})

export const eventLayoutSchema = z.object({
  row: z.number().int().optional(),
  left: z.number().optional(),
  width: z.number().optional(),
  hoverWidth: z.number().optional(),
  bar: z.boolean().optional(),
})

export const eventSchema = z.object({
  id: z.number().int(),
  slug: z.string().min(1),
  period: z.number().int(),
  start: z.number(),
  end: z.number(),
  type: z.enum(['major', 'minor']),
  size: z.enum(['normal', 'small']).optional(),
  title: localizedStringSchema,
  dates: localizedStringSchema.optional(),
  image: z.string().nullable().optional(),
  layout: eventLayoutSchema.optional(),
})

export const detailSchema = z.object({
  slug: z.string().min(1),
  id: z.number().int(),
  period: z.number().int(),
  title: localizedStringSchema,
  dates: localizedStringSchema.optional(),
  description: localizedStringSchema.optional(),
  article: localizedStringSchema.optional(),
  related: z.array(z.object({ slug: z.string().min(1), title: localizedStringSchema })).default([]),
  images: z.array(z.object({ file: z.string(), caption: z.string().default('') })).default([]),
  videos: z.array(z.object({ title: z.string().default(''), caption: z.string().default(''), filename: z.string() })).default([]),
  extensions: z.record(z.string(), z.unknown()).optional(),
})

export const siteSchema = z.object({
  title: localizedStringSchema,
  welcome: z.object({ heading: localizedStringSchema, body: localizedStringSchema }).optional(),
})

export const schemas = {
  period: periodSchema,
  era: eraSchema,
  event: eventSchema,
  detail: detailSchema,
  site: siteSchema,
}

export type PeriodInput = z.infer<typeof periodSchema>
export type EraInput = z.infer<typeof eraSchema>
export type EventInput = z.infer<typeof eventSchema>
export type DetailInput = z.infer<typeof detailSchema>
export type SiteInput = z.infer<typeof siteSchema>
