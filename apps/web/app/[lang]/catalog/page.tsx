import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getDictionary, hasLocale } from '../dictionaries'
import { getProducts } from '@/lib/db/products'
import { getCategories } from '@/lib/db/categories'
import { ProductCard } from '@/components/catalog/ProductCard'
import { CategoryNav } from '@/components/catalog/CategoryNav'
import { FilterChips } from '@/components/catalog/FilterChips'
import { SearchInput } from '@/components/catalog/SearchInput'
import type { FulfillmentType } from '@zakhtsyanka/shared/types'

export default async function CatalogPage(props: PageProps<'/[lang]/catalog'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const sp = await props.searchParams
  const categorySlug = typeof sp['category'] === 'string' ? sp['category'] : undefined
  const rawTags = sp['tags']
  const dietaryTags = Array.isArray(rawTags)
    ? rawTags
    : rawTags
    ? [rawTags]
    : []
  const query = typeof sp['q'] === 'string' ? sp['q'] : undefined
  const fulfillmentType = typeof sp['fulfillment'] === 'string'
    ? (sp['fulfillment'] as FulfillmentType)
    : undefined

  const [dict, categories, products] = await Promise.all([
    getDictionary(lang),
    getCategories(),
    getProducts({ categorySlug, dietaryTags, fulfillmentType, query }),
  ])

  const d = dict as unknown as Record<string, Record<string, string>>
  const catalogDict = d['catalog'] ?? {}
  const filtersDict = (d['catalog'] as unknown as Record<string, Record<string, string>>)?.['filters'] ?? {}

  const dietaryOptions = [
    { key: 'vegan',        label: filtersDict['vegan'] ?? 'Vegan' },
    { key: 'vegetarian',   label: filtersDict['vegetarian'] ?? 'Vegetarian' },
    { key: 'gluten-free',  label: filtersDict['glutenFree'] ?? 'GF' },
    { key: 'nut-free',     label: filtersDict['nutFree'] ?? 'NF' },
    { key: 'dairy-free',   label: filtersDict['dairyFree'] ?? 'DF' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">{catalogDict['title']}</h1>

      {/* Search + filters */}
      <div className="flex flex-col gap-4 mb-8">
        <Suspense>
          <SearchInput
            placeholder={catalogDict['searchPlaceholder'] ?? ''}
            lang={lang}
            defaultValue={query}
          />
        </Suspense>

        <CategoryNav
          categories={categories}
          activeSlug={categorySlug ?? null}
          lang={lang}
          allLabel={filtersDict['all'] ?? 'All'}
        />

        <Suspense>
          <FilterChips
            options={dietaryOptions}
            activeKeys={dietaryTags}
            paramName="tags"
            lang={lang}
          />
        </Suspense>
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <p className="text-stone-500 py-12 text-center">{catalogDict['noResults']}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} dict={d} />
          ))}
        </div>
      )}
    </div>
  )
}
