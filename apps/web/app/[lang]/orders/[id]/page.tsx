import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../../dictionaries'
import { getOrderById } from '@/lib/db/orders'
import { formatDateTime, formatPrice } from '@zakhtsyanka/shared/utils'
import type { OrderStatus } from '@zakhtsyanka/shared/types'

const STATUS_STEPS: OrderStatus[] = [
  'received', 'preparing', 'ready', 'out_for_delivery', 'completed',
]

export default async function OrderPage(props: PageProps<'/[lang]/orders/[id]'>) {
  const { lang, id } = await props.params
  if (!hasLocale(lang)) notFound()

  const [order, dict] = await Promise.all([
    getOrderById(id),
    getDictionary(lang),
  ])
  if (!order || order.status === 'pending_payment') notFound()

  const d = dict as Record<string, Record<string, string>>
  const ordersDict  = d['orders'] ?? {}
  const statusDict  = d['orderStatus'] ?? {}

  const currentStep = STATUS_STEPS.indexOf(order.status as OrderStatus)
  const isDelivery  = order.type === 'delivery'

  const steps = isDelivery
    ? STATUS_STEPS
    : STATUS_STEPS.filter((s) => s !== 'out_for_delivery')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a href={`/${lang}/orders` as any}
        className="text-sm text-stone-500 hover:text-stone-900 transition-colors mb-6 block">
        ← {d['common']?.['back']}
      </a>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {ordersDict['orderNumber']?.replace('{id}', order.id.slice(0, 8).toUpperCase())}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {ordersDict['placedAt']?.replace('{date}', formatDateTime(order.createdAt, lang))}
          </p>
          <p className="text-sm text-stone-600 mt-1">
            {ordersDict['fulfillmentSlot']?.replace('{slot}', formatDateTime(order.fulfillmentSlot, lang))}
          </p>
        </div>

        {/* Status timeline */}
        <div>
          <p className="text-sm font-medium text-stone-700 mb-3">{ordersDict['timeline']}</p>
          <ol className="flex flex-col gap-1">
            {steps.map((step, i) => {
              const stepIndex = STATUS_STEPS.indexOf(step)
              const done      = stepIndex <= currentStep
              const active    = step === order.status

              return (
                <li key={step} className="flex items-center gap-3">
                  <span className={[
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    active ? 'bg-amber-600 text-white'
                    : done ? 'bg-green-500 text-white'
                    : 'bg-stone-100 text-stone-400',
                  ].join(' ')}>
                    {done && !active ? '✓' : i + 1}
                  </span>
                  <span className={active ? 'font-semibold text-stone-900' : done ? 'text-stone-600' : 'text-stone-400'}>
                    {statusDict[step] ?? step}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Line items */}
        <div className="border-t border-stone-100 pt-4">
          <div className="flex flex-col gap-2">
            {order.lineItems.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-stone-700">
                  {lang === 'uk' ? item.nameUk : item.nameEn} × {item.quantity}
                </span>
                <span className="text-stone-900 font-medium">
                  {formatPrice(item.priceCents * item.quantity, lang)}
                </span>
              </div>
            ))}
            {order.deliveryFeeCents > 0 && (
              <div className="flex justify-between text-sm text-stone-500">
                <span>{lang === 'uk' ? 'Доставка' : 'Delivery'}</span>
                <span>{formatPrice(order.deliveryFeeCents, lang)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-100">
              <span>{d['common']?.['total'] ?? 'Total'}</span>
              <span className="text-amber-700">{formatPrice(order.totalCents, lang)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
