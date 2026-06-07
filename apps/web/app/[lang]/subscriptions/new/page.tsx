import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/db/products'
import { SubscribeForm } from '@/components/subscriptions/SubscribeForm'
import { getLocalizedName } from '@zakhtsyanka/shared/utils'

export default async function NewSubscriptionPage(props: PageProps<'/[lang]/subscriptions/new'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/auth/login?next=/${lang}/subscriptions/new`)

  const sp             = await props.searchParams
  const selectedSlug   = typeof sp['product'] === 'string' ? sp['product'] : null

  // Show only products available for preorder/subscription
  const allProducts = await getProducts({ availableOnly: true })
  // For subscriptions, show all available products (the bakery can mark specific ones)
  const products = allProducts

  const selected = selectedSlug ? products.find((p) => p.slug === selectedSlug) : null
  const isUk = lang === 'uk'

  if (selected) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <a href={`/${lang}/subscriptions`}
          className="text-sm text-stone-400 hover:text-stone-700 mb-6 block">
          ← {isUk ? 'Мої підписки' : 'My subscriptions'}
        </a>
        <h1 className="text-xl font-bold text-stone-900 mb-6">
          {isUk ? 'Налаштувати підписку' : 'Set up subscription'}
        </h1>
        <SubscribeForm product={selected} lang={lang} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a href={`/${lang}/subscriptions`}
        className="text-sm text-stone-400 hover:text-stone-700 mb-6 block">
        ← {isUk ? 'Мої підписки' : 'My subscriptions'}
      </a>
      <h1 className="text-xl font-bold text-stone-900 mb-2">
        {isUk ? 'Оберіть товар для підписки' : 'Choose a product to subscribe to'}
      </h1>
      <p className="text-sm text-stone-500 mb-6">
        {isUk
          ? 'Підписка — це автоматичне регулярне замовлення. Скасувати можна будь-коли.'
          : 'A subscription is an automatic recurring order. Cancel any time.'}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {products.map((p) => {
          const { value: name } = getLocalizedName(p, lang)
          return (
            <a
              key={p.id}
              href={`/${lang}/subscriptions/new?product=${p.slug}`}
              className="bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-300 transition-colors"
            >
              <p className="font-medium text-stone-900">{name}</p>
              <p className="text-sm text-amber-700 font-semibold mt-1">
                {(p.priceCents / 100).toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-UA')} ₴
              </p>
            </a>
          )
        })}
      </div>
    </div>
  )
}
