import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import type { Order, OrderStatus, OrderType, OrderLineItem } from '@zakhtsyanka/shared/types'
import type { Locale } from '@zakhtsyanka/shared/types'
import { randomUUID } from 'node:crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderRow {
  id: string
  customer_id: string | null
  guest_email: string | null
  type: string
  status: string
  fulfillment_slot: string
  delivery_address: unknown
  line_items: OrderLineItem[]
  subtotal_cents: number
  delivery_fee_cents: number
  total_cents: number
  wfp_order_reference: string | null
  customer_language: string
  created_at: string
}

function mapOrder(row: OrderRow): Order {
  return {
    id:                   row.id,
    customerId:           row.customer_id,
    guestEmail:           row.guest_email,
    type:                 row.type as OrderType,
    status:               row.status as OrderStatus,
    fulfillmentSlot:      row.fulfillment_slot,
    deliveryAddress:      row.delivery_address as Order['deliveryAddress'],
    lineItems:            row.line_items,
    subtotalCents:        row.subtotal_cents,
    deliveryFeeCents:     row.delivery_fee_cents,
    totalCents:           row.total_cents,
    wfpOrderReference:    row.wfp_order_reference,
    customerLanguage:     row.customer_language as Locale,
    createdAt:            row.created_at,
  }
}

// ── Capacity check ─────────────────────────────────────────────────────────────

/**
 * For each product with a daily_cap, sum existing non-cancelled orders on the
 * same calendar day as fulfillmentSlot. Returns the first productId that would
 * exceed its cap, or null if all clear.
 */
export async function checkCapacity(
  items: { productId: string; quantity: number; dailyCap: number | null }[],
  fulfillmentSlot: string,
): Promise<{ ok: boolean; conflictingProductId: string | null }> {
  const capItems = items.filter((i) => i.dailyCap !== null)
  if (capItems.length === 0) return { ok: true, conflictingProductId: null }

  const supabase = createAdminClient()
  const slotDate = fulfillmentSlot.slice(0, 10) // YYYY-MM-DD

  // Fetch all orders for that day (non-cancelled, non-pending-timed-out)
  const { data: dayOrders } = await supabase
    .from('orders')
    .select('line_items')
    .gte('fulfillment_slot', `${slotDate}T00:00:00Z`)
    .lt('fulfillment_slot', `${slotDate}T23:59:59Z`)
    .not('status', 'in', '(cancelled)')

  const existing: Record<string, number> = {}
  for (const order of dayOrders ?? []) {
    for (const item of (order.line_items as OrderLineItem[])) {
      existing[item.productId] = (existing[item.productId] ?? 0) + item.quantity
    }
  }

  for (const item of capItems) {
    const already = existing[item.productId] ?? 0
    if (already + item.quantity > (item.dailyCap as number)) {
      return { ok: false, conflictingProductId: item.productId }
    }
  }

  return { ok: true, conflictingProductId: null }
}

// ── Create order ───────────────────────────────────────────────────────────────

export interface CreateOrderParams {
  customerId: string | null
  guestEmail: string | null
  type: OrderType
  fulfillmentSlot: string
  deliveryAddress: Order['deliveryAddress']
  lineItems: OrderLineItem[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
  customerLanguage: Locale
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const supabase = createAdminClient()
  const id = randomUUID()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      id,
      customer_id:       params.customerId,
      guest_email:       params.guestEmail,
      type:              params.type,
      status:            'pending_payment',
      fulfillment_slot:  params.fulfillmentSlot,
      delivery_address:  params.deliveryAddress,
      line_items:        params.lineItems,
      subtotal_cents:    params.subtotalCents,
      delivery_fee_cents: params.deliveryFeeCents,
      total_cents:       params.totalCents,
      customer_language: params.customerLanguage,
    })
    .select()
    .single<OrderRow>()

  if (error) throw new Error(`createOrder: ${error.message}`)
  return mapOrder(data)
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select()
    .eq('id', id)
    .single<OrderRow>()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getOrderById: ${error.message}`)
  }
  return data ? mapOrder(data) : null
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select()
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .returns<OrderRow[]>()

  if (error) throw new Error(`getOrdersByCustomer: ${error.message}`)
  return (data ?? []).map(mapOrder)
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  wfpOrderReference?: string,
): Promise<void> {
  const supabase = createAdminClient()
  const update: Record<string, unknown> = { status }
  if (wfpOrderReference) update['wfp_order_reference'] = wfpOrderReference

  const { error } = await supabase.from('orders').update(update).eq('id', id)
  if (error) throw new Error(`updateOrderStatus: ${error.message}`)
}

// ── Admin queries ──────────────────────────────────────────────────────────────

export async function getOrdersForAdmin(date?: string): Promise<Order[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('orders')
    .select()
    .not('status', 'eq', 'pending_payment')
    .order('created_at', { ascending: false })

  if (date) {
    q = q
      .gte('fulfillment_slot', `${date}T00:00:00Z`)
      .lt('fulfillment_slot', `${date}T23:59:59Z`)
  }

  const { data, error } = await q.returns<OrderRow[]>()
  if (error) throw new Error(`getOrdersForAdmin: ${error.message}`)
  return (data ?? []).map(mapOrder)
}
