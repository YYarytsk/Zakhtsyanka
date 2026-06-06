'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface ConfirmationPollerProps {
  orderId: string
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

type PollStatus = 'polling' | 'received' | 'cancelled' | 'failed'

export function ConfirmationPoller({ orderId, lang, dict }: ConfirmationPollerProps) {
  const [pollStatus, setPollStatus] = useState<PollStatus>('polling')
  const clearCart = useCartStore((s) => s.clearCart)
  const ordersDict = dict['orders'] ?? {}

  useEffect(() => {
    let attempts = 0
    const MAX    = 15   // 15 × 2s = 30s max

    const poll = setInterval(async () => {
      attempts++
      try {
        const res  = await fetch(`/api/orders/${orderId}/status`)
        const data = await res.json() as { status?: string }

        if (data.status === 'received' || data.status === 'preparing') {
          clearInterval(poll)
          clearCart()
          setPollStatus('received')
        } else if (data.status === 'cancelled') {
          clearInterval(poll)
          setPollStatus('cancelled')
        } else if (attempts >= MAX) {
          clearInterval(poll)
          setPollStatus('failed')
        }
      } catch {
        if (attempts >= MAX) {
          clearInterval(poll)
          setPollStatus('failed')
        }
      }
    }, 2000)

    return () => clearInterval(poll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (pollStatus === 'polling') {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
        <p className="text-stone-600">
          {lang === 'uk' ? 'Обробляємо оплату…' : 'Processing payment…'}
        </p>
      </div>
    )
  }

  if (pollStatus === 'received') {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">✓</div>
        <h1 className="text-2xl font-bold text-stone-900">{ordersDict['confirmationTitle']}</h1>
        <p className="text-stone-600">{ordersDict['confirmationText']}</p>
        <div className="flex flex-col gap-3 w-full">
          <Link
            href={`/${lang}/orders/${orderId}` as any}
            className="block w-full bg-amber-600 text-white py-3 rounded-full font-medium text-sm text-center hover:bg-amber-700 transition-colors"
          >
            {ordersDict['viewOrder']}
          </Link>
          <Link
            href={`/${lang}/catalog` as any}
            className="block w-full bg-stone-100 text-stone-700 py-3 rounded-full font-medium text-sm text-center hover:bg-stone-200 transition-colors"
          >
            {lang === 'uk' ? 'Продовжити покупки' : 'Continue shopping'}
          </Link>
        </div>
      </div>
    )
  }

  if (pollStatus === 'cancelled') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl">✗</div>
        <h1 className="text-xl font-bold text-stone-900">
          {lang === 'uk' ? 'Платіж скасовано' : 'Payment cancelled'}
        </h1>
        <p className="text-stone-500 text-sm">
          {lang === 'uk'
            ? 'Ваше замовлення не було оформлено. Спробуйте ще раз.'
            : 'Your order was not placed. Please try again.'}
        </p>
        <Link href={`/${lang}/checkout` as any}
          className="text-amber-700 underline text-sm">
          {lang === 'uk' ? 'Повернутись до оформлення' : 'Back to checkout'}
        </Link>
      </div>
    )
  }

  // failed / timeout
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-stone-600 text-sm">
        {lang === 'uk'
          ? 'Не вдалось підтвердити статус оплати. Якщо кошти списались — перевірте вашу пошту або зверніться до нас.'
          : 'Could not confirm payment status. If you were charged, please check your email or contact us.'}
      </p>
      <Link href={`/${lang}/orders/${orderId}` as any} className="text-amber-700 underline text-sm">
        {ordersDict['viewOrder']}
      </Link>
    </div>
  )
}
