import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Product, Category, DietaryTag, FulfillmentType } from '@zakhtsyanka/shared/types'
import type { ProductRow, CategoryRow } from './types'

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameUk: row.name_uk,
    nameEn: row.name_en,
    sortOrder: row.sort_order,
  }
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    categoryId: row.category_id,
    category: row.categories ? mapCategory(row.categories) : undefined,
    slug: row.slug,
    nameUk: row.name_uk,
    nameEn: row.name_en,
    descriptionUk: row.description_uk,
    descriptionEn: row.description_en,
    allergensUk: row.allergens_uk,
    allergensEn: row.allergens_en,
    priceCents: row.price_cents,
    photos: row.photos,
    dietaryTags: row.dietary_tags as DietaryTag[],
    fulfillmentTypes: row.fulfillment_types as FulfillmentType[],
    dailyCap: row.daily_cap,
    isAvailable: row.is_available,
    createdAt: row.created_at,
  }
}

// ── Query options ─────────────────────────────────────────────────────────────

export interface ProductFilters {
  categorySlug?: string
  dietaryTags?: string[]
  fulfillmentType?: FulfillmentType
  query?: string
  availableOnly?: boolean
}

// ── Public queries (use anon client) ─────────────────────────────────────────

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = await createClient()

  let q = supabase
    .from('products')
    .select('*, categories!inner(*)')
    .order('name_uk')

  if (filters.availableOnly !== false) {
    q = q.eq('is_available', true)
  }

  if (filters.categorySlug) {
    q = q.eq('categories.slug', filters.categorySlug)
  }

  if (filters.dietaryTags && filters.dietaryTags.length > 0) {
    // Postgres array overlap: product must have ALL requested tags
    q = q.contains('dietary_tags', filters.dietaryTags)
  }

  if (filters.fulfillmentType) {
    q = q.contains('fulfillment_types', [filters.fulfillmentType])
  }

  if (filters.query && filters.query.trim()) {
    q = q.textSearch('search_vector', filters.query.trim(), {
      type: 'websearch',
      config: 'simple',
    })
  }

  const { data, error } = await q.returns<ProductRow[]>()
  if (error) throw new Error(`getProducts: ${error.message}`)
  return (data ?? []).map(mapProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('is_available', true)
    .single<ProductRow>()

  if (error) {
    if (error.code === 'PGRST116') return null  // not found
    throw new Error(`getProductBySlug: ${error.message}`)
  }
  return data ? mapProduct(data) : null
}

export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_available', true)
  return (data ?? []).map((r: { slug: string }) => r.slug)
}

// ── Admin queries (use service-role client) ───────────────────────────────────

export async function getAllProductsAdmin(): Promise<Product[]> {
  // Import inline to keep the anon/admin boundary explicit
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .order('name_uk')
    .returns<ProductRow[]>()

  if (error) throw new Error(`getAllProductsAdmin: ${error.message}`)
  return (data ?? []).map(mapProduct)
}

export async function upsertProduct(
  product: Omit<ProductRow, 'created_at' | 'categories'>,
): Promise<Product> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .upsert(product, { onConflict: 'id' })
    .select('*, categories(*)')
    .single<ProductRow>()

  if (error) throw new Error(`upsertProduct: ${error.message}`)
  return mapProduct(data)
}

export async function deleteProduct(id: string): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(`deleteProduct: ${error.message}`)
}
