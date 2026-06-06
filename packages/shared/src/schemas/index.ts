import { z } from 'zod'
import type { Locale, FulfillmentType, OrderType } from '../types/index.js'

// ── Common ─────────────────────────────────────────────────────────────────
export const localeSchema = z.enum(['uk', 'en'] as const)

export const localizedStringSchema = z.object({
  uk: z.string().min(1),
  en: z.string().min(1),
})

// ── Product ────────────────────────────────────────────────────────────────
export const dietaryTagSchema = z.enum([
  'vegan',
  'vegetarian',
  'gluten-free',
  'nut-free',
  'dairy-free',
])

export const fulfillmentTypeSchema = z.enum(['pickup', 'delivery', 'preorder'])

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  nameUk: z.string().min(1, 'Ukrainian name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  descriptionUk: z.string().min(1, 'Ukrainian description is required'),
  descriptionEn: z.string().min(1, 'English description is required'),
  allergensUk: z.string().nullable(),
  allergensEn: z.string().nullable(),
  priceCents: z.number().int().positive(),
  photos: z.array(z.string().url()).max(8),
  dietaryTags: z.array(dietaryTagSchema),
  fulfillmentTypes: z.array(fulfillmentTypeSchema).min(1),
  dailyCap: z.number().int().positive().nullable(),
  isAvailable: z.boolean(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

// ── Order / checkout ───────────────────────────────────────────────────────
export const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
})

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
})

export const createOrderSchema = z
  .object({
    type: z.enum(['pickup', 'delivery'] as const),
    fulfillmentSlot: z.string().datetime(),
    lineItems: z.array(cartItemSchema).min(1),
    deliveryAddress: deliveryAddressSchema.nullable(),
    customerLanguage: localeSchema,
    guestEmail: z.string().email().nullable(),
  })
  .refine(
    (data) => data.type === 'pickup' || data.deliveryAddress !== null,
    { message: 'Delivery address is required for delivery orders', path: ['deliveryAddress'] },
  )

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// ── Custom request ─────────────────────────────────────────────────────────
export const createCustomRequestSchema = z.object({
  occasion: z.string().min(1).max(200),
  servings: z.number().int().positive().max(500),
  flavors: z.string().min(1).max(500),
  dietaryNeeds: z.string().max(500).nullable(),
  dateNeeded: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budgetCents: z.number().int().positive().nullable(),
  notes: z.string().max(2000).nullable(),
  guestEmail: z.string().email().nullable(),
  customerLanguage: localeSchema,
})

export type CreateCustomRequestInput = z.infer<typeof createCustomRequestSchema>

// ── Subscription ───────────────────────────────────────────────────────────
export const createSubscriptionSchema = z.object({
  productId: z.string().uuid(),
  frequency: z.enum(['weekly', 'biweekly', 'monthly'] as const),
  fulfillmentType: fulfillmentTypeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

// ── Store settings ─────────────────────────────────────────────────────────
export const storeHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/),
  close: z.string().regex(/^\d{2}:\d{2}$/),
})

export const deliveryZoneSchema = z.object({
  id: z.string(),
  label: z.string(),
  postalCodes: z.array(z.string()).optional(),
  radiusKm: z.number().positive().optional(),
  feeCents: z.number().int().nonnegative(),
})

export const updateStoreSettingsSchema = z.object({
  nameUk: z.string().min(1),
  nameEn: z.string().min(1),
  leadTimePickupHours: z.number().int().positive(),
  leadTimeDeliveryHours: z.number().int().positive(),
  hours: z.record(storeHoursSchema.nullable()),
  deliveryZones: z.array(deliveryZoneSchema),
  holidayClosures: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  ordersPaused: z.boolean(),
  announcementUk: z.string().max(500).nullable(),
  announcementEn: z.string().max(500).nullable(),
})

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>
