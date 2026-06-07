import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestById } from '@/lib/db/customRequests'
import { buildPurchasePayload } from '@/lib/wayforpay/server'

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cr = await getRequestById(id)
  if (!cr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cr.status !== 'approved') return NextResponse.json({ error: 'Must be approved first' }, { status: 409 })
  if (!user || cr.customerId !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!cr.quoteCents) return NextResponse.json({ error: 'No quote set' }, { status: 409 })

  // Deposit = 30% of quote, minimum 50 UAH
  const depositCents = Math.max(5000, Math.round(cr.quoteCents * 0.3))
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const lang         = cr.customerLanguage
  const storeName    = lang === 'uk'
    ? (process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка')
    : (process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka')

  const productName = lang === 'uk'
    ? `Депозит: ${cr.occasion}`
    : `Deposit: ${cr.occasion}`

  const wfpPayload = buildPurchasePayload({
    orderReference:    `deposit-${id}`,
    orderDate:         Math.floor(Date.now() / 1000),
    amountCents:       depositCents,
    currency:          'UAH',
    productNames:      [productName],
    productCounts:     [1],
    productPriceCents: [depositCents],
    clientEmail:       user.email ?? '',
    returnUrl: `${appUrl}/${lang}/custom-order/${id}?deposit=paid`,
    serviceUrl: `${appUrl}/api/webhooks/wayforpay`,
  })

  return NextResponse.json({ depositCents, wfpPayload })
}
