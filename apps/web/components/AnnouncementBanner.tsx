// Server Component — fetches store_settings with a 60s cache via fetch API.
// Rendered in the locale layout so it appears on every customer page.

import type { SupportedLocale } from '@/app/[lang]/dictionaries'

interface SettingsPayload {
  orders_paused:    boolean
  announcement_uk:  string | null
  announcement_en:  string | null
}

async function fetchPublicSettings(): Promise<SettingsPayload | null> {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !apiKey) return null

  try {
    const res = await fetch(
      `${url}/rest/v1/store_settings?select=orders_paused,announcement_uk,announcement_en&limit=1`,
      {
        headers: {
          apikey:        apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        next: { revalidate: 60, tags: ['store_settings'] },
      },
    )
    if (!res.ok) return null
    const rows = await res.json() as SettingsPayload[]
    return rows[0] ?? null
  } catch {
    return null
  }
}

interface AnnouncementBannerProps {
  lang: SupportedLocale
  checkoutDict?: Record<string, string>
}

export async function AnnouncementBanner({ lang, checkoutDict }: AnnouncementBannerProps) {
  const settings = await fetchPublicSettings()
  if (!settings) return null

  const announcement = lang === 'uk' ? settings.announcement_uk : settings.announcement_en

  // Orders paused banner (red, most urgent)
  if (settings.orders_paused) {
    const msg = lang === 'uk'
      ? 'Онлайн-замовлення тимчасово призупинено. Вибачте за незручності.'
      : 'Online ordering is temporarily paused. Sorry for the inconvenience.'

    return (
      <div className="bg-red-600 text-white px-4 py-2.5 text-center text-sm font-medium" role="alert">
        {msg}
      </div>
    )
  }

  // General announcement (amber)
  if (announcement) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800" role="status">
        {announcement}
      </div>
    )
  }

  return null
}
