import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from '../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { RequestForm } from '@/components/custom/RequestForm'

export default async function CustomOrderPage(props: PageProps<'/[lang]/custom-order'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const dict = await getDictionary(lang)

  const d = dict as Record<string, Record<string, string>>
  const crDict = d['customRequest'] ?? {}

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">{crDict['title']}</h1>
        <p className="text-stone-500 mt-2 text-sm leading-relaxed">{crDict['subtitle']}</p>
      </div>
      <RequestForm lang={lang} dict={d} isLoggedIn={!!user} />
    </div>
  )
}
