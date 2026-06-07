import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Shared translation catalogs — same files as the web app
import uk from '@zakhtsyanka/shared/locales/uk.json'
import en from '@zakhtsyanka/shared/locales/en.json'

export type Locale = 'uk' | 'en'
export const SUPPORTED: Locale[] = ['uk', 'en']
const STORAGE_KEY = 'app_locale'

function detectLocale(): Locale {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'uk'
  return tag.startsWith('uk') ? 'uk' : 'en'
}

export async function initI18n() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)
  const lng: Locale = (stored === 'uk' || stored === 'en') ? stored : detectLocale()

  await i18n.use(initReactI18next).init({
    resources: {
      uk: { translation: uk as Record<string, unknown> },
      en: { translation: en as Record<string, unknown> },
    },
    lng,
    fallbackLng: 'uk',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  })

  return lng
}

export async function switchLocale(locale: Locale) {
  await i18n.changeLanguage(locale)
  await AsyncStorage.setItem(STORAGE_KEY, locale)
}

export default i18n
