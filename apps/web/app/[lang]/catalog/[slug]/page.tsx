import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getDictionary, hasLocale } from '../../dictionaries'
import { getProductBySlug } from '@/lib/db/products'
import { getLocalizedName, getLocalizedDescription, formatPrice } from '@zakhtsyanka/shared/utils'
import { DietaryBadge } from '@/components/catalog/DietaryBadge'
import { AddToCartButton } from '@/components/catalog/AddToCartButton'

// Revalidate every 5 minutes — products change frequently (availability, price).
// Static params are skipped so this page renders dynamically on first request.
export const revalidate = 300

export async function generateMetadata(
  props: PageProps<'/[lang]/catalog/[slug]'>,
): Promise<Metadata> {
  const { lang, slug } = await props.params
  if (!hasLocale(lang)) return {}
  const product = await getProductBySlug(slug)
  if (!product) return {}
  const name = lang === 'uk' ? product.nameUk : product.nameEn
  return {
    title: name,
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

  const d = dict as Record<string, Record<string, string>>
  const catalogDict = d['catalog'] ?? {}
  const commonDict = d['common'] ?? {}

  const { value: name, isPending: namePending } = getLocalizedName(product, lang)
  const { value: description } = getLocalizedDescription(product, lang)
  const price = formatPrice(product.priceCents, lang)

  const allergens = lang === 'uk' ? product.allergensUk : product.allergensEn

  const fulfillmentLabels = (
    (d['catalog'] as unknown as Record<string, Record<string, string>>)?.['fulfillment'] ?? {}
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <a
        href={`/${lang}/catalog`}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        ← {commonDict['back']}
      </a>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Photos */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100">
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
              <div className="absolute inset-0 flex items-center justify-center text-6xl">🥐</div>
            )}
          </div>
          {product.photos.length > 1 && (
            <div className="flex gap-2">
              {product.photos.slice(1, 4).map((photo, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100">
                  <Image src={photo} alt={`${name} ${i + 2}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {name}
              {namePending && (
                <span className="ml-2 text-sm text-stone-400 font-normal">
                  ({catalogDict['translationPending']})
                </span>
              )}
            </h1>
            <p className="text-2xl font-bold text-amber-700 mt-1">{price}</p>
          </div>

          {description && (
            <p className="text-stone-600 leading-relaxed">{description}</p>
          )}

          {/* Dietary tags */}
          {product.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.dietaryTags.map((tag) => (
                <DietaryBadge key={tag} tag={tag} lang={lang} />
              ))}
            </div>
          )}

          {/* Fulfillment types */}
          <div className="flex flex-wrap gap-2">
            {product.fulfillmentTypes.map((type) => (
              <span
                key={type}
                className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium border border-stone-200"
              >
                {fulfillmentLabels[type] ?? type}
              </span>
            ))}
          </div>

          {/* Allergens — always from verified DB data, never AI-generated */}
          {allergens && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                {lang === 'uk' ? 'Алергени та склад' : 'Allergens & ingredients'}
              </p>
              <p className="text-sm text-amber-800">{allergens}</p>
              <p className="text-xs text-amber-600 mt-2">{catalogDict['allergenNote']}</p>
            </div>
          )}

          {/* Add to cart */}
          <div className="pt-2">
            <AddToCartButton productId={product.id} label={catalogDict['addToCart'] ?? ''} />
          </div>
        </div>
      </div>
    </div>
  )
}
