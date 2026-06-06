// Raw Supabase row shapes (snake_case, matching the migration).
// Replace with `import type { Database } from '@/types/supabase'` once
// `pnpm supabase gen types typescript` has been run against the real project.

export interface CategoryRow {
  id: string
  slug: string
  name_uk: string
  name_en: string
  sort_order: number
}

export interface ProductRow {
  id: string
  category_id: string
  slug: string
  name_uk: string
  name_en: string
  description_uk: string
  description_en: string
  allergens_uk: string | null
  allergens_en: string | null
  price_cents: number
  photos: string[]
  dietary_tags: string[]
  fulfillment_types: string[]
  daily_cap: number | null
  is_available: boolean
  created_at: string
  categories?: CategoryRow | null
}

export interface StoreSettingsRow {
  id: string
  name_uk: string
  name_en: string
  lead_time_pickup_hours: number
  lead_time_delivery_hours: number
  hours: Record<string, { open: string; close: string } | null>
  delivery_zones: unknown[]
  holiday_closures: string[]
  orders_paused: boolean
  announcement_uk: string | null
  announcement_en: string | null
}
