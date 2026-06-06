import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['uk', 'en'] as const
type SupportedLocale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: SupportedLocale = 'uk'
const LOCALE_COOKIE = 'NEXT_LOCALE'

function getLocaleFromRequest(request: NextRequest): SupportedLocale {
  // 1. Explicit cookie (user switched language)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookieLocale && LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale
  }

  // 2. Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  for (const segment of acceptLanguage.split(',')) {
    const tag = segment.split(';')[0]?.trim().toLowerCase()
    if (tag?.startsWith('uk')) return 'uk'
    if (tag?.startsWith('en')) return 'en'
  }

  return DEFAULT_LOCALE
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Already has a supported locale prefix — continue
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
  if (hasLocale) return NextResponse.next()

  // Redirect bare paths to the locale-prefixed version
  const locale = getLocaleFromRequest(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
