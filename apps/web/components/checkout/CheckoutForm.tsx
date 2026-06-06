'use client'

import { useCartStore } from '@/lib/store/cart'
import { SlotPicker } from './SlotPicker'
import { DeliveryAddressForm } from './DeliveryAddressForm'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'
import Link from 'next/link'

interface CheckoutFormProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
}

export function CheckoutForm({ lang, dict }: CheckoutFormProps) {
  const { items, orderType, fulfillmentSlot, deliveryAddress, subtotalCents, deliveryFeeCents, totalCents } = useCartStore()
  const d = dict as Record<string, Record<string, string>>
  const checkoutDict = d['checkout'] ?? {}
  const commonDict = d['common'] ?? {}

  const canProceed =
    fulfillmentSlot !== null &&
    (orderType === 'pickup' || deliveryAddress !== null)

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 mb-4">
          {lang === 'uk' ? 'Ваш кошик порожній.' : 'Your cart is empty.'}
        </p>
        <Link href={`/${lang}/catalog` as any}
          className="text-amber-700 underline text-sm">
          {(d['cart'] ?? {})['emptyAction']}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Slot picker */}
      <section className="bg-white rounded-2xl border border-stone-100 p-6">
        <SlotPicker lang={lang} dict={d} />
      </section>

      {/* Delivery address (only when delivery selected) */}
      {orderType === 'delivery' && (
        <section className="bg-white rounded-2xl border border-stone-100 p-6">
          <DeliveryAddressForm lang={lang} dict={d} />
        </section>
      )}

      {/* Order summary */}
      <section className="bg-white rounded-2xl border border-stone-100 p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-stone-900">
          {lang === 'uk' ? 'Ваше замовлення' : 'Your order'}
        </h2>
        <div className="flex flex-col gap-1.5 text-sm text-stone-600">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <span>{lang === 'uk' ? item.nameUk : item.nameEn} × {item.quantity}</span>
              <span>{formatPrice(item.priceCents * item.quantity, lang)}</span>
            </div>
          ))}
          {orderType === 'delivery' && deliveryFeeCents > 0 && (
            <div className="flex justify-between">
              <span>{checkoutDict['delivery'] ?? 'Delivery'}</span>
              <span>{formatPrice(deliveryFeeCents, lang)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-100">
            <span>{commonDict['total'] ?? 'Total'}</span>
            <span className="text-amber-700">{formatPrice(totalCents(), lang)}</span>
          </div>
        </div>
      </section>

      {/* Pay button — WayForPay widget wired in Phase 1-C */}
      <button
        disabled={!canProceed}
        className="w-full py-3.5 rounded-full font-semibold text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {checkoutDict['placeOrder']}
      </button>

      {!canProceed && (
        <p className="text-xs text-stone-400 text-center -mt-4">
          {lang === 'uk'
            ? 'Оберіть час отримання, щоб продовжити'
            : 'Select a pickup/delivery time to continue'}
        </p>
      )}
    </div>
  )
}
