import type { Locale, Product, StoreSettings } from '../types/index.js'

// ── Price formatting ───────────────────────────────────────────────────────
// Currency is always ₴ (hryvnia); only formatting changes with locale.
export function formatPrice(cents: number, locale: Locale): string {
  const amount = cents / 100
  return new Intl.NumberFormat(locale === 'uk' ? 'uk-UA' : 'en-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ── Date / time formatting ─────────────────────────────────────────────────
export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoDate))
}

export function formatDateTime(isoDatetime: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDatetime))
}

export function formatTime(isoDatetime: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-UA', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDatetime))
}

// ── Localized field helpers ────────────────────────────────────────────────
// Returns the correct language field, falling back to the other language
// with a "translation pending" marker rather than an empty string.
export function getLocalizedName(
  product: Pick<Product, 'nameUk' | 'nameEn'>,
  locale: Locale,
): { value: string; isPending: boolean } {
  const primary = locale === 'uk' ? product.nameUk : product.nameEn
  const fallback = locale === 'uk' ? product.nameEn : product.nameUk

  if (primary) return { value: primary, isPending: false }
  return { value: fallback, isPending: true }
}

export function getLocalizedDescription(
  product: Pick<Product, 'descriptionUk' | 'descriptionEn'>,
  locale: Locale,
): { value: string; isPending: boolean } {
  const primary = locale === 'uk' ? product.descriptionUk : product.descriptionEn
  const fallback = locale === 'uk' ? product.descriptionEn : product.descriptionUk

  if (primary) return { value: primary, isPending: false }
  return { value: fallback, isPending: true }
}

export function getStoreName(settings: Pick<StoreSettings, 'nameUk' | 'nameEn'>, locale: Locale): string {
  return locale === 'uk' ? settings.nameUk : settings.nameEn
}

// ── Slug ───────────────────────────────────────────────────────────────────
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
