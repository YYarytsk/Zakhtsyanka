import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyIpnSignature, type WfpIpnBody } from '@/lib/wayforpay/server'
import { getOrderById, updateOrderStatus } from '@/lib/db/orders'
import { getStoreSettings } from '@/lib/db/settings'
import { sendOrderConfirmation } from '@/lib/notifications/email'
import { awardOrderPoints } from '@/lib/db/loyalty'
import { updateRequestStatus } from '@/lib/db/customRequests'
import { createSubscription } from '@/lib/db/subscriptions'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as WfpIpnBody | null
  if (!body) {
    return NextResponse.json({ status: 'refuse', message: 'Invalid body' })
  }

  // ── 1. Verify HMAC signature ────────────────────────────────────────────────
  if (!verifyIpnSignature(body)) {
    console.error('[wfp-ipn] Signature mismatch for order', body.orderReference)
    return NextResponse.json({ status: 'refuse', message: 'Invalid signature' })
  }

  // ── 2. Route by reference type ──────────────────────────────────────────────
  const ref = String(body.orderReference)

  // Subscription first-payment: "sub-init-{intentId}"
  // Look up the subscription_intent, create the subscription with the returned recToken.
  if (ref.startsWith('sub-init-')) {
    const intentId = ref.replace('sub-init-', '')
    if (body.transactionStatus === 'Approved') {
      const recToken = (body as Record<string, unknown>)['recToken'] as string | undefined
      const { createAdminClient } = await import('@/lib/supabase/server')
      const admin = createAdminClient()

      const { data: intent } = await admin
        .from('subscription_intents')
        .select('*')
        .eq('id', intentId)
        .eq('completed', false)
        .single<{
          id: string; customer_id: string; product_id: string
          frequency: string; fulfillment_type: string; start_date: string
        }>()

      if (intent) {
        await createSubscription({
          customerId:      intent.customer_id,
          productId:       intent.product_id,
          frequency:       intent.frequency as any,
          fulfillmentType: intent.fulfillment_type as any,
          startDate:       intent.start_date,
          recToken:        recToken ?? '',
        }).catch(console.error)

        // Mark intent as completed
        await admin.from('subscription_intents').update({ completed: true, rec_token: recToken ?? '' }).eq('id', intentId)
      }
    }
    return NextResponse.json({ status: 'accept' })
  }

  // Deposit payments use reference "deposit-{requestId}"
  if (ref.startsWith('deposit-')) {
    const requestId = ref.replace('deposit-', '')
    if (body.transactionStatus === 'Approved') {
      await updateRequestStatus(requestId, 'deposit_paid', { wfpRef: String(body.orderReference) }).catch(console.error)
    }
    return NextResponse.json({ status: 'accept' })
  }

  // ── 3. Find the order ───────────────────────────────────────────────────────
  const order = await getOrderById(ref).catch(() => null)
  if (!order) {
    console.error('[wfp-ipn] Order not found:', body.orderReference)
    // Acknowledge anyway — WayForPay retries on non-200 responses
    return NextResponse.json({ status: 'accept', message: 'Unknown order' })
  }

  // Idempotency: already past pending_payment — nothing to do
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ status: 'accept' })
  }

  // ── 3. Handle transaction outcome ───────────────────────────────────────────
  const approved = body.transactionStatus === 'Approved'

  if (approved) {
    await updateOrderStatus(order.id, 'received', String(body.orderReference))

    // Send confirmation email (fire-and-forget — don't fail the webhook if email fails)
    const settings = await getStoreSettings().catch(() => null)
    const storeName = order.customerLanguage === 'uk'
      ? (settings?.nameUk ?? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка')
      : (settings?.nameEn ?? process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka')

    sendOrderConfirmation({ ...order, status: 'received' }, storeName).catch((err) =>
      console.error('[wfp-ipn] Email send failed:', err),
    )

    // Award loyalty points for logged-in customers (1 pt per 10 UAH)
    if (order.customerId) {
      awardOrderPoints(order.customerId, order.id, order.totalCents).catch((err) =>
        console.error('[wfp-ipn] Loyalty award failed:', err),
      )
    }
  } else {
    await updateOrderStatus(order.id, 'cancelled')
  }

  // WayForPay expects this exact response shape to stop retrying
  return NextResponse.json({ status: 'accept' })
}
