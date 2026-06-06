import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getProducts } from '@/lib/db/products'
import type { FulfillmentType } from '@zakhtsyanka/shared/types'

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const categorySlug    = sp.get('category') ?? undefined
  const dietaryTags     = sp.getAll('tags')
  const query           = sp.get('q') ?? undefined
  const fulfillmentType = (sp.get('fulfillment') as FulfillmentType) ?? undefined

  try {
    const products = await getProducts({ categorySlug, dietaryTags, query, fulfillmentType })
    return NextResponse.json(products)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
