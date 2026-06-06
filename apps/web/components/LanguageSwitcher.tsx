'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface LanguageSwitcherProps {
  currentLang: SupportedLocale
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()

  function switchLocale(next: SupportedLocale) {
    // Replace /uk/... with /en/... (or vice versa)
    const newPath = pathname.replace(new RegExp(`^/${currentLang}`), `/${next}`)
    // Persist the choice in a cookie so proxy.ts remembers it
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(newPath as any)
  }

  const next: SupportedLocale = currentLang === 'uk' ? 'en' : 'uk'
  const label = currentLang === 'uk' ? 'EN' : 'УК'

  return (
    <button
      onClick={() => switchLocale(next)}
      className="text-xs font-semibold px-2.5 py-1 rounded border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
      aria-label={currentLang === 'uk' ? 'Switch to English' : 'Перейти на українську'}
    >
      {label}
    </button>
  )
}
