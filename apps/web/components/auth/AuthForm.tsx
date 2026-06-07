'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface AuthFormProps {
  lang: SupportedLocale
  mode: 'login' | 'signup'
  redirectTo?: string
}

export function AuthForm({ lang, mode, redirectTo }: AuthFormProps) {
  const isUk     = lang === 'uk'
  const router   = useRouter()
  const [pending, start] = useTransition()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [sent,     setSent]     = useState(false)   // for magic-link / email confirm

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    start(async () => {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(isUk ? 'Невірний email або пароль.' : 'Invalid email or password.')
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push((redirectTo ?? `/${lang}/account`) as any)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/${lang}/account`,
            data: { preferred_language: lang },
          },
        })
        if (error) {
          setError(error.message)
          return
        }
        setSent(true)
      }
    })
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${lang}/account`,
      },
    })
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-4">✉️</p>
        <h2 className="font-semibold text-stone-900 mb-2">
          {isUk ? 'Перевірте пошту' : 'Check your email'}
        </h2>
        <p className="text-sm text-stone-500">
          {isUk
            ? `Ми надіслали посилання для підтвердження на ${email}`
            : `We sent a confirmation link to ${email}`}
        </p>
      </div>
    )
  }

  const inputBase = 'w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'

  return (
    <div className="flex flex-col gap-5">
      {/* Google */}
      <button
        onClick={handleGoogle}
        type="button"
        className="w-full flex items-center justify-center gap-3 border border-stone-300 rounded-lg py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isUk ? 'Увійти з Google' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400">{isUk ? 'або' : 'or'}</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* Email / password */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-stone-600 mb-1.5 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={inputBase}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600 mb-1.5 block">
            {isUk ? 'Пароль' : 'Password'}
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isUk ? 'Мінімум 8 символів' : 'At least 8 characters'}
            className={inputBase}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {pending
            ? (isUk ? 'Завантаження…' : 'Loading…')
            : mode === 'login'
            ? (isUk ? 'Увійти' : 'Sign in')
            : (isUk ? 'Зареєструватись' : 'Create account')}
        </button>
      </form>

      {/* Toggle mode */}
      <p className="text-center text-sm text-stone-500">
        {mode === 'login' ? (
          <>
            {isUk ? 'Немає акаунту? ' : "Don't have an account? "}
            <a href={`/${lang}/auth/signup`} className="text-amber-700 font-medium hover:underline">
              {isUk ? 'Зареєструватись' : 'Sign up'}
            </a>
          </>
        ) : (
          <>
            {isUk ? 'Вже є акаунт? ' : 'Already have an account? '}
            <a href={`/${lang}/auth/login`} className="text-amber-700 font-medium hover:underline">
              {isUk ? 'Увійти' : 'Sign in'}
            </a>
          </>
        )}
      </p>
    </div>
  )
}
