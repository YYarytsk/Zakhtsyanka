import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'node:crypto'
import type {
  Subscription, SubscriptionFrequency, SubscriptionStatus, FulfillmentType,
} from '@zakhtsyanka/shared/types'

// ── Row type ──────────────────────────────────────────────────────────────────

interface SubscriptionRow {
  id: string
  customer_id: string
  product_id: string
  frequency: string
  fulfillment_type: string
  next_fulfillment_date: string
  status: string
  wfp_rectoken_lifetime: string | null
  created_at: string
}

function mapSub(r: SubscriptionRow): Subscription {
  return {
    id:                  r.id,
    customerId:          r.customer_id,
    productId:           r.product_id,
    frequency:           r.frequency as SubscriptionFrequency,
    fulfillmentType:     r.fulfillment_type as FulfillmentType,
    nextFulfillmentDate: r.next_fulfillment_date,
    status:              r.status as SubscriptionStatus,
    wfpRectokenLifetime: r.wfp_rectoken_lifetime,
    createdAt:           r.created_at,
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function nextDate(from: string, frequency: SubscriptionFrequency): string {
  const d = new Date(from + 'T00:00:00')
  switch (frequency) {
    case 'weekly':   d.setDate(d.getDate() + 7);  break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly':  d.setMonth(d.getMonth() + 1); break
  }
  return d.toISOString().slice(0, 10)
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export interface CreateSubscriptionParams {
  customerId: string
  productId: string
  frequency: SubscriptionFrequency
  fulfillmentType: FulfillmentType
  startDate: string
  recToken: string
}

export async function createSubscription(p: CreateSubscriptionParams): Promise<Subscription> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      id:                    randomUUID(),
      customer_id:           p.customerId,
      product_id:            p.productId,
      frequency:             p.frequency,
      fulfillment_type:      p.fulfillmentType,
      next_fulfillment_date: p.startDate,
      status:                'active',
      wfp_rectoken_lifetime: p.recToken,
    })
    .select()
    .single<SubscriptionRow>()
  if (error) throw new Error(`createSubscription: ${error.message}`)
  return mapSub(data)
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions').select().eq('id', id).single<SubscriptionRow>()
  return data ? mapSub(data) : null
}

export async function getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select()
    .eq('customer_id', customerId)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })
    .returns<SubscriptionRow[]>()
  return (data ?? []).map(mapSub)
}

export async function getAllSubscriptionsAdmin(): Promise<Subscription[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select()
    .not('status', 'eq', 'cancelled')
    .order('next_fulfillment_date')
    .returns<SubscriptionRow[]>()
  return (data ?? []).map(mapSub)
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('subscriptions').update({ status }).eq('id', id)
}

export async function advanceNextDate(
  id: string,
  frequency: SubscriptionFrequency,
  currentDate: string,
): Promise<void> {
  const supabase = createAdminClient()
  const next = nextDate(currentDate, frequency)
  await supabase.from('subscriptions').update({ next_fulfillment_date: next }).eq('id', id)
}

export async function skipNextFulfillment(
  subscriptionId: string,
  dateToSkip: string,
): Promise<void> {
  const supabase = createAdminClient()
  // Record the skip
  await supabase.from('subscription_skips').insert({ subscription_id: subscriptionId, skip_date: dateToSkip })
  // Move next_fulfillment_date forward
  const sub = await getSubscription(subscriptionId)
  if (sub) await advanceNextDate(subscriptionId, sub.frequency, dateToSkip)
}

// ── Production list ───────────────────────────────────────────────────────────

export interface ProductionItem {
  productId: string
  nameUk: string
  nameEn: string
  fulfillmentType: string
  count: number
}

export async function getProductionList(date: string): Promise<ProductionItem[]> {
  const supabase = createAdminClient()

  // Active subscriptions due on this date that haven't been skipped
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('product_id, fulfillment_type, products(name_uk, name_en)')
    .eq('next_fulfillment_date', date)
    .eq('status', 'active')
    .returns<Array<{
      product_id: string
      fulfillment_type: string
      products: { name_uk: string; name_en: string } | null
    }>>()

  if (!subs || subs.length === 0) return []

  // Check for any skips on this date
  const subIds = subs.map((s) => s.product_id)
  const { data: skips } = await supabase
    .from('subscription_skips')
    .select('subscription_id')
    .eq('skip_date', date)
    .in('subscription_id', subIds)

  const skippedIds = new Set((skips ?? []).map((s) => s.subscription_id))

  // Aggregate counts
  const aggregate: Record<string, ProductionItem> = {}
  for (const sub of subs) {
    if (skippedIds.has(sub.product_id)) continue
    const key = `${sub.product_id}-${sub.fulfillment_type}`
    if (!aggregate[key]) {
      aggregate[key] = {
        productId:       sub.product_id,
        nameUk:          sub.products?.name_uk ?? '',
        nameEn:          sub.products?.name_en ?? '',
        fulfillmentType: sub.fulfillment_type,
        count:           0,
      }
    }
    aggregate[key]!.count++
  }

  return Object.values(aggregate).sort((a, b) => a.nameUk.localeCompare(b.nameUk))
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function getSubscriptionsDueToday(): Promise<
  Array<Subscription & { productName: string; productPriceCents: number }>
> {
  const today = new Date().toISOString().slice(0, 10)
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('*, products(name_uk, name_en, price_cents)')
    .eq('next_fulfillment_date', today)
    .eq('status', 'active')
    .returns<Array<SubscriptionRow & {
      products: { name_uk: string; name_en: string; price_cents: number } | null
    }>>()

  if (!data) return []

  // Filter out skipped
  const ids = data.map((s) => s.id)
  const { data: skips } = await supabase
    .from('subscription_skips')
    .select('subscription_id')
    .eq('skip_date', today)
    .in('subscription_id', ids)

  const skippedIds = new Set((skips ?? []).map((s) => s.subscription_id))

  return data
    .filter((s) => !skippedIds.has(s.id))
    .map((s) => ({
      ...mapSub(s),
      productName:       s.products?.name_uk ?? '',
      productPriceCents: s.products?.price_cents ?? 0,
    }))
}
