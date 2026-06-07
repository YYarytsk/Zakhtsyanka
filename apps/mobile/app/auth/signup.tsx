import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { colors, spacing, radius } from '@/lib/theme'
import i18n from '@/lib/i18n'

export default function SignupScreen() {
  const router = useRouter()
  const lang   = i18n.language ?? 'uk'
  const isUk   = lang === 'uk'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)

  async function handleSignup() {
    if (!email || !password) return
    if (password.length < 8) {
      Alert.alert('', isUk ? 'Пароль має бути не менше 8 символів' : 'Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { preferred_language: lang } },
    })
    setLoading(false)
    if (error) { Alert.alert('', error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <View style={s.center}>
        <Text style={s.sentEmoji}>✉️</Text>
        <Text style={s.sentTitle}>{isUk ? 'Перевірте пошту' : 'Check your email'}</Text>
        <Text style={s.sentText}>
          {isUk ? `Ми надіслали посилання для підтвердження на ${email}` : `We sent a confirmation link to ${email}`}
        </Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>{isUk ? 'Зрозуміло' : 'Got it'}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{isUk ? 'Реєстрація' : 'Create account'}</Text>
        <Text style={s.subtitle}>
          {isUk ? 'Зберігайте замовлення та накопичуйте бонуси' : 'Save orders and earn loyalty rewards'}
        </Text>

        <View style={s.form}>
          <View>
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="your@email.com" placeholderTextColor={colors.stone[400]}
              keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View>
            <Text style={s.label}>{isUk ? 'Пароль' : 'Password'}</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder={isUk ? 'Мінімум 8 символів' : 'At least 8 characters'}
              placeholderTextColor={colors.stone[400]} secureTextEntry />
          </View>

          <Pressable style={s.submitBtn} onPress={handleSignup} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitBtnText}>{isUk ? 'Зареєструватись' : 'Create account'}</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/auth/login')}>
          <Text style={s.switchText}>
            {isUk ? 'Вже є акаунт? ' : 'Already have an account? '}
            <Text style={s.switchLink}>{isUk ? 'Увійти' : 'Sign in'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  content:      { padding: spacing.xl, justifyContent: 'center', gap: spacing.lg, flexGrow: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  sentEmoji:    { fontSize: 48 },
  sentTitle:    { fontSize: 22, fontWeight: '700', color: colors.stone[900] },
  sentText:     { fontSize: 14, color: colors.stone[500], textAlign: 'center' },
  backBtn:      { backgroundColor: colors.amber[600], paddingHorizontal: 32, paddingVertical: 12, borderRadius: radius.full },
  backBtnText:  { color: '#fff', fontWeight: '700' },
  title:        { fontSize: 26, fontWeight: '700', color: colors.stone[900] },
  subtitle:     { fontSize: 15, color: colors.stone[500], marginTop: -spacing.sm },
  form:         { gap: spacing.md },
  label:        { fontSize: 13, fontWeight: '500', color: colors.stone[600], marginBottom: 6 },
  input:        { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1, borderColor: colors.stone[300], paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.stone[900] },
  submitBtn:    { backgroundColor: colors.amber[600], borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText:   { textAlign: 'center', fontSize: 14, color: colors.stone[500] },
  switchLink:   { color: colors.amber[700], fontWeight: '600' },
})
