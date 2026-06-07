'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

export function SignOutButton({ lang }: { lang: SupportedLocale }) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function handleSignOut() {
    start(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push(`/${lang}`)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={pending}
      className="text-sm text-stone-500 hover:text-stone-900 transition-colors disabled:opacity-50"
    >
      {pending ? '…' : (lang === 'uk' ? 'Вийти' : 'Sign out')}
    </button>
  )
}
