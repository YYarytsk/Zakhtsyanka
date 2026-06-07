import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { getAddresses } from '@/lib/db/addresses'
import { AddressManager } from '@/components/account/AddressManager'

export default async function AddressesPage(props: PageProps<'/[lang]/account/addresses'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${lang}/auth/login`)

  const addresses = await getAddresses(user.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/${lang}/account`} className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
          ← {lang === 'uk' ? 'Акаунт' : 'Account'}
        </a>
        <span className="text-stone-200">/</span>
        <h1 className="text-xl font-bold text-stone-900">
          {lang === 'uk' ? 'Збережені адреси' : 'Saved addresses'}
        </h1>
      </div>
      <AddressManager initialAddresses={addresses} lang={lang} />
    </div>
  )
}
