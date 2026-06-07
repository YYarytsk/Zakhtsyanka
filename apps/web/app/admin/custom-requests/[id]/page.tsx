import { notFound } from 'next/navigation'
import { getRequestById, getMessages } from '@/lib/db/customRequests'
import { AdminQuoteForm } from '@/components/admin/AdminQuoteForm'
import { MessageThread } from '@/components/custom/MessageThread'
import { formatDate, formatPrice } from '@zakhtsyanka/shared/utils'

export default async function AdminCustomRequestDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params
  const [cr, messages] = await Promise.all([
    getRequestById(id),
    getMessages(id),
  ])
  if (!cr) notFound()

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <a href="/admin/custom-requests" className="text-sm text-stone-400 hover:text-stone-700">
          ← Всі запити
        </a>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h1 className="font-bold text-xl text-stone-900 mb-4">{cr.occasion}</h1>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ['Дата',       formatDate(cr.dateNeeded, 'uk')],
            ['Порцій',     cr.servings],
            ['Смаки',      cr.flavors],
            ['Дієта',      cr.dietaryNeeds ?? '—'],
            ['Бюджет',     cr.budgetCents ? formatPrice(cr.budgetCents, 'uk') : '—'],
            ['Email',      cr.guestEmail ?? `ID: ${cr.customerId?.slice(0,8)}`],
            ['Нотатки',    cr.notes ?? '—'],
            ['Мова',       cr.customerLanguage],
          ] as [string, string | number][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-stone-400 text-xs">{label}</p>
              <p className="text-stone-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Reference photos */}
        {cr.referencePhotos.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-stone-400 mb-2">Фото-референс</p>
            <div className="flex flex-wrap gap-2">
              {cr.referencePhotos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Ref ${i+1}`} className="w-20 h-20 rounded-lg object-cover border border-stone-200 hover:opacity-90" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Пропозиція та статус</h2>
        <AdminQuoteForm
          requestId={id}
          currentStatus={cr.status}
          currentQuoteCents={cr.quoteCents}
        />
      </div>

      {/* Thread */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Листування з клієнтом</h2>
        <MessageThread
          requestId={id}
          initialMessages={messages}
          lang="uk"
          canReply
        />
      </div>
    </div>
  )
}
