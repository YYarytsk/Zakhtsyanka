import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary, hasLocale } from '../dictionaries'
import type { SupportedLocale } from '@/app/[lang]/dictionaries'

// Gallery items are publicly readable — use the anon key via REST, no service role needed.
async function fetchGallery(tag?: string): Promise<GalleryItem[]> {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return []

  let endpoint = `${url}/rest/v1/gallery?select=id,caption_uk,caption_en,photos,tags&is_published=eq.true&order=sort_order`
  if (tag) endpoint += `&tags=cs.{${tag}}`

  try {
    const res = await fetch(endpoint, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return (await res.json()) as GalleryItem[]
  } catch {
    return []
  }
}

interface GalleryItem {
  id: string
  caption_uk: string
  caption_en: string
  photos: string[]
  tags: string[]
}

const TAG_LABELS: Record<string, { uk: string; en: string }> = {
  wedding:    { uk: 'Весілля',       en: 'Wedding' },
  birthday:   { uk: 'День народження', en: 'Birthday' },
  children:   { uk: 'Дитячий',      en: 'Children' },
  corporate:  { uk: 'Корпоратив',   en: 'Corporate' },
  chocolate:  { uk: 'Шоколадний',   en: 'Chocolate' },
  seasonal:   { uk: 'Сезонне',      en: 'Seasonal' },
  christmas:  { uk: 'Різдво',       en: 'Christmas' },
  easter:     { uk: 'Великдень',    en: 'Easter' },
  custom:     { uk: 'Авторські',    en: 'Custom' },
  floral:     { uk: 'Квіткові',     en: 'Floral' },
  romantic:   { uk: 'Романтичні',   en: 'Romantic' },
}

export default async function GalleryPage(props: PageProps<'/[lang]/gallery'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const sp = await props.searchParams
  const activeTag = typeof sp['tag'] === 'string' ? sp['tag'] : null

  const gallery = await fetchGallery(activeTag ?? undefined)

  // Collect all tags from all items for filter bar
  const allTags = [...new Set(gallery.flatMap((g) => g.tags).filter((t) => t in TAG_LABELS))]

  const isUk = lang === 'uk'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-3">
          {isUk ? 'Галерея наших тортів' : 'Our cake gallery'}
        </h1>
        <p className="text-stone-500 max-w-lg mx-auto text-sm leading-relaxed">
          {isUk
            ? 'Кожен торт — авторський. Надихайтесь і замовляйте власний шедевр.'
            : 'Every cake is one of a kind. Browse for inspiration and order your own masterpiece.'}
        </p>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <Link
            href={`/${lang}/gallery` as any}
            className={['px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              !activeTag ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'].join(' ')}
          >
            {isUk ? 'Усі' : 'All'}
          </Link>
          {allTags.map((tag) => (
            <Link
              key={tag}
              href={`/${lang}/gallery?tag=${tag}` as any}
              className={['px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTag === tag ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'].join(' ')}
            >
              {TAG_LABELS[tag]?.[lang as SupportedLocale] ?? tag}
            </Link>
          ))}
        </div>
      )}

      {/* Masonry-style grid */}
      {gallery.length === 0 ? (
        <p className="text-center text-stone-400 py-16">
          {isUk ? 'Немає робіт у цій категорії' : 'No items in this category'}
        </p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {gallery.map((item) => (
            <div key={item.id} className="break-inside-avoid bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow group">
              {/* Primary photo */}
              {item.photos[0] && (
                <div className="relative overflow-hidden">
                  <Image
                    src={item.photos[0]}
                    alt={isUk ? item.caption_uk : item.caption_en}
                    width={600}
                    height={450}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Additional photos count */}
                  {item.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      +{item.photos.length - 1}
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-medium text-stone-900">
                  {isUk ? item.caption_uk : item.caption_en}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.filter((t) => t in TAG_LABELS).map((tag) => (
                      <span key={tag} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {TAG_LABELS[tag]?.[lang as SupportedLocale] ?? tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="text-center mt-12 bg-amber-50 rounded-2xl border border-amber-100 p-8">
        <h2 className="text-xl font-bold text-stone-900 mb-2">
          {isUk ? 'Хочете свій унікальний торт?' : 'Want your own unique cake?'}
        </h2>
        <p className="text-stone-500 text-sm mb-5">
          {isUk
            ? 'Заповніть форму — ми зв\'яжемось з вами протягом 24 годин.'
            : 'Fill in the form — we\'ll get back to you within 24 hours.'}
        </p>
        <Link
          href={`/${lang}/custom-order` as any}
          className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-amber-700 transition-colors"
        >
          {isUk ? 'Замовити торт' : 'Order a custom cake'}
        </Link>
      </div>
    </div>
  )
}
