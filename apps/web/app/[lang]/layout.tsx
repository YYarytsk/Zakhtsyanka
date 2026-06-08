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
      <footer className="bg-stone-900 text-stone-400 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <p className="text-white font-bold text-lg flex items-center gap-2">
              <span>🥐</span>
              {lang === 'uk' ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка' : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm justify-center">
              {[
                [`/${lang}/catalog`,      lang === 'uk' ? 'Меню'               : 'Menu'],
                [`/${lang}/gallery`,      lang === 'uk' ? 'Галерея'            : 'Gallery'],
                [`/${lang}/custom-order`, lang === 'uk' ? 'Торт на замовлення' : 'Custom cake'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
              ))}
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 text-xs text-center text-stone-600">
            {lang === 'uk' ? 'Ручна робота · Щодня свіже' : 'Handmade · Fresh daily'}
          </div>
        </div>
      </footer>
    </>
  )
}
