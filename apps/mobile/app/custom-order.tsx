import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, spacing, radius } from '@/lib/theme'
import i18n from '@/lib/i18n'

// Full custom order form is on the web — deep-link customers there.
// Mobile version shows a "continue in browser" prompt.
export default function CustomOrderScreen() {
  const { t } = useTranslation()
  const lang  = i18n.language ?? 'uk'
  const isUk  = lang === 'uk'
  const webUrl = `${process.env.EXPO_PUBLIC_API_URL}/${lang}/custom-order`

  return (
    <View style={s.container}>
      <Text style={s.emoji}>🎂</Text>
      <Text style={s.title}>{t('customRequest.title')}</Text>
      <Text style={s.subtitle}>{t('customRequest.subtitle')}</Text>
      <Pressable style={s.btn} onPress={() => Linking.openURL(webUrl)}>
        <Text style={s.btnText}>
          {isUk ? 'Заповнити форму в браузері' : 'Fill out form in browser'}
        </Text>
      </Pressable>
      <Text style={s.note}>
        {isUk
          ? 'Для завантаження фото-референсу відкрийте сайт у браузері.'
          : 'To upload reference photos, open the website in your browser.'}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emoji:     { fontSize: 56 },
  title:     { fontSize: 22, fontWeight: '700', color: colors.stone[900], textAlign: 'center' },
  subtitle:  { fontSize: 14, color: colors.stone[500], textAlign: 'center', lineHeight: 20 },
  btn:       { backgroundColor: colors.amber[600], paddingHorizontal: 28, paddingVertical: 14, borderRadius: radius.full },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  note:      { fontSize: 12, color: colors.stone[400], textAlign: 'center' },
})
