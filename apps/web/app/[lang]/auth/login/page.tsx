import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function LoginPage(props: PageProps<'/[lang]/auth/login'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  // Already signed in → go to account
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/${lang}/account`)

  const sp = await props.searchParams
  const redirectTo = typeof sp['next'] === 'string' ? sp['next'] : undefined

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          {lang === 'uk' ? 'Вхід в акаунт' : 'Sign in'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {lang === 'uk' ? 'Ласкаво просимо назад!' : 'Welcome back!'}
        </p>
      </div>
      <AuthForm lang={lang} mode="login" redirectTo={redirectTo} />
    </div>
  )
}
