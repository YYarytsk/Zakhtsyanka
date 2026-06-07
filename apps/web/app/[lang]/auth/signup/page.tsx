import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/auth/AuthForm'

export default async function SignupPage(props: PageProps<'/[lang]/auth/signup'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/${lang}/account`)

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          {lang === 'uk' ? 'Створити акаунт' : 'Create account'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {lang === 'uk'
            ? 'Зберігайте замовлення та накопичуйте бонуси'
            : 'Save orders and earn loyalty rewards'}
        </p>
      </div>
      <AuthForm lang={lang} mode="signup" />
    </div>
  )
}
