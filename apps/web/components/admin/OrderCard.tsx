'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatTime } from '@zakhtsyanka/shared/utils'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { Order, OrderStatus } from '@zakhtsyanka/shared/types'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  received:        'preparing',
  preparing:       'ready',
  ready:           'out_for_delivery', // overridden to 'completed' for pickup below
  out_for_delivery: 'completed',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  received:         '→ Готуємо',
  preparing:        '→ Готово',
  ready:            '→ Видано',
  out_for_delivery: '→ Доставлено',
}

const STATUS_COLORS: Record<string, string> = {
  received:         'bg-blue-100 text-blue-800',
  preparing:        'bg-amber-100 text-amber-800',
  ready:            'bg-green-100 text-green-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  completed:        'bg-stone-100 text-stone-500',
  cancelled:        'bg-red-100 text-red-500',
}

const STATUS_UK: Record<string, string> = {
  received:         'Отримано',
  preparing:        'Готується',
  ready:            'Готово',
  out_for_delivery: 'В дорозі',
  completed:        'Виконано',
  cancelled:        'Скасовано',
}

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const nextStatus = order.type === 'pickup' && order.status === 'ready'
    ? 'completed'
    : (NEXT_STATUS[order.status] ?? null)

  const nextLabel = order.type === 'pickup' && order.status === 'ready'
    ? '→ Видано'
    : (NEXT_LABEL[order.status] ?? null)

  async function advanceStatus() {
    if (!nextStatus) return
    start(async () => {
      await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      router.refresh()
    })
  }

  const slotTime = formatTime(order.fulfillmentSlot, 'uk')
  const isNew    = order.status === 'received'

  return (
    <div className={[
      'bg-white rounded-xl border p-4 flex flex-col gap-3 transition-shadow',
      isNew ? 'border-blue-300 shadow-blue-100 shadow-md' : 'border-stone-200',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-lg text-stone-900">{slotTime}</p>
          <p className="text-xs text-stone-400">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? ''}`}>
            {STATUS_UK[order.status] ?? order.status}
          </span>
          <span className={[
            'px-2 py-0.5 rounded-full text-xs font-medium',
            order.type === 'pickup'
              ? 'bg-stone-100 text-stone-600'
              : 'bg-sky-100 text-sky-700',
          ].join(' ')}>
            {order.type === 'pickup' ? 'Самовивіз' : 'Доставка'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1">
        {order.lineItems.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-stone-700">{item.nameUk} × {item.quantity}</span>
            <span className="text-stone-500">{formatPrice(item.priceCents * item.quantity, 'uk')}</span>
          </div>
        ))}
      </div>

      {/* Contact */}
      {order.guestEmail && (
        <p className="text-xs text-stone-400 truncate">{order.guestEmail}</p>
      )}
      {order.deliveryAddress && (
        <p className="text-xs text-stone-500">
          {order.deliveryAddress.street}, {order.deliveryAddress.city}
        </p>
      )}

      {/* Advance button */}
      {nextLabel && nextStatus && (
        <button
          onClick={advanceStatus}
          disabled={pending}
          className="mt-1 w-full py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {pending ? '…' : nextLabel}
        </button>
      )}
    </div>
  )
}
