import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@zakhtsyanka/shared/types'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'
import { getLocalizedName, formatPrice } from '@zakhtsyanka/shared/utils'
import { DietaryBadge } from './DietaryBadge'

interface ProductCardProps {
  product: Product
  lang: SupportedLocale
  dict: Record<string, Record<string, string>>
}

export function ProductCard({ product, lang, dict }: ProductCardProps) {
  const { value: name, isPending } = getLocalizedName(product, lang)
  const price = formatPrice(product.priceCents, lang)
  const catalogDict = dict['catalog'] ?? {}
  const photo = product.photos[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const href = `/${lang}/catalog/${product.slug}` as any

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl bg-white border border-stone-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🥐</div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-medium text-stone-500">{catalogDict['outOfStock']}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 leading-snug">
            {name}
            {isPending && (
              <span className="ml-1 text-xs text-stone-400 font-normal">
                ({catalogDict['translationPending']})
              </span>
            )}
          </h3>
          <span className="shrink-0 font-bold text-amber-700">{price}</span>
        </div>

        {product.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.dietaryTags.map((tag) => (
              <DietaryBadge key={tag} tag={tag} lang={lang} compact />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
