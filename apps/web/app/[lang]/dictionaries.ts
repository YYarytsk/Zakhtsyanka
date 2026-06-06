import 'server-only'

const dictionaries = {
  uk: () =>
    import('@zakhtsyanka/shared/locales/uk.json').then((m) => m.default) as Promise<
      Record<string, unknown>
    >,
  en: () =>
    import('@zakhtsyanka/shared/locales/en.json').then((m) => m.default) as Promise<
      Record<string, unknown>
    >,
}

export type SupportedLocale = keyof typeof dictionaries

export const LOCALES: SupportedLocale[] = ['uk', 'en']

export function hasLocale(lang: string): lang is SupportedLocale {
  return lang in dictionaries
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export async function getDictionary(lang: SupportedLocale) {
  return dictionaries[lang]()
}
