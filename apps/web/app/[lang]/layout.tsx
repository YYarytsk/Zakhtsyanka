import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, LOCALES } from './dictionaries'
import { Nav } from '@/components/Nav'
import { AnnouncementBanner } from '@/components/AnnouncementBanner'
import { LangSetter } from '@/components/LangSetter'
import { createClient } from '@/lib/supabase/server'

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata(props: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await props.params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  const storeName =
    lang === 'uk'
      ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
      : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'

  return {
    title: {
      default: storeName,
      template: `%s — ${storeName}`,
    },
    description: (dict as Record<string, Record<string, string>>)['catalog']?.['title'] ?? storeName,
    alternates: {
      languages: {
        uk: '/uk',
        en: '/en',
      },
    },
  }
}

export default async function LocaleLayout(props: LayoutProps<'/[lang]'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const [dict, { data: { user } }] = await Promise.all([
    getDictionary(lang),
    (await createClient()).auth.getUser(),
  ])

  return (
    <>
      {/* Sets document.documentElement.lang after hydration — no script-tag warnings */}
      <LangSetter lang={lang} />
      <AnnouncementBanner lang={lang} />
      <Nav lang={lang} dict={dict} isLoggedIn={!!user} />
      <main className="flex-1">{props.children}</main>
      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        {lang === 'uk'
          ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
          : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'}
      </footer>
    </>
  )
}
