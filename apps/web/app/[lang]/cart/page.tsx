import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { CartContents } from '@/components/cart/CartContents'

export default async function CartPage(props: PageProps<'/[lang]/cart'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">
        {(dict as Record<string, Record<string, string>>)['cart']?.['title']}
      </h1>
      <CartContents lang={lang} dict={dict as Record<string, unknown>} />
    </div>
  )
}
