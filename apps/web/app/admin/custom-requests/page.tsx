import Link from 'next/link'
import { getAllRequestsAdmin } from '@/lib/db/customRequests'
import { formatDate, formatPrice } from '@zakhtsyanka/shared/utils'

const STATUS_UK: Record<string, string> = {
  submitted:    'Нова заявка',
  quoted:       'Надіслано пропозицію',
  approved:     'Підтверджено',
  deposit_paid: 'Депозит сплачено',
  scheduled:    'Заплановано',
  completed:    'Виконано',
  cancelled:    'Скасовано',
}

const STATUS_COLOR: Record<string, string> = {
  submitted:    'bg-blue-100   text-blue-700',
  quoted:       'bg-amber-100  text-amber-700',
  approved:     'bg-green-100  text-green-700',
  deposit_paid: 'bg-green-200  text-green-800',
  scheduled:    'bg-purple-100 text-purple-700',
}

export default async function AdminCustomRequestsPage() {
  const requests = await getAllRequestsAdmin()

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900 mb-6">Індивідуальні замовлення</h1>

      {requests.length === 0 ? (
        <p className="text-stone-400 text-sm py-12 text-center">Нових запитів немає</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/admin/custom-requests/${r.id}` as any}
              className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-300 transition-colors flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-stone-900">{r.occasion}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? 'bg-stone-100 text-stone-500'}`}>
                    {STATUS_UK[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  {formatDate(r.dateNeeded, 'uk')} · {r.servings} порц.
                  {r.budgetCents ? ` · Бюджет: ${formatPrice(r.budgetCents, 'uk')}` : ''}
                </p>
                <p className="text-xs text-stone-400 mt-0.5 truncate">{r.guestEmail ?? `Customer ${r.customerId?.slice(0,8)}`}</p>
              </div>
              <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
