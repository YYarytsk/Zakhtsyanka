import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@zakhtsyanka/shared/types'
import type { CategoryRow } from './types'

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameUk: row.name_uk,
    nameEn: row.name_en,
    sortOrder: row.sort_order,
  }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .returns<CategoryRow[]>()

  if (error) throw new Error(`getCategories: ${error.message}`)
  return (data ?? []).map(mapCategory)
}
