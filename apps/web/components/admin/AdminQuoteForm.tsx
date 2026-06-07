'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomRequestStatus } from '@zakhtsyanka/shared/types'

const NEXT_STATUSES: Partial<Record<CustomRequestStatus, CustomRequestStatus[]>> = {
  submitted:    ['quoted', 'cancelled'],
  quoted:       ['scheduled', 'cancelled'],
  approved:     ['scheduled'],
  deposit_paid: ['scheduled', 'completed'],
  scheduled:    ['completed', 'cancelled'],
}

const STATUS_UK: Record<string, string> = {
  quoted:     'Надіслати пропозицію',
  scheduled:  'Заплановано',
  completed:  'Виконано',
  cancelled:  'Скасувати',
}

interface AdminQuoteFormProps {
  requestId: string
  currentStatus: string
  currentQuoteCents: number | null
}

export function AdminQuoteForm({ requestId, currentStatus, currentQuoteCents }: AdminQuoteFormProps) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)

  const [quote,    setQuote]    = useState(currentQuoteCents ? (currentQuoteCents / 100).toString() : '')
  const [message,  setMessage]  = useState('')
  const [status,   setStatus]   = useState<CustomRequestStatus>(currentStatus as CustomRequestStatus)

  const availableStatuses = NEXT_STATUSES[currentStatus as CustomRequestStatus] ?? []

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  async function handleSave() {
    start(async () => {
      const body: Record<string, unknown> = { status }
      if (quote) body['quoteCents'] = Math.round(parseFloat(quote) * 100)
      if (message.trim()) body['message'] = message.trim()

      await fetch(`/api/admin/custom-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSaved(true)
      setMessage('')
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quote price */}
      <div>
        <label className="text-xs font-medium text-stone-600 mb-1 block">Ціна (грн)</label>
        <input
          type="number" min={0} step={100}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Наприклад: 1500"
          className={inputBase}
        />
      </div>

      {/* Next status */}
      {availableStatuses.length > 0 && (
        <div>
          <label className="text-xs font-medium text-stone-600 mb-1 block">Оновити статус</label>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={[
                  'px-4 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  status === s ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-stone-300 text-stone-600 hover:border-amber-400',
                ].join(' ')}
              >
                {STATUS_UK[s] ?? s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message to customer */}
      <div>
        <label className="text-xs font-medium text-stone-600 mb-1 block">
          Повідомлення клієнту <span className="text-stone-400">(необов'язково)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Опишіть деталі пропозиції, дату виготовлення тощо…"
          className={`${inputBase} resize-none`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? 'Зберігаємо…' : 'Зберегти'}
        </button>
        {saved && <p className="text-sm text-green-600">✓ Збережено</p>}
      </div>
    </div>
  )
}
