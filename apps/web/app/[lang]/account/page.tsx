import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale } from '../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrdersByCustomer } from '@/lib/db/orders'
import { getLoyaltyHistory } from '@/lib/db/loyalty'
import { LoyaltyCard } from '@/components/account/LoyaltyCard'
import { OrderHistoryList } from '@/components/account/OrderHistoryList'
import { ProfileSettings } from '@/components/account/ProfileSettings'
import { SignOutButton } from '@/components/auth/SignOutButton'

export default async function AccountPage(props: PageProps<'/[lang]/account'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/auth/login?next=/${lang}/account`)

  const [dict, ordersRaw, loyaltyHistory, customerData] = await Promise.all([
    getDictionary(lang),
    getOrdersByCustomer(user.id),
    getLoyaltyHistory(user.id, 5),
    createAdminClient()
      .from('customers')
      .select('loyalty_balance_points, preferred_language, birthday_date')
      .eq('id', user.id)
      .single<{ loyalty_balance_points: number; preferred_language: string; birthday_date: string | null }>(),
  ])

  const d = dict as Record<string, Record<string, string>>
  const accountDict = d['account'] ?? {}
  const ordersDict  = d['orders'] ?? {}

  const balance  = customerData.data?.loyalty_balance_points ?? 0
  const recentOrders = ordersRaw.filter((o) => o.status !== 'pending_payment').slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{accountDict['title']}</h1>
          <p className="text-sm text-stone-500 mt-0.5">{user.email}</p>
        </div>
        <SignOutButton lang={lang} />
      </div>

      {/* Loyalty card */}
      <LoyaltyCard balance={balance} history={loyaltyHistory} lang={lang} dict={d} />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: `/${lang}/account/addresses`, label: lang === 'uk' ? '📍 Мої адреси' : '📍 My addresses' },
          { href: `/${lang}/orders`,            label: lang === 'uk' ? '📦 Всі замовлення' : '📦 All orders' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href as any}
            className="bg-white rounded-xl border border-stone-200 p-4 text-sm font-medium text-stone-700 hover:border-amber-300 transition-colors text-center"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Profile settings */}
      <ProfileSettings
        lang={lang}
        initialBirthday={customerData.data?.birthday_date ?? null}
        initialLanguage={customerData.data?.preferred_language ?? 'uk'}
      />

      {/* Recent orders */}
      <section>
        <h2 className="font-semibold text-stone-900 mb-4">{ordersDict['title']}</h2>
        <OrderHistoryList
          orders={recentOrders}
          lang={lang}
          emptyMessage={ordersDict['empty'] ?? ''}
        />
        {recentOrders.length > 0 && (
          <Link
            href={`/${lang}/orders` as any}
            className="block text-center text-sm text-amber-700 mt-4 hover:underline"
          >
            {lang === 'uk' ? 'Всі замовлення →' : 'All orders →'}
          </Link>
        )}
      </section>
    </div>
  )
}
