import 'server-only'
import { getSubscriptionsDueToday, advanceNextDate, updateSubscriptionStatus } from '@/lib/db/subscriptions'
import { chargeRecurrent } from '@/lib/wayforpay/server'
import { randomUUID } from 'node:crypto'

export interface BillingResult {
  total:     number
  succeeded: number
  failed:    number
  errors:    Array<{ subscriptionId: string; error: string }>
}

/**
 * Charge all active subscriptions due today.
 * Called by POST /api/cron/billing — should be scheduled to run daily at 06:00.
 * Each failure is logged but doesn't abort the rest of the run.
 */
export async function runSubscriptionBilling(): Promise<BillingResult> {
  const due = await getSubscriptionsDueToday()
  const result: BillingResult = { total: due.length, succeeded: 0, failed: 0, errors: [] }

  for (const sub of due) {
    if (!sub.wfpRectokenLifetime) {
      result.failed++
      result.errors.push({ subscriptionId: sub.id, error: 'No recToken stored' })
      await updateSubscriptionStatus(sub.id, 'paused')
      continue
    }

    const orderRef = `sub-${sub.id}-${randomUUID().slice(0, 8)}`

    try {
      const chargeResult = await chargeRecurrent({
        orderReference:    orderRef,
        orderDate:         Math.floor(Date.now() / 1000),
        amountCents:       sub.productPriceCents,
        currency:          'UAH',
        recToken:          sub.wfpRectokenLifetime,
        productNames:      [sub.productName],
        productCounts:     [1],
        productPriceCents: [sub.productPriceCents],
      })

      if (chargeResult.success) {
        // Advance to the next billing date
        await advanceNextDate(sub.id, sub.frequency, sub.nextFulfillmentDate)
        result.succeeded++
      } else {
        result.failed++
        result.errors.push({
          subscriptionId: sub.id,
          error: chargeResult.reason ?? chargeResult.transactionStatus ?? 'Charge declined',
        })
        // Pause subscription after a failed charge so the customer can update payment info
        await updateSubscriptionStatus(sub.id, 'paused')
      }
    } catch (err) {
      result.failed++
      result.errors.push({
        subscriptionId: sub.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}
