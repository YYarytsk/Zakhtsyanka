import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { colors, spacing, radius } from '@/lib/theme'
import { switchLocale, type Locale } from '@/lib/i18n'
import i18n from '@/lib/i18n'
import { formatMessage } from '@zakhtsyanka/shared/utils/i18n'

interface Customer {
  loyalty_balance_points: number
  preferred_language: string
  birthday_date: string | null
}

export default function AccountScreen() {
  const { t, i18n: i18nInst } = useTranslation()
  const router = useRouter()
  const lang = (i18nInst.language ?? 'uk') as Locale
  const isUk = lang === 'uk'

  const [user,     setUser]     = useState<{ email: string } | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUser({ email: user.email ?? '' })
      const { data } = await supabase
        .from('customers')
        .select('loyalty_balance_points, preferred_language, birthday_date')
        .eq('id', user.id)
        .single()
      setCustomer(data)
      setLoading(false)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null); setCustomer(null)
    router.replace('/')
  }

  async function handleToggleLang() {
    const next: Locale = lang === 'uk' ? 'en' : 'uk'
    await switchLocale(next)
  }

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.emoji}>👤</Text>
        <Text style={s.guestText}>
          {isUk ? 'Увійдіть, щоб бачити акаунт та бонуси' : 'Sign in to view your account and rewards'}
        </Text>
        <Pressable style={s.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={s.loginBtnText}>{t('nav.login')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={s.signupLink}>
            {isUk ? 'Ще немає акаунту? Зареєструватись' : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    )
  }

  const balanceStr = formatMessage(
    t('account.loyalty.balance'),
    { count: customer?.loyalty_balance_points ?? 0 },
    lang,
  )

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Profile */}
      <View style={s.card}>
        <Text style={s.email}>{user.email}</Text>
        <Pressable onPress={handleSignOut}>
          <Text style={s.signOut}>{t('nav.logout')}</Text>
        </Pressable>
      </View>

      {/* Loyalty */}
      {customer && (
        <View style={[s.card, s.loyaltyCard]}>
          <Text style={s.loyaltyLabel}>{t('account.loyalty.title')}</Text>
          <Text style={s.loyaltyBalance}>{balanceStr}</Text>
        </View>
      )}

      {/* Menu items */}
      {[
        {
          label: isUk ? '📦 Мої замовлення' : '📦 My orders',
          onPress: () => router.push('/(tabs)/orders'),
        },
        {
          label: isUk ? '🎂 Торт на замовлення' : '🎂 Custom cake',
          onPress: () => router.push('/custom-order'),
        },
        {
          label: isUk ? '🔄 Мої підписки' : '🔄 My subscriptions',
          onPress: () => Alert.alert(isUk ? 'Підписки' : 'Subscriptions', isUk ? 'Доступно в вебверсії' : 'Available in the web version'),
        },
      ].map(({ label, onPress }) => (
        <Pressable key={label} style={s.menuItem} onPress={onPress}>
          <Text style={s.menuLabel}>{label}</Text>
          <Text style={s.menuArrow}>›</Text>
        </Pressable>
      ))}

      {/* Language toggle */}
      <View style={s.card}>
        <View style={s.langRow}>
          <Text style={s.langLabel}>{isUk ? 'Мова / Language' : 'Language / Мова'}</Text>
          <View style={s.langToggle}>
            <Text style={[s.langOption, lang === 'uk' && s.langOptionActive]}>УК</Text>
            <Switch
              value={lang === 'en'}
              onValueChange={handleToggleLang}
              trackColor={{ false: colors.amber[200], true: colors.amber[200] }}
              thumbColor={colors.amber[600]}
            />
            <Text style={[s.langOption, lang === 'en' && s.langOptionActive]}>EN</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  content:         { padding: spacing.md, gap: spacing.sm },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: spacing.xl },
  emoji:           { fontSize: 48 },
  guestText:       { fontSize: 15, color: colors.stone[600], textAlign: 'center' },
  loginBtn:        { backgroundColor: colors.amber[600], paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.full, marginTop: 4 },
  loginBtnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  signupLink:      { fontSize: 13, color: colors.amber[700] },
  card:            { backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.stone[100] },
  loyaltyCard:     { backgroundColor: colors.amber[600], borderColor: colors.amber[600] },
  loyaltyLabel:    { fontSize: 12, color: colors.amber[100], fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  loyaltyBalance:  { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 4 },
  email:           { fontSize: 15, color: colors.stone[900], fontWeight: '600' },
  signOut:         { fontSize: 13, color: colors.red[500], marginTop: 8 },
  menuItem:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.stone[100] },
  menuLabel:       { fontSize: 15, color: colors.stone[800] },
  menuArrow:       { fontSize: 20, color: colors.stone[300] },
  langRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langLabel:       { fontSize: 14, color: colors.stone[700] },
  langToggle:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langOption:      { fontSize: 13, color: colors.stone[400], fontWeight: '600' },
  langOptionActive:{ color: colors.amber[700] },
})
