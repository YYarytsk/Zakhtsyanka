import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@zakhtsyanka/shared/utils'

async function fetchReport(days = 30) {
  const supabase = createAdminClient()
  const from = new Date(); from.setDate(from.getDate() - days)
  const fromStr = from.toISOString()

  const [ordersRes, subsRes, customRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, total_cents, type, line_items')
      .gte('created_at', fromStr)
      .not('status', 'in', '(cancelled,pending_payment)')
      .returns<Array<{ id: string; created_at: string; total_cents: number; type: string; line_items: Array<{ productId: string; nameUk: string; quantity: number; priceCents: number }> }>>(),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('custom_requests')
      .select('id, occasion, date_needed, status')
      .not('status', 'in', '(completed,cancelled)')
      .order('date_needed')
      .limit(5)
      .returns<Array<{ id: string; occasion: string; date_needed: string; status: string }>>(),
  ])

  const orders   = ordersRes.data ?? []
  const total    = orders.reduce((s, o) => s + o.total_cents, 0)
  const avgOrder = orders.length ? Math.round(total / orders.length) : 0

  // Daily revenue last 14 days
  const dailyMap: Record<string, number> = {}
  orders.forEach((o) => {
    const d = o.created_at.slice(0, 10)
    dailyMap[d] = (dailyMap[d] ?? 0) + o.total_cents
  })

  // Top products
  const prodMap: Record<string, { name: string; qty: number }> = {}
  orders.forEach((o) => {
    o.line_items.forEach((item) => {
      if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.nameUk, qty: 0 }
      prodMap[item.productId]!.qty += item.quantity
    })
  })
  const topProducts = Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 8)

  return {
    totalRevenue: total,
    totalOrders:  orders.length,
    avgOrder,
    pickups:   orders.filter((o) => o.type === 'pickup').length,
    deliveries: orders.filter((o) => o.type === 'delivery').length,
    activeSubs: subsRes.count ?? 0,
    daily: Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).slice(-14),
    topProducts,
    upcomingCustomOrders: customRes.data ?? [],
    days,
  }
}

const STATUS_UK: Record<string, string> = {
  submitted: 'Нова', quoted: 'Запропоновано', approved: 'Підтверджено',
  deposit_paid: 'Депозит', scheduled: 'Заплановано',
}

export default async function AdminReportsPage() {
  const report = await fetchReport(30)
  const maxDaily = Math.max(...report.daily.map(([, v]) => v), 1)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold text-stone-900">Звіти · Останні {report.days} днів</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Виручка',         value: formatPrice(report.totalRevenue, 'uk') },
          { label: 'Замовлень',        value: report.totalOrders },
          { label: 'Середній чек',     value: formatPrice(report.avgOrder, 'uk') },
          { label: 'Самовивіз',        value: report.pickups },
          { label: 'Доставка',         value: report.deliveries },
          { label: 'Активних підписок', value: report.activeSubs },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Daily bar chart (pure CSS, no library) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-700 text-sm mb-4">Виручка по днях</h2>
        <div className="flex items-end gap-1 h-32">
          {report.daily.map(([date, revenue]) => {
            const heightPct = Math.max(4, Math.round((revenue / maxDaily) * 100))
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-amber-400 rounded-t-sm group-hover:bg-amber-600 transition-colors"
                  style={{ height: `${heightPct}%` }}
                  title={`${date}: ${formatPrice(revenue, 'uk')}`}
                />
              </div>
            )
          })}
        </div>
        {report.daily.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">Немає даних</p>
        )}
      </div>

      {/* Two-column: top products + upcoming custom orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-700 text-sm mb-4">Топ товари (кількість)</h2>
          {report.topProducts.length === 0 ? (
            <p className="text-stone-400 text-sm">Немає даних</p>
          ) : (
            <div className="flex flex-col gap-2">
              {report.topProducts.map(({ name, qty }, i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-stone-400 w-4 text-right">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-800 truncate">{name}</span>
                      <span className="font-semibold text-stone-900 shrink-0 ml-2">{qty}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.round((qty / (report.topProducts[0]?.qty ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming custom orders */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h2 className="font-semibold text-stone-700 text-sm mb-4">
            Найближчі індивідуальні замовлення
          </h2>
          {report.upcomingCustomOrders.length === 0 ? (
            <p className="text-stone-400 text-sm">Немає найближчих замовлень</p>
          ) : (
            <div className="flex flex-col gap-3">
              {report.upcomingCustomOrders.map((cr) => (
                <a
                  key={cr.id}
                  href={`/admin/custom-requests/${cr.id}`}
                  className="flex items-center justify-between hover:bg-stone-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{cr.occasion}</p>
                    <p className="text-xs text-stone-400">{cr.date_needed}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {STATUS_UK[cr.status] ?? cr.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
