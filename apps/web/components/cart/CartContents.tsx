'use client'

import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from './CartItemRow'
import { OrderTypeSelector } from './OrderTypeSelector'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import { formatMessage } from '@zakhtsyanka/shared/utils/i18n'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'
import Link from 'next/link'

interface CartContentsProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
}

export function CartContents({ lang, dict }: CartContentsProps) {
  const { items, orderType, subtotalCents, deliveryFeeCents, totalCents } = useCartStore()
  const d = dict as Record<string, Record<string, string>>
  const cartDict = d['cart'] ?? {}
  const commonDict = d['common'] ?? {}

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-stone-500 mb-6">{cartDict['empty']}</p>
        <Link
          href={`/${lang}/catalog` as any}
          className="inline-block bg-amber-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          {cartDict['emptyAction']}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Items + order type */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Item count */}
        <p className="text-sm text-stone-500">
          {formatMessage(cartDict['itemCount'] ?? '{count}', { count: itemCount }, lang)}
        </p>

        {/* Line items */}
        <div className="bg-white rounded-2xl border border-stone-100 px-4">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} lang={lang} dict={cartDict} />
          ))}
        </div>

        {/* Order type */}
        <div className="bg-white rounded-2xl border border-stone-100 p-4">
          <OrderTypeSelector lang={lang} dict={d} />
        </div>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-stone-100 p-5 sticky top-20 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900">
            {lang === 'uk' ? 'Підсумок' : 'Summary'}
          </h2>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>{cartDict['subtotal']}</span>
              <span>{formatPrice(subtotalCents(), lang)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-stone-600">
                <span>{cartDict['deliveryFee']}</span>
                <span>
                  {deliveryFeeCents > 0
                    ? formatPrice(deliveryFeeCents, lang)
                    : commonDict['free']}
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-100">
              <span>{cartDict['total']}</span>
              <span className="text-amber-700">{formatPrice(totalCents(), lang)}</span>
            </div>
          </div>

          <Link
            href={`/${lang}/checkout` as any}
            className="block w-full text-center bg-amber-600 text-white py-3 rounded-full font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            {cartDict['proceedToCheckout']}
          </Link>
        </div>
      </div>
    </div>
  )
}
