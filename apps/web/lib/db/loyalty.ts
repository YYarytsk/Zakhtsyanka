import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import type { LoyaltyTransaction, LoyaltyTransactionReason } from '@zakhtsyanka/shared/types'

interface LoyaltyRow {
  id: string
  customer_id: string
  points: number
  reason: string
  order_id: string | null
  created_at: string
}

function mapTransaction(row: LoyaltyRow): LoyaltyTransaction {
  return {
    id:         row.id,
    customerId: row.customer_id,
    points:     row.points,
    reason:     row.reason as LoyaltyTransactionReason,
    orderId:    row.order_id,
    createdAt:  row.created_at,
  }
}

export async function getLoyaltyHistory(
  customerId: string,
  limit = 20,
): Promise<LoyaltyTransaction[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<LoyaltyRow[]>()

  if (error) throw new Error(`getLoyaltyHistory: ${error.message}`)
  return (data ?? []).map(mapTransaction)
}

/** Award points after a confirmed order. Call from the IPN webhook. */
export async function awardOrderPoints(
  customerId: string,
  orderId: string,
  totalCents: number,
): Promise<void> {
  // 1 point per 10 UAH (100 cents), minimum 1 point
  const points = Math.max(1, Math.floor(totalCents / 1000))
  const supabase = createAdminClient()

  // Insert transaction
  await supabase.from('loyalty_transactions').insert({
    customer_id: customerId,
    points,
    reason:   'order_earned',
    order_id: orderId,
  })

  // Update running balance on customers row
  await supabase.rpc('increment_loyalty_balance', {
    p_customer_id: customerId,
    p_points:      points,
  })
}

// Note: the RPC function needs to be created in Supabase:
// create or replace function increment_loyalty_balance(p_customer_id uuid, p_points int)
// returns void language sql security definer as $$
//   update customers set loyalty_balance_points = loyalty_balance_points + p_points
//   where id = p_customer_id;
// $$;
