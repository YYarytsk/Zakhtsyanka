import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createOrder, checkCapacity } from '@/lib/db/orders'
import { getProducts } from '@/lib/db/products'
import { getStoreSettings } from '@/lib/db/settings'
import { generateSlotsForDate } from '@/lib/db/slots'
import { buildPurchasePayload } from '@/lib/wayforpay/server'
import type { OrderLineItem } from '@zakhtsyanka/shared/types'

const intentSchema = z.object({
  type:             z.enum(['pickup', 'delivery']),
  fulfillmentSlot:  z.string().datetime(),
  customerLanguage: z.enum(['uk', 'en']),
  guestEmail:       z.string().email().nullable(),
  deliveryAddress:  z.object({
    street: z.string().min(1),
    city:   z.string().min(1),
    postalCode: z.string().min(1),
  }).nullable(),
  cartItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity:  z.number().int().positive().max(50),
  })).min(1),
})

export async function POST(request: NextRequest) {
  // ── 1. Parse + validate input ───────────────────────────────────────────────
  const body   = await request.json().catch(() => null)
  const parsed = intentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }
  const input = parsed.data

  // Delivery orders need an address
  if (input.type === 'delivery' && !input.deliveryAddress) {
    return NextResponse.json({ error: 'Delivery address required' }, { status: 400 })
  }

  // ── 2. Auth — get customer if logged in ─────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const customerId = user?.id ?? null

  // Guest orders require an email
  if (!customerId && !input.guestEmail) {
    return NextResponse.json({ error: 'Email required for guest checkout' }, { status: 400 })
  }

  // ── 3. Validate slot is still available ────────────────────────────────────
  const settings  = await getStoreSettings()
  if (settings.ordersPaused) {
    return NextResponse.json({ error: 'orders_paused' }, { status: 409 })
  }

  const slotDate    = new Date(input.fulfillmentSlot.slice(0, 10) + 'T00:00:00')
  const validSlots  = generateSlotsForDate(slotDate, input.type, settings)
  const chosenSlot  = validSlots.find((s) => s.datetime === input.fulfillmentSlot)
  if (!chosenSlot?.available) {
    return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 })
  }

  // ── 4. Fetch products + verify prices ──────────────────────────────────────
  const productIds = input.cartItems.map((i: { productId: string; quantity: number }) => i.productId)
  const allProducts = await getProducts({ availableOnly: false })
  const productMap  = new Map(allProducts.map((p) => [p.id, p]))

  const lineItems: OrderLineItem[] = []
  for (const cartItem of input.cartItems) {
    const product = productMap.get(cartItem.productId)
    if (!product || !product.isAvailable) {
      return NextResponse.json({ error: 'product_unavailable', productId: cartItem.productId }, { status: 409 })
    }
    lineItems.push({
      productId: product.id,
      nameUk:    product.nameUk,
      nameEn:    product.nameEn,
      priceCents: product.priceCents,
      quantity:  cartItem.quantity,
    })
  }

  // ── 5. Capacity check ───────────────────────────────────────────────────────
  const capacityItems = input.cartItems.map((ci: { productId: string; quantity: number }) => ({
    productId: ci.productId,
    quantity:  ci.quantity,
    dailyCap:  productMap.get(ci.productId)?.dailyCap ?? null,
  }))
  const capacity = await checkCapacity(capacityItems, input.fulfillmentSlot)
  if (!capacity.ok) {
    return NextResponse.json({ error: 'capacity_exceeded', productId: capacity.conflictingProductId }, { status: 409 })
  }

  // ── 6. Calculate totals ─────────────────────────────────────────────────────
  const subtotalCents    = lineItems.reduce((s, i) => s + i.priceCents * i.quantity, 0)
  let   deliveryFeeCents = 0
  if (input.type === 'delivery' && input.deliveryAddress) {
    const { validateDeliveryZone } = await import('@/lib/db/settings')
    const zone = validateDeliveryZone(input.deliveryAddress.postalCode, settings.deliveryZones)
    deliveryFeeCents = zone.feeCents
  }
  const totalCents = subtotalCents + deliveryFeeCents

  // ── 7. Create order ─────────────────────────────────────────────────────────
  const order = await createOrder({
    customerId,
    guestEmail:       input.guestEmail,
    type:             input.type,
    fulfillmentSlot:  input.fulfillmentSlot,
    deliveryAddress:  input.deliveryAddress,
    lineItems,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    customerLanguage: input.customerLanguage,
  })

  // ── 8. Build WayForPay payload ──────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const storeName = input.customerLanguage === 'uk'
    ? (process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка')
    : (process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka')

  const wfpPayload = buildPurchasePayload({
    orderReference:    order.id,
    orderDate:         Math.floor(Date.now() / 1000),
    amountCents:       totalCents,
    currency:          'UAH',
    productNames:      lineItems.map((i) =>
      input.customerLanguage === 'uk' ? i.nameUk : i.nameEn,
    ),
    productCounts:     lineItems.map((i) => i.quantity),
    productPriceCents: lineItems.map((i) => i.priceCents),
    clientEmail:       order.guestEmail ?? user?.email ?? '',
    returnUrl: `${appUrl}/${input.customerLanguage}/orders/${order.id}/confirmation`,
    serviceUrl: `${appUrl}/api/webhooks/wayforpay`,
  })

  return NextResponse.json({ orderId: order.id, wfpPayload })
}
