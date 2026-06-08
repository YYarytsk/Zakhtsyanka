import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDictionary, hasLocale } from '../../dictionaries'
import { getProductBySlug } from '@/lib/db/products'
import { getLocalizedName, getLocalizedDescription, formatPrice } from '@zakhtsyanka/shared/utils'
import { DietaryBadge } from '@/components/catalog/DietaryBadge'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'

export const revalidate = 300

export async function generateMetadata(
  props: PageProps<'/[lang]/catalog/[slug]'>,
): Promise<Metadata> {
  const { lang, slug } = await props.params
  if (!hasLocale(lang)) return {}
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return {
    title: lang === 'uk' ? product.nameUk : product.nameEn,
    description: lang === 'uk' ? product.descriptionUk : product.descriptionEn,
  }
}

export default async function ProductDetailPage(
  props: PageProps<'/[lang]/catalog/[slug]'>,
) {
  const { lang, slug } = await props.params
  if (!hasLocale(lang)) notFound()

  const [product, dict] = await Promise.all([
    getProductBySlug(slug),
    getDictionary(lang),
  ])
  if (!product) notFound()

  const d = dict as unknown as Record<string, Record<string, string>>
  const catalogDict = d['catalog'] ?? {}
  const commonDict = d['common'] ?? {}
  const isUk = lang === 'uk'

  const { value: name, isPending: namePending } = getLocalizedName(product, lang)
  const { value: description } = getLocalizedDescription(product, lang)
  const price = formatPrice(product.priceCents, lang)
  const allergens = isUk ? product.allergensUk : product.allergensEn
  const fulfillmentLabels = (d['catalog'] as unknown as Record<string, Record<string, string>>)?.['fulfillment'] ?? {}

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link href={`/${lang}/catalog` as any} className="hover:text-stone-700 transition-colors">
            {catalogDict['title']}
          </Link>
          <span>›</span>
          <span className="text-stone-600 font-medium truncate">{name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">

          {/* Photos */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-lg shadow-stone-200/50">
              {product.photos[0] ? (
                <Image
                  src={product.photos[0]}
                  alt={name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl bg-amber-50">🥐</div>
              )}
            </div>
            {product.photos.length > 1 && (
              <div className="flex gap-2">
                {product.photos.slice(1, 5).map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-transparent hover:border-amber-400 transition-colors cursor-pointer">
                    <Image src={photo} alt={`${name} ${i + 2}`} fill className="object-cover" sizes="80px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Name + price */}
            <div>
              <h1 className="text-3xl font-bold text-stone-900 leading-tight mb-1">
                {name}
                {namePending && (
                  <span className="ml-2 text-sm text-stone-400 font-normal">
                    ({catalogDict['translationPending']})
                  </span>
                )}
              </h1>
              <p className="text-3xl font-bold text-amber-600 mt-2">{price}</p>
            </div>

            {/* Description */}
            {description && (
              <p className="text-stone-600 leading-relaxed text-[15px]">{description}</p>
            )}

            {/* Dietary tags */}
            {product.dietaryTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.dietaryTags.map((tag) => (
                  <DietaryBadge key={tag} tag={tag} lang={lang} />
                ))}
              </div>
            )}

            {/* Fulfillment */}
            <div className="flex flex-wrap gap-2">
              {product.fulfillmentTypes.map((type) => (
                <span key={type}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  {fulfillmentLabels[type] ?? type}
                </span>
              ))}
            </div>

            {/* Allergens */}
            {allergens && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="text-sm font-bold text-amber-900">
                  {isUk ? '⚠️ Алергени та склад' : '⚠️ Allergens & ingredients'}
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">{allergens}</p>
                <p className="text-xs text-amber-600 border-t border-amber-200 pt-2">
                  {catalogDict['allergenNote']}
                </p>
              </div>
            )}

            {/* Add to cart */}
            <div className="pt-2">
              <AddToCartButton
                productId={product.id}
                slug={product.slug}
                nameUk={product.nameUk}
                nameEn={product.nameEn}
                priceCents={product.priceCents}
                photo={product.photos[0] ?? null}
                fulfillmentTypes={product.fulfillmentTypes}
                label={catalogDict['addToCart'] ?? (isUk ? 'До кошика' : 'Add to cart')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
