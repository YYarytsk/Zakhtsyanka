'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { SlotPicker } from './SlotPicker'
import { DeliveryAddressForm } from './DeliveryAddressForm'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'
import Link from 'next/link'

// Minimal global type for the WayForPay widget loaded from CDN
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Wayforpay: new () => { run: (payload: Record<string, unknown>) => void }
  }
}

interface CheckoutFormProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
}

export function CheckoutForm({ lang, dict }: CheckoutFormProps) {
  const { items, orderType, fulfillmentSlot, deliveryAddress, subtotalCents, deliveryFeeCents, totalCents } =
    useCartStore()
  const d            = dict as Record<string, Record<string, string>>
  const checkoutDict = d['checkout'] ?? {}
  const commonDict   = d['common'] ?? {}
  const errorsDict   = (d['checkout'] as unknown as Record<string, Record<string, string>>)?.['errors'] ?? {}

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const canProceed =
    fulfillmentSlot !== null &&
    (orderType === 'pickup' || deliveryAddress !== null)

  async function handlePay() {
    if (!canProceed || loading) return
    setError(null)
    setLoading(true)

    try {
      const guestEmail = prompt(
        lang === 'uk'
          ? 'Введіть ваш email для підтвердження замовлення:'
          : 'Enter your email for order confirmation:',
      )

      const res = await fetch('/api/orders/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:             orderType,
          fulfillmentSlot,
          customerLanguage: lang,
          guestEmail:       guestEmail ?? null,
          deliveryAddress:  orderType === 'delivery' ? deliveryAddress : null,
          cartItems:        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      })

      const data = await res.json() as { orderId?: string; wfpPayload?: Record<string, unknown>; error?: string }

      if (!res.ok || !data.wfpPayload) {
        const msg = data.error === 'slot_unavailable'    ? errorsDict['slotUnavailable']
                  : data.error === 'capacity_exceeded'   ? errorsDict['capacityExceeded']
                  : data.error === 'orders_paused'       ? (lang === 'uk' ? 'Замовлення тимчасово призупинено' : 'Orders are temporarily paused')
                  : errorsDict['generic']
        setError(msg ?? errorsDict['generic'] ?? 'Error')
        return
      }

      // Load WayForPay widget script dynamically, then run it
      await loadWfpScript()
      new window.Wayforpay().run(data.wfpPayload)
    } catch (err) {
      console.error(err)
      setError(errorsDict['generic'] ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 mb-4">
          {lang === 'uk' ? 'Ваш кошик порожній.' : 'Your cart is empty.'}
        </p>
        <Link href={`/${lang}/catalog` as any} className="text-amber-700 underline text-sm">
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

      {/* Delivery address */}
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
            <div className="flex justify-between text-stone-500">
              <span>{lang === 'uk' ? 'Доставка' : 'Delivery'}</span>
              <span>{formatPrice(deliveryFeeCents, lang)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-100">
            <span>{commonDict['total'] ?? 'Total'}</span>
            <span className="text-amber-700">{formatPrice(totalCents(), lang)}</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!canProceed || loading}
        className="w-full py-3.5 rounded-full font-semibold text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
              strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
          </svg>
        )}
        {checkoutDict['placeOrder']}
      </button>

      {!canProceed && !loading && (
        <p className="text-xs text-stone-400 text-center -mt-4">
          {lang === 'uk'
            ? 'Оберіть час отримання, щоб продовжити'
            : 'Select a pickup/delivery time to continue'}
        </p>
      )}

      <p className="text-xs text-stone-400 text-center">
        {checkoutDict['payment']
          ? (d['checkout'] as unknown as Record<string, Record<string, string>>)?.['payment']?.['secureNote']
          : ''}
      </p>
    </div>
  )
}

function loadWfpScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Wayforpay !== 'undefined') { resolve(); return }
    const s   = document.createElement('script')
    s.src     = 'https://secure.wayforpay.com/server/pay-widget.js'
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('WayForPay script failed to load'))
    document.head.appendChild(s)
  })
}
