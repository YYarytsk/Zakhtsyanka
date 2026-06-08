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
      className="group flex flex-col rounded-2xl bg-white overflow-hidden border border-stone-100 hover:shadow-xl hover:shadow-stone-200/60 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl bg-amber-50">🥐</div>
        )}

        {/* Out of stock overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <span className="bg-white text-stone-500 text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
              {catalogDict['outOfStock']}
            </span>
          </div>
        )}

        {/* Dietary badges top-right */}
        {product.dietaryTags.length > 0 && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
            {product.dietaryTags.slice(0, 2).map((tag) => (
              <DietaryBadge key={tag} tag={tag} lang={lang} compact />
            ))}
          </div>
        )}

        {/* Price badge bottom-left */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="bg-white/90 backdrop-blur-sm text-amber-700 font-bold text-sm px-2.5 py-1 rounded-full shadow-sm">
            {price}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="px-4 py-3.5 flex-1 flex flex-col justify-between gap-2">
        <h3 className="font-semibold text-stone-900 leading-snug text-[15px] line-clamp-2">
          {name}
          {isPending && (
            <span className="ml-1.5 text-xs text-stone-400 font-normal">
              ({catalogDict['translationPending']})
            </span>
          )}
        </h3>

        {/* Fulfillment type hint */}
        <p className="text-xs text-stone-400">
          {product.fulfillmentTypes
            .map((t) => (dict['catalog'] as unknown as Record<string, Record<string, string>>)?.['fulfillment']?.[t] ?? t)
            .join(' · ')}
        </p>
      </div>
    </Link>
  )
}
