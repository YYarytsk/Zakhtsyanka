import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { OrderLineItem } from '@zakhtsyanka/shared/types'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function GET(request: NextRequest) {
  if (!await requireStaff()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp   = request.nextUrl.searchParams
  const days = Math.min(parseInt(sp.get('days') ?? '30'), 90)
  const from = new Date(); from.setDate(from.getDate() - days)
  const fromStr = from.toISOString()

  const supabase = createAdminClient()

  // Fetch recent confirmed orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total_cents, subtotal_cents, delivery_fee_cents, line_items, type, status')
    .gte('created_at', fromStr)
    .not('status', 'in', '(cancelled,pending_payment)')
    .order('created_at')
    .returns<Array<{
      id: string
      created_at: string
      total_cents: number
      subtotal_cents: number
      delivery_fee_cents: number
      line_items: OrderLineItem[]
      type: string
      status: string
    }>>()

  const allOrders = orders ?? []

  // ── Daily revenue ─────────────────────────────────────────────────────────
  const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {}
  for (const o of allOrders) {
    const date = o.created_at.slice(0, 10)
    if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, orders: 0 }
    dailyMap[date]!.revenue += o.total_cents
    dailyMap[date]!.orders  += 1
  }
  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // ── Top products ──────────────────────────────────────────────────────────
  const productMap: Record<string, { nameUk: string; nameEn: string; qty: number; revenue: number }> = {}
  for (const o of allOrders) {
    for (const item of o.line_items) {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          nameUk:  item.nameUk,
          nameEn:  item.nameEn,
          qty:     0,
          revenue: 0,
        }
      }
      productMap[item.productId]!.qty     += item.quantity
      productMap[item.productId]!.revenue += item.priceCents * item.quantity
    }
  }
  const topProducts = Object.entries(productMap)
    .map(([id, v]) => ({ productId: id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalRevenue  = allOrders.reduce((s, o) => s + o.total_cents, 0)
  const totalOrders   = allOrders.length
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
  const pickupCount   = allOrders.filter((o) => o.type === 'pickup').length
  const deliveryCount = allOrders.filter((o) => o.type === 'delivery').length

  // ── Upcoming subscriptions (next 7 days) ──────────────────────────────────
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: upcomingSubs, count: subCount } = await supabase
    .from('subscriptions')
    .select('id, next_fulfillment_date', { count: 'exact' })
    .eq('status', 'active')
    .lte('next_fulfillment_date', nextWeek.toISOString().slice(0, 10))

  return NextResponse.json({
    summary: {
      totalRevenue, totalOrders, avgOrderValue,
      pickupCount, deliveryCount,
      activeSubscriptions: subCount ?? 0,
      periodDays: days,
    },
    daily,
    topProducts,
  })
}
