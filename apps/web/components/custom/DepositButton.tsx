'use client'

import { useState, useTransition } from 'react'
import { formatPrice } from '@zakhtsyanka/shared/utils'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Wayforpay: new () => { run: (payload: Record<string, unknown>) => void }
  }
}

interface DepositButtonProps {
  requestId: string
  lang: 'uk' | 'en'
}

function loadWfpScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Wayforpay !== 'undefined') { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://secure.wayforpay.com/server/pay-widget.js'
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error('WayForPay failed to load'))
    document.head.appendChild(s)
  })
}

export function DepositButton({ requestId, lang }: DepositButtonProps) {
  const [pending, start] = useTransition()
  const [error,   setError] = useState<string | null>(null)
  const isUk = lang === 'uk'

  async function handlePay() {
    setError(null)
    start(async () => {
      const res  = await fetch(`/api/custom-requests/${requestId}/deposit-intent`, { method: 'POST' })
      const data = await res.json() as { depositCents?: number; wfpPayload?: Record<string, unknown>; error?: string }

      if (!res.ok || !data.wfpPayload) {
        setError(data.error ?? (isUk ? 'Помилка' : 'Error'))
        return
      }

      await loadWfpScript()
      new window.Wayforpay().run(data.wfpPayload)
    })
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-sm font-medium text-green-800">
        {isUk ? '🎉 Ваш торт підтверджено! Сплатіть депозит для підтвердження замовлення.' : '🎉 Approved! Pay the deposit to confirm your order.'}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handlePay}
        disabled={pending}
        className="self-start px-6 py-2.5 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? '…' : (isUk ? 'Сплатити депозит' : 'Pay deposit')}
      </button>
    </div>
  )
}
