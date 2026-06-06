import Link from 'next/link'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface NavProps {
  lang: SupportedLocale
  dict: Record<string, unknown>
}

// typedRoutes can't prove T in DynamicRoutes<infer T> for interpolated union strings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lp = (lang: SupportedLocale, path: string) => `/${lang}/${path}` as any

export function Nav({ lang, dict }: NavProps) {
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
          <Link href={lp(lang, 'cart')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors">
            {nav['cart']}
          </Link>
          <Link href={lp(lang, 'orders')} className="px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden sm:block">
            {nav['orders']}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={lp(lang, 'account')}
            className="text-sm font-medium text-stone-700 px-3 py-1.5 rounded hover:bg-stone-100 transition-colors hidden sm:block"
          >
            {nav['account']}
          </Link>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </nav>
    </header>
  )
}
