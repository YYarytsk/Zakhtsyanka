import Link from 'next/link'
import type { Order } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'
import { formatPrice, formatDateTime } from '@zakhtsyanka/shared/utils'

const STATUS_UK: Record<string, string> = {
  pending_payment:  'Очікує оплати',
  received:         'Отримано',
  preparing:        'Готується',
  ready:            'Готово',
  out_for_delivery: 'В дорозі',
  completed:        'Виконано',
  cancelled:        'Скасовано',
}
const STATUS_EN: Record<string, string> = {
  pending_payment:  'Pending payment',
  received:         'Received',
  preparing:        'Preparing',
  ready:            'Ready',
  out_for_delivery: 'Out for delivery',
  completed:        'Completed',
  cancelled:        'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment:  'bg-stone-100 text-stone-500',
  received:         'bg-blue-100 text-blue-700',
  preparing:        'bg-amber-100 text-amber-700',
  ready:            'bg-green-100 text-green-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  completed:        'bg-stone-100 text-stone-600',
  cancelled:        'bg-red-100 text-red-600',
}

interface OrderHistoryListProps {
  orders: Order[]
  lang: SupportedLocale
  emptyMessage: string
}

export function OrderHistoryList({ orders, lang, emptyMessage }: OrderHistoryListProps) {
  const labels = lang === 'uk' ? STATUS_UK : STATUS_EN

  if (orders.length === 0) {
    return <p className="text-stone-400 text-sm py-8 text-center">{emptyMessage}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/${lang}/orders/${order.id}` as any}
          className="bg-white rounded-xl border border-stone-100 p-4 hover:border-amber-200 transition-colors flex items-center gap-4"
        >
          {/* Date + ID */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-stone-900 text-sm">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] ?? ''}`}>
                {labels[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {formatDateTime(order.fulfillmentSlot, lang)}
            </p>
            <p className="text-xs text-stone-500 mt-1 truncate">
              {order.lineItems.map((i) => `${lang === 'uk' ? i.nameUk : i.nameEn} ×${i.quantity}`).join(', ')}
            </p>
          </div>

          {/* Total */}
          <div className="text-right shrink-0">
            <p className="font-semibold text-amber-700">{formatPrice(order.totalCents, lang)}</p>
            <p className="text-xs text-stone-400">
              {order.type === 'pickup'
                ? (lang === 'uk' ? 'Самовивіз' : 'Pickup')
                : (lang === 'uk' ? 'Доставка' : 'Delivery')}
            </p>
          </div>

          <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  )
}
