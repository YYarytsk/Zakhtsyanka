import { notFound, redirect } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { getOrdersByCustomer } from '@/lib/db/orders'
import { OrderHistoryList } from '@/components/account/OrderHistoryList'

export default async function OrdersPage(props: PageProps<'/[lang]/orders'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/auth/login?next=/${lang}/orders`)

  const [dict, orders] = await Promise.all([
    getDictionary(lang),
    getOrdersByCustomer(user.id),
  ])

  const d = dict as Record<string, Record<string, string>>
  const ordersDict = d['orders'] ?? {}

  const visibleOrders = orders.filter((o) => o.status !== 'pending_payment')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${lang}/account`} className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
          ← {lang === 'uk' ? 'Акаунт' : 'Account'}
        </a>
        <span className="text-stone-200">/</span>
        <h1 className="text-xl font-bold text-stone-900">{ordersDict['title']}</h1>
      </div>
      <OrderHistoryList
        orders={visibleOrders}
        lang={lang}
        emptyMessage={ordersDict['empty'] ?? ''}
      />
    </div>
  )
}
