import Link from 'next/link'
import type { Category } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface CategoryNavProps {
  categories: Category[]
  activeSlug: string | null
  lang: SupportedLocale
  allLabel: string
}

export function CategoryNav({ categories, activeSlug, lang, allLabel }: CategoryNavProps) {
  const base = `/${lang}/catalog` as const

  const items = [
    { slug: null, label: allLabel },
    ...categories.map((c) => ({
      slug: c.slug,
      label: lang === 'uk' ? c.nameUk : c.nameEn,
    })),
  ]

  return (
    <nav className="flex gap-2 flex-wrap" aria-label="Categories">
      {items.map(({ slug, label }) => {
        const isActive = slug === activeSlug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const href: any = slug ? `${base}?category=${slug}` : base
        return (
          <Link
            key={slug ?? '__all'}
            href={href}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
            ].join(' ')}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
