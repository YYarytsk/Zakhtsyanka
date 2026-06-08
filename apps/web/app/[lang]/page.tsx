import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary, hasLocale } from './dictionaries'
import { getProducts } from '@/lib/db/products'
import { getLocalizedName, formatPrice } from '@zakhtsyanka/shared/utils'

type Locale = 'uk' | 'en'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lp = (lang: string, path: string) => `/${lang}/${path}` as any

export default async function HomePage(props: PageProps<'/[lang]'>) {
  const { lang } = await props.params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)
  const d = dict as Record<string, Record<string, string>>
  const isUk = lang === 'uk'

  const storeName = isUk
    ? process.env.NEXT_PUBLIC_STORE_NAME_UK ?? 'Захцянка'
    : process.env.NEXT_PUBLIC_STORE_NAME_EN ?? 'Zakhtsyanka'

  // Fetch a few bestselling products for the featured section
  const allProducts = await getProducts({ availableOnly: true }).catch(() => [])
  const featured = allProducts.slice(0, 4)

  const categories = [
    {
      slug: 'bread',
      label: isUk ? 'Хліб' : 'Bread',
      desc:  isUk ? 'На заквасці, багети, фокача' : 'Sourdough, baguettes, focaccia',
      img:   'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
      emoji: '🍞',
    },
    {
      slug: 'pastries',
      label: isUk ? 'Випічка' : 'Pastries',
      desc:  isUk ? 'Круасани, еклери, ватрушки' : 'Croissants, éclairs, buns',
      img:   'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
      emoji: '🥐',
    },
    {
      slug: 'cakes',
      label: isUk ? 'Торти' : 'Cakes',
      desc:  isUk ? 'Медівник, Наполеон, чізкейк' : 'Honey cake, Napoleon, cheesecake',
      img:   'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
      emoji: '🎂',
    },
  ]

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1600&q=85"
          alt="Bakery"
          fill
          className="object-cover object-center scale-105"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-900/50 to-stone-950/70" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p className="text-amber-400 text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            {isUk ? 'Ручна робота · Щодня свіже' : 'Handmade · Fresh daily'}
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
            {storeName}
          </h1>
          <p className="text-stone-200 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            {isUk
              ? 'Авторська випічка, що пахне домом. Тут кожен виріб — з душею та любов\'ю.'
              : 'Artisan baking that smells like home. Every piece made with heart.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={lp(lang, 'catalog')}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-full text-base transition-all duration-200 shadow-lg hover:shadow-amber-400/40 hover:-translate-y-0.5"
            >
              {isUk ? 'Переглянути меню' : 'Browse menu'} →
            </Link>
            <Link
              href={lp(lang, 'custom-order')}
              className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-full text-base backdrop-blur-sm border border-white/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              {isUk ? 'Торт на замовлення' : 'Custom cake'}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <span className="text-xs tracking-widest uppercase">{isUk ? 'Гортайте' : 'Scroll'}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">
              {isUk ? 'Наш асортимент' : 'Our selection'}
            </h2>
            <p className="text-stone-500 max-w-md mx-auto">
              {isUk
                ? 'Від ранкового хліба до святкового торту — знайдіть своє'
                : 'From morning bread to celebration cakes — find your favourite'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${lang}/catalog?category=${cat.slug}` as any}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] block"
              >
                <Image
                  src={cat.img}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                {/* Dark gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-2xl mb-1">{cat.emoji}</p>
                  <h3 className="text-xl font-bold text-white mb-1">{cat.label}</h3>
                  <p className="text-stone-300 text-sm">{cat.desc}</p>
                  <span className="inline-block mt-3 text-amber-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                    {isUk ? 'Переглянути' : 'Browse'} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 mb-2">
                  {isUk ? 'Бестселери' : 'Bestsellers'}
                </h2>
                <p className="text-stone-500">
                  {isUk ? 'Те, що замовляють найчастіше' : 'What people order most'}
                </p>
              </div>
              <Link
                href={lp(lang, 'catalog')}
                className="hidden sm:inline-block text-amber-700 font-semibold hover:text-amber-600 transition-colors text-sm"
              >
                {isUk ? 'Усе меню →' : 'Full menu →'}
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((p) => {
                const { value: name } = getLocalizedName(p, lang as Locale)
                const price = formatPrice(p.priceCents, lang as Locale)
                return (
                  <Link
                    key={p.id}
                    href={`/${lang}/catalog/${p.slug}` as any}
                    className="group flex flex-col rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 hover:shadow-xl hover:shadow-stone-200/60 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {p.photos[0] ? (
                        <Image
                          src={p.photos[0]}
                          alt={name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-amber-50">🥐</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <p className="font-semibold text-stone-900 text-sm leading-snug line-clamp-2">{name}</p>
                      <p className="text-amber-700 font-bold text-sm">{price}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link href={lp(lang, 'catalog')}
                className="inline-block text-amber-700 font-semibold">
                {isUk ? 'Усе меню →' : 'Full menu →'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY TEASER ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-900 mb-3">
            {isUk ? 'Наші роботи' : 'Our work'}
          </h2>
          <p className="text-stone-500 mb-10 max-w-md mx-auto">
            {isUk
              ? 'Кожен торт — авторський. Надихайтесь і замовляйте свій.'
              : 'Every cake is one of a kind. Browse for inspiration.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {[
              'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=600&q=80',
              'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
              'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&q=80',
            ].map((src, i) => (
              <div key={i} className={`relative overflow-hidden rounded-2xl ${i === 2 ? 'hidden sm:block' : ''}`}>
                <div className="aspect-square">
                  <Image src={src} alt="Gallery" fill className="object-cover hover:scale-105 transition-transform duration-500" sizes="33vw" />
                </div>
              </div>
            ))}
          </div>
          <Link href={lp(lang, 'gallery')}
            className="inline-block px-8 py-3 border-2 border-amber-600 text-amber-700 font-semibold rounded-full hover:bg-amber-600 hover:text-white transition-all duration-200">
            {isUk ? 'Вся галерея' : 'View gallery'}
          </Link>
        </div>
      </section>

      {/* ── CUSTOM CAKE CTA ──────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&q=80"
          alt="Custom cake"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-stone-900/75" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
            {isUk ? 'Індивідуальне замовлення' : 'Custom orders'}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            {isUk ? 'Ваш торт — ваша ідея' : 'Your cake, your vision'}
          </h2>
          <p className="text-stone-300 text-lg mb-10">
            {isUk
              ? 'Заповніть форму, ми зв\'яжемось протягом 24 годин та запропонуємо ціну.'
              : 'Fill in the form, we\'ll get back within 24 hours with a quote.'}
          </p>
          <Link
            href={lp(lang, 'custom-order')}
            className="inline-block px-10 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-amber-500/40 hover:-translate-y-0.5"
          >
            {isUk ? 'Замовити торт' : 'Order a custom cake'}
          </Link>
        </div>
      </section>

    </div>
  )
}
