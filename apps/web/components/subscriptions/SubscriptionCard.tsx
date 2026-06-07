'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@zakhtsyanka/shared/utils'
import type { Subscription } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface SubscriptionCardProps {
  sub: Subscription
  productNameUk: string
  productNameEn: string
  priceCents: number
  lang: SupportedLocale
}

const FREQ_UK: Record<string, string> = { weekly: 'Щотижня', biweekly: 'Раз на 2 тижні', monthly: 'Щомісяця' }
const FREQ_EN: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }
const TYPE_UK: Record<string, string> = { pickup: 'Самовивіз', delivery: 'Доставка', preorder: 'Передзамовлення' }
const TYPE_EN: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', preorder: 'Pre-order' }

export function SubscriptionCard({ sub, productNameUk, productNameEn, priceCents, lang }: SubscriptionCardProps) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const isUk = lang === 'uk'
  const name = isUk ? productNameUk : productNameEn

  async function call(action: string) {
    start(async () => {
      await fetch(`/api/subscriptions/${sub.id}/${action}`, { method: 'POST' })
      router.refresh()
    })
  }

  const isActive = sub.status === 'active'
  const isPaused = sub.status === 'paused'

  return (
    <div className={[
      'bg-white rounded-2xl border p-5 flex flex-col gap-4',
      isActive ? 'border-stone-200' : 'border-stone-100 opacity-70',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-900">{name}</p>
          <p className="text-sm text-stone-500 mt-0.5">
            {(isUk ? FREQ_UK : FREQ_EN)[sub.frequency]} · {(isUk ? TYPE_UK : TYPE_EN)[sub.fulfillmentType]}
          </p>
        </div>
        <span className={[
          'shrink-0 text-xs px-2.5 py-1 rounded-full font-medium',
          isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500',
        ].join(' ')}>
          {isActive ? (isUk ? 'Активна' : 'Active') : isUk ? 'Призупинена' : 'Paused'}
        </span>
      </div>

      <div className="text-sm text-stone-600">
        <p>
          {isUk ? 'Наступна дата' : 'Next date'}:{' '}
          <span className="font-medium text-stone-900">{formatDate(sub.nextFulfillmentDate, lang)}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
        {isActive && (
          <>
            <button onClick={() => call('skip')} disabled={pending}
              className="text-xs px-3 py-1.5 border border-stone-300 rounded-full text-stone-600 hover:bg-stone-50 disabled:opacity-50">
              {isUk ? 'Пропустити раз' : 'Skip next'}
            </button>
            <button onClick={() => call('pause')} disabled={pending}
              className="text-xs px-3 py-1.5 border border-stone-300 rounded-full text-stone-600 hover:bg-stone-50 disabled:opacity-50">
              {isUk ? 'Призупинити' : 'Pause'}
            </button>
          </>
        )}
        {isPaused && (
          <button onClick={() => call('resume')} disabled={pending}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:opacity-50">
            {isUk ? 'Відновити' : 'Resume'}
          </button>
        )}
        <button onClick={() => call('cancel')} disabled={pending}
          className="text-xs px-3 py-1.5 border border-red-200 rounded-full text-red-500 hover:bg-red-50 disabled:opacity-50 ml-auto">
          {isUk ? 'Скасувати' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
