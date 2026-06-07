import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'
import { CartBadge } from './CartBadge'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface NavProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
  isLoggedIn?: boolean
}

// typedRoutes can't prove T in DynamicRoutes<infer T> for interpolated union strings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lp = (lang: SupportedLocale, path: string) => `/${lang}/${path}` as any

export function Nav({ lang, dict, isLoggedIn = false }: NavProps) {
  const nav = (dict['nav'] ?? {}) as Record<string, string>
  const storeName =
    lang === 'uk'
      ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
      : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href={`/${lang}` as any} className="font-bold text-lg text-amber-700 shrink-0">
          {storeName}
        </Link>

        <div className="flex items-center gap-1 text-sm font-medium text-stone-700">
          <Link href={lp(lang, 'catalog')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors">
            {nav['catalog']}
          </Link>
          <Link href={lp(lang, 'gallery')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden md:block">
            {lang === 'uk' ? 'Галерея' : 'Gallery'}
          </Link>
          <Link href={lp(lang, 'custom-order')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden md:block">
            {lang === 'uk' ? 'Торт на замовлення' : 'Custom cake'}
          </Link>
          <CartBadge lang={lang} label={nav['cart'] ?? ''} />
          <Link href={lp(lang, 'orders')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden sm:block">
            {nav['orders']}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href={lp(lang, 'account')}
              className="text-sm font-medium text-stone-700 px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">✓</span>
              {nav['account']}
            </Link>
          ) : (
            <Link
              href={lp(lang, 'auth/login')}
              className="text-sm font-medium text-amber-700 px-3 py-1.5 rounded border border-amber-200 hover:bg-amber-50 transition-colors hidden sm:block"
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
