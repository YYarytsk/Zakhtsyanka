import { getOrdersForAdmin } from '@/lib/db/orders'
import { OrderQueueClient } from '@/components/admin/OrderQueueClient'
import { formatDate } from '@zakhtsyanka/shared/utils'

export default async function AdminOrdersPage() {
  const today  = new Date().toISOString().slice(0, 10)
  const orders = await getOrdersForAdmin(today)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Замовлення</h1>
          <p className="text-sm text-stone-400">{formatDate(today, 'uk')} · оновлюється кожні 15 сек</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-full">
          Онлайн
        </span>
      </div>
      <OrderQueueClient initialOrders={orders} />
    </div>
  )
}
