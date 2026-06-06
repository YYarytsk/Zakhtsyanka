import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'

export default async function HomePage(props: PageProps<'/[lang]'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const catalogDict = (dict as Record<string, Record<string, string>>)['catalog'] ?? {}
  const storeName =
    lang === 'uk'
      ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
      : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-stone-900 mb-4">{storeName}</h1>
      <p className="text-lg text-stone-600 mb-8">{catalogDict['title'] ?? ''}</p>
      <a
        href={`/${lang}/catalog`}
        className="inline-block rounded-full bg-amber-600 px-8 py-3 text-white font-medium hover:bg-amber-700 transition-colors"
      >
        {catalogDict['title'] ?? (lang === 'uk' ? 'Переглянути меню' : 'Browse menu')}
      </a>
    </div>
  )
}
