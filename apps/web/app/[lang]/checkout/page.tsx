import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

export default async function CheckoutPage(props: PageProps<'/[lang]/checkout'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">
        {(dict as Record<string, Record<string, string>>)['checkout']?.['title']}
      </h1>
      <CheckoutForm lang={lang} dict={dict as Record<string, unknown>} />
    </div>
  )
}
