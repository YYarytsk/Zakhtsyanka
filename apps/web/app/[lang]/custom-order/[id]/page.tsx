import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { getRequestById, getMessages } from '@/lib/db/customRequests'
import { MessageThread } from '@/components/custom/MessageThread'
import { DepositButton } from '@/components/custom/DepositButton'
import { ApproveButton } from '@/components/custom/ApproveButton'
import { formatPrice, formatDate } from '@zakhtsyanka/shared/utils'

const STATUS_COLORS: Record<string, string> = {
  submitted:    'bg-blue-100   text-blue-700',
  quoted:       'bg-amber-100  text-amber-700',
  approved:     'bg-green-100  text-green-700',
  deposit_paid: 'bg-green-100  text-green-800',
  scheduled:    'bg-purple-100 text-purple-700',
  completed:    'bg-stone-100  text-stone-600',
  cancelled:    'bg-red-100    text-red-600',
}

export default async function CustomRequestPage(
  props: PageProps<'/[lang]/custom-order/[id]'>,
) {
  const { lang, id } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [cr, messages, dict] = await Promise.all([
    getRequestById(id),
    getMessages(id),
    getDictionary(lang),
  ])
  if (!cr) notFound()

  // Auth check: owner or guest with matching email (we'll check email client-side)
  const isOwner = user && cr.customerId === user.id
  const isGuest = !user && !!cr.guestEmail

  const d     = dict as Record<string, Record<string, string>>
  const crDict = d['customRequest'] ?? {}
  const statusLabels = (d['customRequest'] as unknown as Record<string, Record<string, string>>)?.['status'] ?? {}
  const isUk  = lang === 'uk'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <a href={`/${lang}/custom-order`}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors block mb-2">
            ← {isUk ? 'Нове замовлення' : 'New request'}
          </a>
          <h1 className="text-xl font-bold text-stone-900">{cr.occasion}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {isUk ? 'Дата' : 'Date'}: {formatDate(cr.dateNeeded, lang)} · {cr.servings} {isUk ? 'порц.' : 'servings'}
          </p>
        </div>
        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[cr.status] ?? ''}`}>
          {statusLabels[cr.status] ?? cr.status}
        </span>
      </div>

      {/* Quote section */}
      {cr.status === 'quoted' && cr.quoteCents && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-amber-900">
              {isUk ? '💰 Пропозиція від пекарні' : '💰 Quote from the bakery'}
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {formatPrice(cr.quoteCents, lang)}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {isUk
                ? `Депозит (30%): ${formatPrice(Math.round(cr.quoteCents * 0.3), lang)}`
                : `Deposit (30%): ${formatPrice(Math.round(cr.quoteCents * 0.3), lang)}`}
            </p>
          </div>
          {isOwner && <ApproveButton requestId={id} lang={lang} />}
        </div>
      )}

      {/* Deposit payment */}
      {cr.status === 'approved' && isOwner && (
        <DepositButton requestId={id} lang={lang} />
      )}

      {/* Request details */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-stone-900 text-sm">{isUk ? 'Деталі замовлення' : 'Request details'}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            [isUk ? 'Привід' : 'Occasion',   cr.occasion],
            [isUk ? 'Порцій' : 'Servings',   cr.servings],
            [isUk ? 'Смаки' : 'Flavors',     cr.flavors],
            [isUk ? 'Дієта' : 'Dietary',     cr.dietaryNeeds],
            [isUk ? 'Бюджет' : 'Budget',     cr.budgetCents ? formatPrice(cr.budgetCents, lang) : '—'],
            [isUk ? 'Нотатки' : 'Notes',     cr.notes],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-stone-400 text-xs">{label}</p>
              <p className="text-stone-700">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5">
        <h2 className="font-semibold text-stone-900 text-sm mb-4">
          {isUk ? 'Листування з пекарнею' : 'Messages with the bakery'}
        </h2>
        <MessageThread
          requestId={id}
          initialMessages={messages}
          lang={lang}
          canReply={!!(isOwner || isGuest)}
          guestEmail={cr.guestEmail ?? undefined}
        />
      </div>
    </div>
  )
}

