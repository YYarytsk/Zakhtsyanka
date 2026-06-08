import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'
import { CartBadge } from './CartBadge'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface NavProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
  isLoggedIn?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lp = (lang: SupportedLocale, path: string) => `/${lang}/${path}` as any

export function Nav({ lang, dict, isLoggedIn = false }: NavProps) {
  const nav = (dict['nav'] ?? {}) as Record<string, string>
  const storeName = lang === 'uk'
    ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
    : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100 shadow-sm shadow-stone-100/80">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link
          href={`/${lang}` as any}
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">🥐</span>
          <span className="font-bold text-lg text-stone-900 tracking-tight">{storeName}</span>
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link href={lp(lang, 'catalog')}
            className="px-3.5 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">
            {nav['catalog']}
          </Link>
          <Link href={lp(lang, 'gallery')}
            className="px-3.5 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">
            {lang === 'uk' ? 'Галерея' : 'Gallery'}
          </Link>
          <Link href={lp(lang, 'custom-order')}
            className="px-3.5 py-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">
            {lang === 'uk' ? 'Торт на замовлення' : 'Custom cake'}
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <CartBadge lang={lang} label={nav['cart'] ?? ''} />

          {isLoggedIn ? (
            <Link
              href={lp(lang, 'account')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-bold">✓</span>
              {nav['account']}
            </Link>
          ) : (
            <Link
              href={lp(lang, 'auth/login')}
              className="hidden sm:inline-block px-4 py-2 rounded-full text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
            >
              {nav['login']}
            </Link>
          )}

          <LanguageSwitcher currentLang={lang} />
        </div>
      </nav>
    </header>
  )
}
