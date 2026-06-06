import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertProduct } from '@/lib/db/products'
import { createProductSchema } from '@zakhtsyanka/shared/schemas'
import { toSlug } from '@zakhtsyanka/shared/utils'
import { randomUUID } from 'node:crypto'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function POST(request: NextRequest) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const slug = (typeof body['slug'] === 'string' && body['slug'])
    ? body['slug']
    : toSlug(d.nameEn || d.nameUk)

  try {
    const product = await upsertProduct({
      id: randomUUID(),
      category_id:      d.categoryId,
      slug,
      name_uk:          d.nameUk,
      name_en:          d.nameEn,
      description_uk:   d.descriptionUk,
      description_en:   d.descriptionEn,
      allergens_uk:     d.allergensUk ?? null,
      allergens_en:     d.allergensEn ?? null,
      price_cents:      d.priceCents,
      photos:           d.photos,
      dietary_tags:     d.dietaryTags,
      fulfillment_types: d.fulfillmentTypes,
      daily_cap:        d.dailyCap ?? null,
      is_available:     d.isAvailable,
    })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Record<string, unknown>
  const id = typeof body['id'] === 'string' ? body['id'] : null
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const slug = (typeof body['slug'] === 'string' && body['slug'])
    ? body['slug']
    : toSlug(d.nameEn || d.nameUk)

  try {
    const product = await upsertProduct({
      id,
      category_id:      d.categoryId,
      slug,
      name_uk:          d.nameUk,
      name_en:          d.nameEn,
      description_uk:   d.descriptionUk,
      description_en:   d.descriptionEn,
      allergens_uk:     d.allergensUk ?? null,
      allergens_en:     d.allergensEn ?? null,
      price_cents:      d.priceCents,
      photos:           d.photos,
      dietary_tags:     d.dietaryTags,
      fulfillment_types: d.fulfillmentTypes,
      daily_cap:        d.dailyCap ?? null,
      is_available:     d.isAvailable,
    })
    return NextResponse.json(product)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
