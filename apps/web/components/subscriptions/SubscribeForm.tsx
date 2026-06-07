'use client'

import { useState, useTransition } from 'react'
import { formatPrice } from '@zakhtsyanka/shared/utils'
import type { Product } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Wayforpay: new () => { run: (p: Record<string, unknown>) => void }
  }
}

function loadWfpScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Wayforpay !== 'undefined') { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://secure.wayforpay.com/server/pay-widget.js'
    s.onload = () => resolve(); s.onerror = () => reject()
    document.head.appendChild(s)
  })
}

const FREQ_UK: Record<string, string> = { weekly: 'Щотижня', biweekly: 'Раз на 2 тижні', monthly: 'Щомісяця' }
const FREQ_EN: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }
const TYPE_UK: Record<string, string> = { pickup: 'Самовивіз', delivery: 'Доставка' }
const TYPE_EN: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery' }

interface SubscribeFormProps {
  product: Product
  lang: SupportedLocale
}

export function SubscribeForm({ product, lang }: SubscribeFormProps) {
  const isUk = lang === 'uk'
  const [pending, start] = useTransition()
  const [error,   setError] = useState<string | null>(null)

  const [frequency,       setFrequency]       = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup')
  const [startDate,       setStartDate]       = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })

  const productName = isUk ? product.nameUk : product.nameEn

  async function handleSubscribe() {
    setError(null)
    start(async () => {
      const res = await fetch('/api/subscriptions/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug: product.slug, frequency, fulfillmentType, startDate, lang }),
      })
      const data = await res.json() as { wfpPayload?: Record<string, unknown>; error?: string }
      if (!res.ok || !data.wfpPayload) {
        setError(data.error ?? (isUk ? 'Помилка. Спробуйте ще раз.' : 'Error. Please try again.'))
        return
      }
      await loadWfpScript()
      new window.Wayforpay().run(data.wfpPayload)
    })
  }

  const selBase = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 bg-white'
  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500'

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <p className="text-sm font-medium text-amber-900">{productName}</p>
        <p className="font-bold text-amber-700">{formatPrice(product.priceCents, lang)}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {isUk ? 'Частота' : 'Frequency'}
        </label>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className={selBase}>
          {(['weekly', 'biweekly', 'monthly'] as const).map((f) => (
            <option key={f} value={f}>{(isUk ? FREQ_UK : FREQ_EN)[f]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {isUk ? 'Спосіб отримання' : 'Fulfillment'}
        </label>
        <div className="flex gap-2">
          {(['pickup', 'delivery'] as const).filter((t) => product.fulfillmentTypes.includes(t)).map((t) => (
            <button key={t} type="button" onClick={() => setFulfillmentType(t)}
              className={[
                'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                fulfillmentType === t ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-stone-300 text-stone-600',
              ].join(' ')}>
              {(isUk ? TYPE_UK : TYPE_EN)[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {isUk ? 'Перша дата отримання' : 'First delivery date'}
        </label>
        <input type="date" value={startDate} min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setStartDate(e.target.value)} className={inputBase} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <button onClick={handleSubscribe} disabled={pending}
        className="w-full py-3 bg-amber-600 text-white rounded-full font-semibold text-sm hover:bg-amber-700 disabled:opacity-50">
        {pending ? '…' : (isUk ? `Підписатися · ${formatPrice(product.priceCents, lang)}` : `Subscribe · ${formatPrice(product.priceCents, lang)}`)}
      </button>

      <p className="text-xs text-stone-400 text-center">
        {isUk
          ? 'Перший платіж стягується зараз. Подальші — автоматично. Скасувати можна будь-коли.'
          : 'First charge is now. Future charges are automatic. Cancel any time.'}
      </p>
    </div>
  )
}
