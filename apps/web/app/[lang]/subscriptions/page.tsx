import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getDictionary, hasLocale } from '../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCustomerSubscriptions } from '@/lib/db/subscriptions'
import { getAllProductsAdmin } from '@/lib/db/products'
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard'

export default async function SubscriptionsPage(props: PageProps<'/[lang]/subscriptions'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/auth/login?next=/${lang}/subscriptions`)

  const [subs, allProducts, dict] = await Promise.all([
    getCustomerSubscriptions(user.id),
    getAllProductsAdmin(),
    getDictionary(lang),
  ])

  const isUk = lang === 'uk'
  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-900">
          {isUk ? 'Мої підписки' : 'My subscriptions'}
        </h1>
        <Link href={`/${lang}/subscriptions/new` as any}
          className="text-sm bg-amber-600 text-white px-4 py-2 rounded-full hover:bg-amber-700 transition-colors font-medium">
          + {isUk ? 'Нова підписка' : 'New subscription'}
        </Link>
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-stone-500 text-sm mb-4">
            {isUk ? 'У вас ще немає підписок.' : "You don't have any subscriptions yet."}
          </p>
          <Link href={`/${lang}/subscriptions/new` as any}
            className="text-amber-700 underline text-sm">
            {isUk ? 'Оформити підписку' : 'Start a subscription'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {subs.map((sub) => {
            const p = productMap.get(sub.productId)
            if (!p) return null
            return (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                productNameUk={p.nameUk}
                productNameEn={p.nameEn}
                priceCents={p.priceCents}
                lang={lang}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
