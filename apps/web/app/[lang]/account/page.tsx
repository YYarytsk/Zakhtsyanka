import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'

export default async function AccountPage(props: PageProps<'/[lang]/account'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)
  const accountDict = (dict as Record<string, Record<string, string>>)['account'] ?? {}

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">{accountDict['title']}</h1>
      <p className="text-stone-500">— Account coming in Phase 2 —</p>
    </div>
  )
}
