import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/lib/db/products'
import { buildPurchasePayload } from '@/lib/wayforpay/server'

const schema = z.object({
  productSlug:     z.string().min(1),
  frequency:       z.enum(['weekly', 'biweekly', 'monthly']),
  fulfillmentType: z.enum(['pickup', 'delivery', 'preorder']),
  startDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lang:            z.enum(['uk', 'en']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const body   = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const d       = parsed.data
  const product = await getProductBySlug(d.productSlug)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Create a subscription_intent row to store params — IPN will complete it
  const admin = createAdminClient()
  const { data: intent, error } = await admin
    .from('subscription_intents')
    .insert({
      customer_id:     user.id,
      product_id:      product.id,
      frequency:       d.frequency,
      fulfillment_type: d.fulfillmentType,
      start_date:      d.startDate,
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !intent) return NextResponse.json({ error: 'Failed to create intent' }, { status: 500 })

  const freqUk: Record<string, string> = { weekly: 'щотижня', biweekly: 'раз на 2 тижні', monthly: 'щомісяця' }
  const freqEn: Record<string, string> = { weekly: 'weekly', biweekly: 'every 2 weeks', monthly: 'monthly' }
  const label  = d.lang === 'uk' ? freqUk[d.frequency] : freqEn[d.frequency]
  const pName  = d.lang === 'uk' ? `${product.nameUk} (${label})` : `${product.nameEn} (${label})`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const wfpPayload = buildPurchasePayload({
    orderReference:    `sub-init-${intent.id}`,
    orderDate:         Math.floor(Date.now() / 1000),
    amountCents:       product.priceCents,
    currency:          'UAH',
    productNames:      [pName],
    productCounts:     [1],
    productPriceCents: [product.priceCents],
    clientEmail:       user.email ?? '',
    returnUrl: `${appUrl}/${d.lang}/subscriptions?subscribed=true`,
    serviceUrl: `${appUrl}/api/webhooks/wayforpay`,
  })

  return NextResponse.json({ intentId: intent.id, priceCents: product.priceCents, wfpPayload })
}
